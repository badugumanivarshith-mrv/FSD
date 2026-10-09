import { Router } from 'express';
import { pool, isPastDate } from '../db/index.js';
import { wrap } from '../middleware/wrap.js';

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get('/stations', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT id, code, name FROM stations ORDER BY name');
  res.json({ stations: rows });
}));

router.get('/trains/search', wrap(async (req, res) => {
  const from = Number(req.query.from);
  const to = Number(req.query.to);
  const date = String(req.query.date || '');
  if (!Number.isInteger(from) || !Number.isInteger(to)) return res.status(400).json({ error: 'Choose both stations' });
  if (from === to) return res.status(400).json({ error: 'Source and destination must differ' });
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Choose a travel date' });
  if (await isPastDate(date)) return res.status(400).json({ error: 'Travel date is in the past' });

  const { rows } = await pool.query(
    `SELECT t.id, t.number, t.name, t.departs, t.arrives, t.fare_per_seat,
            s.name AS source, d.name AS destination,
            t.total_seats - COALESCE((
              SELECT SUM(b.seat_count) FROM bookings b
              WHERE b.train_id = t.id AND b.journey_date = $3 AND b.status = 'CONFIRMED'
            ), 0)::int AS available_seats
     FROM trains t
     JOIN stations s ON s.id = t.source_id
     JOIN stations d ON d.id = t.dest_id
     WHERE t.source_id = $1 AND t.dest_id = $2
     ORDER BY t.departs`,
    [from, to, date]
  );
  res.json({ trains: rows });
}));

export default router;
