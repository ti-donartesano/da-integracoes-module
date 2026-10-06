import { pool } from '../db.js';
import { refreshTinyToken } from '../services/tinyAuth.js';

export default async function authRoutes(fastify, options) {
  // We need the slug in query params to know which integration to use for OAuth, or we default to a known one.
  // For simplicity, we can expect ?slug=...
  fastify.get('/auth/tiny', async (request, reply) => {
    const { slug, redirect_uri } = request.query;
    if (!slug || !redirect_uri) {
      return reply.code(400).send({ error: 'Missing slug or redirect_uri' });
    }

    const [rows] = await pool.query('SELECT config FROM integrations WHERE slug = ? AND provider = "tiny"', [slug]);
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'Integracao nao encontrada. Salve as configuracoes primeiro.' });
    }

    const config = typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config;
    const clientId = config?.client_id || config?.clientId;

    if (!clientId) {
      return reply.code(400).send({ error: 'Client ID nao configurado. Clique em "Configurar" na tela de Integracoes e preencha suas credenciais do Tiny.' });
    }
    // Pass slug as state so we know which integration to update on callback
    const state = Buffer.from(JSON.stringify({ slug, redirect_uri })).toString('base64');

    const authUrl = new URL('https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirect_uri);
    authUrl.searchParams.append('scope', 'openid');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);

    return reply.redirect(authUrl.toString());
  });

  fastify.get('/auth/tiny/callback', async (request, reply) => {
    const { code, state } = request.query;
    if (!code || !state) {
      return reply.code(400).send({ error: 'Missing code or state' });
    }

    let decodedState;
    try {
      decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch (err) {
      return reply.code(400).send({ error: 'Invalid state' });
    }

    const { slug, redirect_uri } = decodedState;

    const [rows] = await pool.query('SELECT config FROM integrations WHERE slug = ?', [slug]);
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'Integration not found' });
    }

    const clientId = rows[0].config.client_id;
    // Assume client_secret might be needed, or it's public client. Tiny requires it usually, maybe in config.
    // If we only have client_id as per requirement:
    
    const tokenResponse = await fetch('https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      return reply.code(500).send({ error: 'Token exchange failed', details: errText });
    }

    const tokens = await tokenResponse.json();

        await pool.query(
      'UPDATE integrations SET tokens = ?, status = "active", last_refresh_at = NOW(), error_message = NULL WHERE slug = ?',
      [JSON.stringify(tokens), slug]
    );

    // Redirect the user back to the central dashboard integrations page instead of returning JSON
    return reply.redirect('https://central.donartesano.com.br/integracoes');
  });

  fastify.post('/api/integrations/tiny/refresh', async (request, reply) => {
    const { slug } = request.body;
    if (!slug) {
      return reply.code(400).send({ error: 'Missing slug' });
    }

    try {
      const updatedTokens = await refreshTinyToken(slug);
      return { message: 'Token refreshed', tokens: updatedTokens };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}

