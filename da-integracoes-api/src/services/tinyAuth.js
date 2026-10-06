import { pool } from '../db.js';

export async function refreshTinyToken(slug) {
  const [rows] = await pool.query('SELECT config, tokens FROM integrations WHERE slug = ? AND provider = "tiny"', [slug]);
  if (!rows || rows.length === 0) {
    throw new Error('Integration not found or not Tiny provider');
  }

  const { config, tokens } = rows[0];
  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.client_id,
      refresh_token: tokens.refresh_token,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    await pool.query('UPDATE integrations SET status = "error", error_message = ? WHERE slug = ?', [errText, slug]);
    throw new Error(`Failed to refresh token: ${errText}`);
  }

  const data = await response.json();
  const updatedTokens = {
    ...tokens,
    ...data,
  };

  await pool.query(
    'UPDATE integrations SET tokens = ?, status = "active", last_refresh_at = NOW(), error_message = NULL WHERE slug = ?',
    [JSON.stringify(updatedTokens), slug]
  );

  return updatedTokens;
}
