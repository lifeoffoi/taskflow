import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: theme === 'dark' ? '#1c1d26' : '#f0f0f0' }}>
      {user ? (
        <>
          <Link to="/">Dashboard</Link>
          {user.role === 'admin'
            ? <Link to="/admin">Manage Tasks</Link>
            : <Link to="/tasks">My Tasks</Link>
          }
          <button onClick={handleLogout}>Logout</button>
          <span>Welcome, {user.name}</span>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
      <button onClick={toggleTheme} style={{ marginLeft: 'auto' }}>
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>
    </nav>
  );
};

export default Navbar;
