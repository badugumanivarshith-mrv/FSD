import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Search from './pages/Search.jsx';
import Auth from './pages/Auth.jsx';
import Bookings from './pages/Bookings.jsx';

function RequireLogin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Railway Booking</Link>
        <nav>
          <NavLink to="/" end>Search trains</NavLink>
          <NavLink to="/bookings">My bookings</NavLink>
        </nav>
        <div className="who">
          {user ? (
            <>
              <span>{user.name}</span>
              <button className="link" onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/bookings" element={<RequireLogin><Bookings /></RequireLogin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
