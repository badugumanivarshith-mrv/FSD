import { pool } from '../railway-booking/backend/src/db/index.js';
import bcrypt from 'bcryptjs';

async function testSeatFlow() {
  console.log('--- Testing Railway Seat Allocation & Selection Logic ---');
  try {
    // 1. Reset DB
    const schemaSql = (await import('node:fs')).readFileSync('railway-booking/backend/src/db/schema.sql', 'utf8');
    const seedSql = (await import('node:fs')).readFileSync('railway-booking/backend/src/db/seed.sql', 'utf8');
    await pool.query(schemaSql);
    await pool.query(seedSql);

    // 2. Create test user
    const hash = await bcrypt.hash('password123', 10);
    const userRes = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id',
      ['Test User', 'test@example.com', hash]
    );
    const userId = userRes.rows[0].id;
    console.log('✅ Test user created with ID:', userId);

    // 3. Get first train ID
    const trainRes = await pool.query('SELECT id, number, name, total_seats FROM trains LIMIT 1');
    const train = trainRes.rows[0];
    const date = '2026-12-01';
    console.log(`✅ Train selected: ${train.name} (${train.number}), Total Seats: ${train.total_seats}`);

    // 4. Check initial seat status
    const initialBooked = await pool.query(
      `SELECT DISTINCT p.seat_number FROM passengers p JOIN bookings b ON b.id = p.booking_id WHERE b.train_id = $1 AND b.journey_date = $2 AND b.status = 'CONFIRMED'`,
      [train.id, date]
    );
    console.log('✅ Initial booked seats count:', initialBooked.rows.length);

    // 5. Book seat #1 (LB) and seat #7 (SL)
    const pnr = '9876543210';
    const bookingRes = await pool.query(
      `INSERT INTO bookings (pnr, user_id, train_id, journey_date, seat_count, total_fare) VALUES ($1,$2,$3,$4,2,3500) RETURNING id`,
      [pnr, userId, train.id, date]
    );
    const bookingId = bookingRes.rows[0].id;

    await pool.query('INSERT INTO passengers (booking_id, name, age, seat_number) VALUES ($1,$2,$3,$4)', [bookingId, 'John Doe', 30, 1]);
    await pool.query('INSERT INTO passengers (booking_id, name, age, seat_number) VALUES ($1,$2,$3,$4)', [bookingId, 'Jane Doe', 28, 7]);
    console.log('✅ Booked Seat #1 (Lower Berth) & Seat #7 (Side Lower)');

    // 6. Query booked seats again
    const updatedBooked = await pool.query(
      `SELECT DISTINCT p.seat_number FROM passengers p JOIN bookings b ON b.id = p.booking_id WHERE b.train_id = $1 AND b.journey_date = $2 AND b.status = 'CONFIRMED' ORDER BY p.seat_number`,
      [train.id, date]
    );
    const bookedNumbers = updatedBooked.rows.map((r) => r.seat_number);
    console.log('✅ Currently booked seat numbers:', bookedNumbers);

    if (bookedNumbers.includes(1) && bookedNumbers.includes(7)) {
      console.log('🎉 SUCCESS: Seats 1 and 7 are correctly marked as booked!');
    } else {
      console.error('❌ FAIL: Seats were not found in booked seats query');
    }

    // 7. Cancel booking and verify seats are freed
    await pool.query(`UPDATE bookings SET status = 'CANCELLED' WHERE id = $1`, [bookingId]);
    const cancelledBooked = await pool.query(
      `SELECT DISTINCT p.seat_number FROM passengers p JOIN bookings b ON b.id = p.booking_id WHERE b.train_id = $1 AND b.journey_date = $2 AND b.status = 'CONFIRMED'`,
      [train.id, date]
    );
    console.log('✅ Booked seats after cancellation:', cancelledBooked.rows.length);
    if (cancelledBooked.rows.length === 0) {
      console.log('🎉 SUCCESS: Seats successfully freed upon cancellation!');
    }

  } catch (err) {
    console.error('❌ Error testing seat flow:', err);
  } finally {
    await pool.end();
  }
}

testSeatFlow();
