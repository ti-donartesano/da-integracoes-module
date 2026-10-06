import Fastify from 'fastify';
import cors from '@fastify/cors';
import integrationRoutes from './routes/integrations.js';
import authRoutes from './routes/auth.js';

export async function buildApp(opts = {}) {
  const fastify = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV === 'test' ? false : true),
  });

  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  fastify.register(integrationRoutes);
  fastify.register(authRoutes);

  // Healthcheck para testes e monitoramento
  fastify.get('/health', async () => ({ status: 'ok', service: 'da-integracoes-api' }));

  return fastify;
}
