import dotenv from 'dotenv';
import { initDb } from './db.js';
import { startJobs } from './jobs.js';
import { buildApp } from './app.js';

dotenv.config();

async function start() {
  try {
    await initDb();
    const fastify = await buildApp();
    startJobs();

    const port = process.env.PORT || 4001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
