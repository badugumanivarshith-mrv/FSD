import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import trainRoutes from './routes/trains.js';
import bookingRoutes from './routes/bookings.js';

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error('Missing JWT_SECRET or DATABASE_URL. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', trainRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Postgres 22007/22008 = invalid date input
app.use((err, _req, res, _next) => {
  if (err.code === '22007' || err.code === '22008') return res.status(400).json({ error: 'Invalid date' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
