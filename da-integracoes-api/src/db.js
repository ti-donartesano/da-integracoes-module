import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'mysql://mysql:5c1e0fb9ad2d1a04a09095be929ee8c9fff074a6@localhost:3306/dondado';

export const pool = mysql.createPool(connectionString);

export async function initDb() {
  const query = `
    CREATE TABLE IF NOT EXISTS integrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      config JSON NOT NULL,
      tokens JSON DEFAULT NULL,
      status ENUM('active','expired','error','disconnected') DEFAULT 'disconnected',
      last_refresh_at DATETIME DEFAULT NULL,
      error_message TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
  await pool.query(`
    INSERT IGNORE INTO integrations (slug, display_name, provider, config, status)
    VALUES ('tiny', 'Tiny ERP', 'tiny', '{}', 'disconnected')
  `);
  console.log('Database initialized');
}
