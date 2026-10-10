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

router.get('/trains/:id/seats', wrap(async (req, res) => {
  const trainId = Number(req.params.id);
  const date = String(req.query.date || '');
  if (!Number.isInteger(trainId)) return res.status(400).json({ error: 'Invalid train ID' });
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Invalid or missing journey date' });
  if (await isPastDate(date)) return res.status(400).json({ error: 'Travel date is in the past' });

  const trainRes = await pool.query(
    `SELECT t.id, t.number, t.name, t.total_seats, t.fare_per_seat, t.departs, t.arrives,
            s.name AS source, d.name AS destination
     FROM trains t
     JOIN stations s ON s.id = t.source_id
     JOIN stations d ON d.id = t.dest_id
     WHERE t.id = $1`,
    [trainId]
  );
  if (trainRes.rows.length === 0) return res.status(404).json({ error: 'Train not found' });
  const train = trainRes.rows[0];

  const bookedRes = await pool.query(
    `SELECT DISTINCT p.seat_number
     FROM passengers p
     JOIN bookings b ON b.id = p.booking_id
     WHERE b.train_id = $1 AND b.journey_date = $2 AND b.status = 'CONFIRMED'
     ORDER BY p.seat_number`,
    [trainId, date]
  );
  const bookedSeats = bookedRes.rows.map((r) => r.seat_number);

  res.json({
    train,
    bookedSeats,
    totalSeats: train.total_seats,
    availableSeatsCount: train.total_seats - bookedSeats.length,
  });
}));

export default router;
