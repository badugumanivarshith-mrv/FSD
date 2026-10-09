import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const hhmm = (t) => String(t).slice(0, 5);
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

function BookPanel({ train, date, onDone }) {
  const [passengers, setPassengers] = useState([{ name: '', age: '' }]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const max = Math.min(6, train.available_seats);

  const update = (i, k, v) => setPassengers(passengers.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));

  async function confirm(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/bookings', {
        method: 'POST',
        body: {
          trainId: train.id,
          journeyDate: date,
          passengers: passengers.map((p) => ({ name: p.name, age: Number(p.age) })),
        },
      });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="book" onSubmit={confirm}>
      {passengers.map((p, i) => (
        <div className="pax" key={i}>
          <label>Passenger {i + 1}
            <input value={p.name} onChange={(e) => update(i, 'name', e.target.value)} required />
          </label>
          <label>Age
            <input type="number" min="1" max="120" value={p.age} onChange={(e) => update(i, 'age', e.target.value)} required />
          </label>
          {passengers.length > 1 && (
            <button type="button" className="link" onClick={() => setPassengers(passengers.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          )}
        </div>
      ))}
      <div className="row">
        {passengers.length < max && (
          <button type="button" className="link" onClick={() => setPassengers([...passengers, { name: '', age: '' }])}>
            Add passenger
          </button>
        )}
        <span className="total">Total {money(train.fare_per_seat * passengers.length)}</span>
        <button className="primary" disabled={busy}>Confirm booking</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

export default function Search() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(today());
  const [trains, setTrains] = useState(null);
  const [searchedDate, setSearchedDate] = useState('');
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    api('/stations').then((d) => setStations(d.stations)).catch((e) => setError(e.message));
  }, []);

  async function search(e) {
    e.preventDefault();
    setError('');
    setOpenId(null);
    try {
      const d = await api(`/trains/search?from=${from}&to=${to}&date=${date}`);
      setTrains(d.trains);
      setSearchedDate(date);
    } catch (err) {
      setTrains(null);
      setError(err.message);
    }
  }

  function startBooking(id) {
    if (!user) return navigate('/login', { state: { from: '/' } });
    setOpenId(openId === id ? null : id);
  }

  return (
    <>
      <section className="panel">
        <h1>Find a train</h1>
        <form className="searchbar" onSubmit={search}>
          <label>From
            <select value={from} onChange={(e) => setFrom(e.target.value)} required>
              <option value="">Select station</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </label>
          <label>To
            <select value={to} onChange={(e) => setTo(e.target.value)} required>
              <option value="">Select station</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </label>
          <label>Date
            <input type="date" value={date} min={today()} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <button className="primary">Search trains</button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {trains && (
        <section className="results">
          {trains.length === 0 && <p className="muted">No trains run on this route. Try different stations.</p>}
          {trains.map((t) => (
            <article key={t.id} className="train">
              <div className="trainrow">
                <div className="id"><strong>{t.name}</strong><span className="muted">{t.number}</span></div>
                <div className="times">
                  <span>{hhmm(t.departs)}</span>
                  <span className="muted">to</span>
                  <span>{hhmm(t.arrives)}</span>
                </div>
                <div className="seats">
                  {t.available_seats > 0
                    ? <span className={t.available_seats <= 10 ? 'low' : 'ok'}>{t.available_seats} seats left</span>
                    : <span className="full">Sold out</span>}
                </div>
                <div className="fare">{money(t.fare_per_seat)}<span className="muted"> per seat</span></div>
                <button className="primary" disabled={t.available_seats === 0} onClick={() => startBooking(t.id)}>
                  {openId === t.id ? 'Close' : 'Book'}
                </button>
              </div>
              {openId === t.id && (
                <BookPanel train={t} date={searchedDate} onDone={() => navigate('/bookings')} />
              )}
            </article>
          ))}
        </section>
      )}
    </>
  );
}
