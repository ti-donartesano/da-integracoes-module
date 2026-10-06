import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../../src/app.js';

describe('Testes Unitários de Integrações via fastify.inject()', () => {
  let app;

  before(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /health deve responder 200 com status ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.status, 'ok');
  });

  test('GET /api/integrations/tiny/token sem X-Internal-Key deve retornar 403 Forbidden', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/integrations/tiny/token',
    });

    assert.equal(res.statusCode, 403);
    const body = JSON.parse(res.payload);
    assert.ok(body.error.includes('Forbidden'));
  });
});
