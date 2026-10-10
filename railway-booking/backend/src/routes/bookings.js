import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { pool, isPastDate } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../middleware/wrap.js';

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PASSENGERS = 6;

router.use(requireAuth);

router.post('/', wrap(async (req, res) => {
  const { trainId, journeyDate, passengers } = req.body;
  if (!Number.isInteger(trainId) || !DATE_RE.test(journeyDate || '')) {
    return res.status(400).json({ error: 'Invalid train or date' });
  }
  if (!Array.isArray(passengers) || passengers.length < 1 || passengers.length > MAX_PASSENGERS) {
    return res.status(400).json({ error: `Add 1 to ${MAX_PASSENGERS} passengers` });
  }
  const clean = passengers.map((p) => ({
    name: String(p?.name || '').trim(),
    age: Number(p?.age),
    seatNumber: Number(p?.seatNumber),
  }));
  if (clean.some((p) => !p.name || !Number.isInteger(p.age) || p.age < 1 || p.age > 120 || !Number.isInteger(p.seatNumber) || p.seatNumber < 1)) {
    return res.status(400).json({ error: 'Each passenger needs a valid name, age (1-120), and a selected seat number' });
  }

  const reqSeats = clean.map((p) => p.seatNumber);
  if (new Set(reqSeats).size !== reqSeats.length) {
    return res.status(400).json({ error: 'Duplicate seat selection found in request' });
  }

  if (await isPastDate(journeyDate)) return res.status(400).json({ error: 'Travel date is in the past' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the train row so concurrent bookings for it are serialized
    const train = (await client.query(
      'SELECT id, total_seats, fare_per_seat FROM trains WHERE id = $1 FOR UPDATE', [trainId]
    )).rows[0];
    if (!train) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Train not found' });
    }

    if (reqSeats.some((s) => s > train.total_seats)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Seat numbers cannot exceed total seats (${train.total_seats})` });
    }

    // Check which seats are already booked
    const existingBookedRes = await client.query(
      `SELECT DISTINCT p.seat_number FROM passengers p
       JOIN bookings b ON b.id = p.booking_id
       WHERE b.train_id = $1 AND b.journey_date = $2 AND b.status = 'CONFIRMED'`,
      [trainId, journeyDate]
    );
    const existingSet = new Set(existingBookedRes.rows.map((r) => r.seat_number));
    const conflictSeat = reqSeats.find((s) => existingSet.has(s));
    if (conflictSeat) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Seat #${conflictSeat} is already booked. Please choose another seat.` });
    }

    const total = Number(train.fare_per_seat) * clean.length;
    const pnr = String(randomInt(1_000_000_000, 10_000_000_000));
    const booking = (await client.query(
      `INSERT INTO bookings (pnr, user_id, train_id, journey_date, seat_count, total_fare)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, pnr, journey_date::text AS journey_date, seat_count, total_fare, status`,
      [pnr, req.user.id, trainId, journeyDate, clean.length, total]
    )).rows[0];
    for (const p of clean) {
      await client.query(
        'INSERT INTO passengers (booking_id, name, age, seat_number) VALUES ($1,$2,$3,$4)',
        [booking.id, p.name, p.age, p.seatNumber]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ booking });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

router.get('/', wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT b.id, b.pnr, b.journey_date::text AS journey_date, b.seat_count, b.total_fare, b.status,
            t.number AS train_number, t.name AS train_name, t.departs, t.arrives,
            s.name AS source, d.name AS destination,
            (SELECT json_agg(json_build_object('name', p.name, 'age', p.age, 'seatNumber', p.seat_number) ORDER BY p.seat_number)
               FROM passengers p WHERE p.booking_id = b.id) AS passengers,
            (b.status = 'CONFIRMED' AND b.journey_date >= CURRENT_DATE) AS cancellable
     FROM bookings b
     JOIN trains t ON t.id = b.train_id
     JOIN stations s ON s.id = t.source_id
     JOIN stations d ON d.id = t.dest_id
     WHERE b.user_id = $1
     ORDER BY b.journey_date DESC, b.id DESC`,
    [req.user.id]
  );
  res.json({ bookings: rows });
}));

router.post('/:id/cancel', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid booking' });
  const { rows } = await pool.query(
    `UPDATE bookings SET status = 'CANCELLED', cancelled_at = now()
     WHERE id = $1 AND user_id = $2 AND status = 'CONFIRMED' AND journey_date >= CURRENT_DATE
     RETURNING id, pnr, status`,
    [id, req.user.id]
  );
  if (!rows[0]) return res.status(409).json({ error: 'This booking cannot be cancelled' });
  res.json({ booking: rows[0] });
}));

export default router;
