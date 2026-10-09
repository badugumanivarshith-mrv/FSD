import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './index.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
try {
  await pool.query(fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8'));
  await pool.query(fs.readFileSync(path.join(dir, 'seed.sql'), 'utf8'));
  console.log('Database reset and seeded.');
} catch (err) {
  console.error('db:init failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
