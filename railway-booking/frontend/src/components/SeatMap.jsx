import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

export function getBerthDetails(seatNumber) {
  const mod = ((seatNumber - 1) % 8) + 1;
  switch (mod) {
    case 1:
    case 4:
      return { code: 'LB', name: 'Lower Berth', class: 'lower' };
    case 2:
    case 5:
      return { code: 'MB', name: 'Middle Berth', class: 'middle' };
    case 3:
    case 6:
      return { code: 'UB', name: 'Upper Berth', class: 'upper' };
    case 7:
      return { code: 'SL', name: 'Side Lower', class: 'side-lower' };
    case 8:
      return { code: 'SU', name: 'Side Upper', class: 'side-upper' };
    default:
      return { code: 'ST', name: 'Seat', class: 'regular' };
  }
}

const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function SeatMap({ trainId, date, farePerSeat, onBookingSuccess }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainInfo, setTrainInfo] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState({}); // { [seatNum]: { name: '', age: '' } }
  const [activeCoach, setActiveCoach] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let unmounted = false;
    setLoading(true);
    setError('');
    api(`/trains/${trainId}/seats?date=${date}`)
      .then((data) => {
        if (unmounted) return;
        setTrainInfo(data.train);
        setBookedSeats(data.bookedSeats || []);
        setLoading(false);
      })
      .catch((err) => {
        if (unmounted) return;
        setError(err.message || 'Failed to load seat availability');
        setLoading(false);
      });
    return () => { unmounted = true; };
  }, [trainId, date]);

  const totalSeats = trainInfo?.total_seats || 60;
  const SEATS_PER_COACH = 24; // 3 bays of 8 seats each per coach view tab
  const totalCoaches = Math.ceil(totalSeats / SEATS_PER_COACH);

  const bookedSet = new Set(bookedSeats);

  const toggleSeat = (seatNum) => {
    if (bookedSet.has(seatNum)) return;
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNum));
      setPassengers((prev) => {
        const next = { ...prev };
        delete next[seatNum];
        return next;
      });
    } else {
      if (selectedSeats.length >= 6) {
        setError('Maximum 6 seats can be selected per booking.');
        return;
      }
      setError('');
      const nextSelected = [...selectedSeats, seatNum].sort((a, b) => a - b);
      setSelectedSeats(nextSelected);
      setPassengers((prev) => ({
        ...prev,
        [seatNum]: prev[seatNum] || { name: '', age: '' },
      }));
    }
  };

  const handlePaxChange = (seatNum, field, value) => {
    setPassengers((prev) => ({
      ...prev,
      [seatNum]: {
        ...prev[seatNum],
        [field]: value,
      },
    }));
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!user) {
      return navigate('/login', { state: { from: '/' } });
    }

    if (selectedSeats.length === 0) {
      setError('Please select at least 1 seat to proceed.');
      return;
    }

    const paxList = selectedSeats.map((seatNum) => ({
      seatNumber: seatNum,
      name: passengers[seatNum]?.name?.trim() || '',
      age: Number(passengers[seatNum]?.age),
    }));

    for (const p of paxList) {
      const b = getBerthDetails(p.seatNumber);
      if (!p.name) {
        setError(`Please enter name for passenger on Seat #${p.seatNumber} (${b.name})`);
        return;
      }
      if (!p.age || p.age < 1 || p.age > 120) {
        setError(`Please enter valid age (1-120) for passenger on Seat #${p.seatNumber}`);
        return;
      }
    }

    setError('');
    setSubmitting(true);
    try {
      await api('/bookings', {
        method: 'POST',
        body: {
          trainId,
          journeyDate: date,
          passengers: paxList,
        },
      });
      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes('log in')) {
        return navigate('/login', { state: { from: '/' } });
      }
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="seat-loading">Loading real-time seat availability map...</div>;
  }

  // Calculate coach range
  const startSeat = (activeCoach - 1) * SEATS_PER_COACH + 1;
  const endSeat = Math.min(activeCoach * SEATS_PER_COACH, totalSeats);

  // Group seats into bays of 8 seats
  const bays = [];
  for (let s = startSeat; s <= endSeat; s += 8) {
    const baySeats = [];
    for (let i = 0; i < 8 && s + i <= endSeat; i++) {
      baySeats.push(s + i);
    }
    bays.push({ bayNum: Math.floor((s - 1) / 8) + 1, seats: baySeats });
  }

  const availableCount = totalSeats - bookedSeats.length;

  return (
    <div className="seat-system-container">
      <div className="seat-header-panel">
        <div className="seat-stats-bar">
          <div className="stat-pill available">
            <span className="dot"></span>
            <strong>{availableCount}</strong> Available Seats
          </div>
          <div className="stat-pill booked">
            <span className="dot"></span>
            <strong>{bookedSeats.length}</strong> Booked Seats
          </div>
          <div className="stat-pill selected">
            <span className="dot"></span>
            <strong>{selectedSeats.length}</strong> Selected ({selectedSeats.length}/6 max)
          </div>
        </div>

        {totalCoaches > 1 && (
          <div className="coach-tabs">
            <span className="coach-tabs-label">Select Coach:</span>
            {Array.from({ length: totalCoaches }).map((_, idx) => {
              const cNum = idx + 1;
              const cStart = (cNum - 1) * SEATS_PER_COACH + 1;
              const cEnd = Math.min(cNum * SEATS_PER_COACH, totalSeats);
              return (
                <button
                  key={cNum}
                  type="button"
                  className={`coach-tab ${activeCoach === cNum ? 'active' : ''}`}
                  onClick={() => setActiveCoach(cNum)}
                >
                  Coach S{cNum} <span className="seats-range">({cStart}-{cEnd})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Railway Coach Shell Graphics */}
      <div className="coach-shell">
        <div className="coach-top-header">
          <div className="coach-direction">🚂 Train Engine Direction &rarr;</div>
          <div className="coach-title">COACH S{activeCoach} &bull; SLEEPER / AC</div>
          <div className="coach-doors"><span className="door-icon">🚪</span> Entrance</div>
        </div>

        {/* Legend bar inside map */}
        <div className="coach-legend">
          <span className="legend-item available"><span className="swatch"></span> Available</span>
          <span className="legend-item selected"><span className="swatch"></span> Selected</span>
          <span className="legend-item booked"><span className="swatch"></span> Booked</span>
        </div>

        {/* Coach Bays layout */}
        <div className="bays-grid">
          {bays.map((bay) => {
            const mainSeatsTop = bay.seats.filter((num) => {
              const m = ((num - 1) % 8) + 1;
              return m === 1 || m === 2 || m === 3;
            });
            const mainSeatsBottom = bay.seats.filter((num) => {
              const m = ((num - 1) % 8) + 1;
              return m === 4 || m === 5 || m === 6;
            });
            const sideSeats = bay.seats.filter((num) => {
              const m = ((num - 1) % 8) + 1;
              return m === 7 || m === 8;
            });

            return (
              <div key={bay.bayNum} className="bay-compartment">
                <div className="bay-label">BAY {bay.bayNum}</div>
                <div className="bay-layout">
                  {/* Left Side: Main Cabin */}
                  <div className="main-cabin">
                    {/* Top Bench */}
                    <div className="bench bench-top">
                      {mainSeatsTop.map((sNum) => {
                        const b = getBerthDetails(sNum);
                        const isBooked = bookedSet.has(sNum);
                        const isSelected = selectedSeats.includes(sNum);
                        return (
                          <button
                            key={sNum}
                            type="button"
                            disabled={isBooked}
                            className={`seat-btn ${b.class} ${isBooked ? 'is-booked' : ''} ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => toggleSeat(sNum)}
                            title={`Seat ${sNum}: ${b.name} (${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'})`}
                          >
                            <span className="seat-num">{sNum}</span>
                            <span className="berth-code">{b.code}</span>
                            {isSelected && <span className="check-badge">&check;</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Cabin Table/Space */}
                    <div className="cabin-divider">
                      <span>🪟 Window</span>
                      <span className="divider-line"></span>
                    </div>

                    {/* Bottom Bench */}
                    <div className="bench bench-bottom">
                      {mainSeatsBottom.map((sNum) => {
                        const b = getBerthDetails(sNum);
                        const isBooked = bookedSet.has(sNum);
                        const isSelected = selectedSeats.includes(sNum);
                        return (
                          <button
                            key={sNum}
                            type="button"
                            disabled={isBooked}
                            className={`seat-btn ${b.class} ${isBooked ? 'is-booked' : ''} ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => toggleSeat(sNum)}
                            title={`Seat ${sNum}: ${b.name} (${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'})`}
                          >
                            <span className="seat-num">{sNum}</span>
                            <span className="berth-code">{b.code}</span>
                            {isSelected && <span className="check-badge">&check;</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Central Gangway / Aisle */}
                  <div className="gangway-aisle">
                    <span className="aisle-text">AISLE &bull; PASSAGE</span>
                  </div>

                  {/* Right Side: Side Berths */}
                  <div className="side-cabin">
                    {sideSeats.map((sNum) => {
                      const b = getBerthDetails(sNum);
                      const isBooked = bookedSet.has(sNum);
                      const isSelected = selectedSeats.includes(sNum);
                      return (
                        <button
                          key={sNum}
                          type="button"
                          disabled={isBooked}
                          className={`seat-btn ${b.class} ${isBooked ? 'is-booked' : ''} ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => toggleSeat(sNum)}
                          title={`Seat ${sNum}: ${b.name} (${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'})`}
                        >
                          <span className="seat-num">{sNum}</span>
                          <span className="berth-code">{b.code}</span>
                          {isSelected && <span className="check-badge">&check;</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Passenger Details & Confirmation Form */}
      {selectedSeats.length > 0 ? (
        <form className="booking-pax-form" onSubmit={handleConfirm}>
          <div className="pax-form-header">
            <h3>Passenger Details for Selected Seats ({selectedSeats.length})</h3>
            <span className="pax-instructions">Enter name and age for each selected seat</span>
          </div>

          <div className="pax-list-grid">
            {selectedSeats.map((seatNum, idx) => {
              const b = getBerthDetails(seatNum);
              return (
                <div key={seatNum} className="pax-card">
                  <div className="pax-card-badge">
                    <span className="seat-tag">Seat #{seatNum}</span>
                    <span className="berth-tag">{b.name} ({b.code})</span>
                    <button
                      type="button"
                      className="remove-seat-btn"
                      onClick={() => toggleSeat(seatNum)}
                      title="Deselect this seat"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="pax-inputs">
                    <label>
                      Passenger {idx + 1} Name
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={passengers[seatNum]?.name || ''}
                        onChange={(e) => handlePaxChange(seatNum, 'name', e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Age
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="Age"
                        value={passengers[seatNum]?.age || ''}
                        onChange={(e) => handlePaxChange(seatNum, 'age', e.target.value)}
                        required
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="booking-summary-bar">
            <div className="summary-fare">
              <span className="label">Total Fare:</span>
              <span className="amount">{money(farePerSeat * selectedSeats.length)}</span>
              <span className="breakdown">({selectedSeats.length} &times; {money(farePerSeat)})</span>
            </div>
            {user ? (
              <button className="primary confirm-btn" disabled={submitting}>
                {submitting ? 'Processing Booking...' : 'Confirm Booking'}
              </button>
            ) : (
              <button
                type="button"
                className="primary confirm-btn"
                onClick={() => navigate('/login', { state: { from: '/' } })}
              >
                Log in to Confirm Booking
              </button>
            )}
          </div>

          {error && <p className="error" role="alert">{error}</p>}
        </form>
      ) : (
        <div className="no-seats-prompt">
          👉 Please click on any <strong>Available (Green)</strong> seat above to select seats for your journey.
        </div>
      )}
    </div>
  );
}
