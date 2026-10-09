# Railway Booking System

React (Vite) + Node/Express + PostgreSQL. Core scope: login, search trains, book, cancel.

## Run (Windows / PowerShell)

1. Create the database:
   `psql -U postgres -c "CREATE DATABASE railway;"`
2. Backend:
   ```
   cd backend
   copy .env.example .env      # then edit DATABASE_URL and JWT_SECRET
   npm install
   npm run db:init             # WARNING: drops and recreates all tables, then seeds
   npm run dev
   ```
3. Frontend (new terminal):
   ```
   cd frontend
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

Seeded routes: Mumbai Central <-> New Delhi, New Delhi <-> Chennai Central, Secunderabad <-> New Delhi, Secunderabad <-> Bengaluru City, Howrah -> Chennai, Mumbai Central -> Pune.

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | no | Create account |
| POST | /api/auth/login | no | Log in, returns JWT |
| GET | /api/auth/me | yes | Current user |
| GET | /api/stations | no | Station list |
| GET | /api/trains/search?from=&to=&date= | no | Trains with live seat availability |
| POST | /api/bookings | yes | Book `{trainId, journeyDate, passengers[{name, age}]}` |
| GET | /api/bookings | yes | Your bookings |
| POST | /api/bookings/:id/cancel | yes | Cancel a confirmed, upcoming booking |

Seats are checked inside a transaction that locks the train row, so concurrent bookings cannot oversell.
