import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getBerthDetails } from '../components/SeatMap.jsx';

const hhmm = (t) => String(t).slice(0, 5);
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function Bookings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setBookings((await api('/bookings')).bookings);
    } catch (err) {
      if (err.status === 401) { logout(); navigate('/login'); return; }
      setError(err.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function cancel(b) {
    if (!window.confirm(`Cancel booking ${b.pnr}? This cannot be undone.`)) return;
    setError('');
    try {
      await api(`/bookings/${b.id}/cancel`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel">
      <h1>My bookings</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {bookings && bookings.length === 0 && (
        <p className="muted">You have no bookings yet. Search for a train to book your first trip.</p>
      )}
      {bookings?.map((b) => (
        <article key={b.id} className={`ticket ${b.status === 'CANCELLED' ? 'cancelled' : ''}`}>
          <div className="trainrow">
            <div className="id">
              <strong>{b.train_name}</strong>
              <span className="muted">{b.train_number} &bull; {b.source} to {b.destination}</span>
            </div>
            <div className="times">
              <span>{b.journey_date}</span>
              <span className="muted">{hhmm(b.departs)} to {hhmm(b.arrives)}</span>
            </div>
            <div className="fare">{money(b.total_fare)}</div>
            <span className={`status ${b.status.toLowerCase()}`}>
              {b.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
            </span>
          </div>

          <div className="ticket-details">
            <div className="pnr-badge">
              <strong>PNR:</strong> {b.pnr}
            </div>
            <div className="ticket-passengers-list">
              <strong>Passengers &amp; Reserved Seats:</strong>
              <div className="pax-seats-chips">
                {b.passengers.map((p, idx) => {
                  const berth = p.seatNumber ? getBerthDetails(p.seatNumber) : null;
                  return (
                    <div key={idx} className="pax-chip">
                      <span className="pax-name-age">{p.name} ({p.age} yrs)</span>
                      {p.seatNumber ? (
                        <span className={`seat-badge ${berth?.class || ''}`}>
                          Seat #{p.seatNumber} &bull; {berth?.name || 'Berth'} ({berth?.code})
                        </span>
                      ) : (
                        <span className="seat-badge unassigned">Seat Unassigned</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {b.cancellable && (
            <div className="ticket-actions">
              <button className="danger" onClick={() => cancel(b)}>Cancel booking</button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
