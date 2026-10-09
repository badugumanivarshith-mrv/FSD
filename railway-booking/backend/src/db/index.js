import 'dotenv/config';
import pg from 'pg';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function isPastDate(date) {
  const { rows } = await pool.query('SELECT $1::date < CURRENT_DATE AS past', [date]);
  return rows[0].past;
}
