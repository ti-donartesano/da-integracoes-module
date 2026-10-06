import { pool } from '../db.js';

export default async function integrationRoutes(fastify, options) {
  fastify.get('/api/integrations', async (request, reply) => {
    const [rows] = await pool.query('SELECT id, slug, display_name, provider, config, status, last_refresh_at, error_message, created_at, updated_at FROM integrations');
    return rows;
  });

  fastify.post('/api/integrations', async (request, reply) => {
    const { slug, display_name, provider, config } = request.body;
    await pool.query(
      'INSERT INTO integrations (slug, display_name, provider, config) VALUES (?, ?, ?, ?)',
      [slug, display_name, provider, JSON.stringify(config)]
    );
    return reply.code(201).send({ message: 'Integration created successfully' });
  });

  fastify.put('/api/integrations/:slug', async (request, reply) => {
    const { slug } = request.params;
    const { config } = request.body;
    const [result] = await pool.query(
      'UPDATE integrations SET config = ? WHERE slug = ?',
      [JSON.stringify(config), slug]
    );
    if (result.affectedRows === 0) {
      return reply.code(404).send({ error: 'Integration not found' });
    }
    return { message: 'Integration updated successfully' };
  });

  fastify.get('/api/integrations/:slug/token', async (request, reply) => {
    const { slug } = request.params;
    const internalKey = request.headers['x-internal-key'];

    if (!internalKey || internalKey !== process.env.INTERNAL_KEY) {
      return reply.code(403).send({ error: 'Forbidden: Invalid internal key' });
    }

    const [rows] = await pool.query('SELECT tokens FROM integrations WHERE slug = ?', [slug]);
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'Integration not found' });
    }

    return rows[0].tokens || {};
  });

  // Proxy for Tiny ERP
  fastify.all('/api/proxy/tiny/*', async (request, reply) => {
    // SECURITY CHECK: Ensure caller has the internal secret
    const internalSecret = request.headers['x-internal-secret'];
    const expectedSecret = process.env.INTERNAL_SECRET;

    if (!expectedSecret || internalSecret !== expectedSecret) {
      return reply.code(403).send({ error: 'Acesso proxy negado. Verifique o header x-internal-secret.' });
    }

    // This proxy is dedicated to the 'tiny' integration.
    const slug = 'tiny';
    const [rows] = await pool.query('SELECT tokens FROM integrations WHERE slug = ?', [slug]);

    if (rows.length === 0 || !rows[0].tokens) {
      return reply.code(401).send({ error: 'Tiny integration not configured or not authorized' });
    }

    let tokens = typeof rows[0].tokens === 'string' ? JSON.parse(rows[0].tokens) : rows[0].tokens;

    // We should ideally check expiration and refresh here using refreshTinyToken(slug)
    // For simplicity, we just use the access token. If it fails, the caller handles it,
    // or we refresh it proactively.
    const accessToken = tokens.access_token;

    const targetPath = request.url.replace('/api/proxy/tiny', '');
    const targetUrl = "https://api.tiny.com.br/public-api/v3" + targetPath;

    // Filter headers
    const headers = { ...request.headers };
    delete headers.host;
    delete headers.connection;
    headers['Authorization'] = 'Bearer ' + accessToken;

    const fetchOptions = {
      method: request.method,
      headers,
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(request.body);
    }

    try {
      const response = await fetch(targetUrl, fetchOptions);
      const data = await response.text();
      reply.code(response.status).headers(response.headers).send(data);
    } catch (err) {
      reply.code(500).send({ error: 'Proxy error', details: err.message });
    }
  });
}
