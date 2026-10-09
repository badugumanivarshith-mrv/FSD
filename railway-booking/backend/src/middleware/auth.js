import jwt from 'jsonwebtoken';
import { pool } from '../db/index.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Log in to continue' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);
    if (!rows[0]) {
      return res.status(401).json({ error: 'Session expired or user no longer exists. Please log in again.' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired. Log in again.' });
  }
}

