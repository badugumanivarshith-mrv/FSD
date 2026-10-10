DROP TABLE IF EXISTS passengers, bookings, trains, stations, users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE trains (
  id SERIAL PRIMARY KEY,
  number VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  source_id INT NOT NULL REFERENCES stations(id),
  dest_id INT NOT NULL REFERENCES stations(id),
  departs TIME NOT NULL,
  arrives TIME NOT NULL,
  fare_per_seat NUMERIC(10,2) NOT NULL,
  total_seats INT NOT NULL CHECK (total_seats > 0),
  CHECK (source_id <> dest_id)
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  pnr VARCHAR(10) UNIQUE NOT NULL,
  user_id INT NOT NULL REFERENCES users(id),
  train_id INT NOT NULL REFERENCES trains(id),
  journey_date DATE NOT NULL,
  seat_count INT NOT NULL CHECK (seat_count > 0),
  total_fare NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);
CREATE INDEX idx_bookings_availability ON bookings (train_id, journey_date, status);
CREATE INDEX idx_bookings_user ON bookings (user_id);

CREATE TABLE passengers (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT NOT NULL CHECK (age BETWEEN 1 AND 120),
  seat_number INT NOT NULL CHECK (seat_number > 0)
);
