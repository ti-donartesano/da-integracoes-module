import { pool } from './db.js';
import { refreshTinyToken } from './services/tinyAuth.js';

export function startJobs() {
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  setInterval(async () => {
    console.log('[JOB] Starting token refresh job for active Tiny integrations...');
    try {
      const [rows] = await pool.query('SELECT slug FROM integrations WHERE status = "active" AND provider = "tiny"');
      for (const row of rows) {
        try {
          await refreshTinyToken(row.slug);
          console.log(`[JOB] Successfully refreshed token for ${row.slug}`);
        } catch (err) {
          console.error(`[JOB] Failed to refresh token for ${row.slug}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[JOB] Error running token refresh job:', err.message);
    }
  }, TWO_HOURS_MS);

  console.log('[JOB] Token refresh job scheduled (every 2 hours).');
}
