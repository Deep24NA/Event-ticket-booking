import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/';

  const handleLogout = async () => {
    try {
      await api.post('/users/logout');
      navigate('/', { replace: true });
      window.location.reload();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const navLinks = [
    { to: '/events', label: '🎟️ Events' },
    { to: '/marketplace', label: '🛒 Marketplace' },
    { to: '/dashboard', label: '👤 Dashboard' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-blue-600 hover:text-blue-700 transition-colors">
          🎟️ <span>EventTix</span>
        </Link>

        {/* Nav Links & Auth */}
        <div className="flex items-center gap-1">
          {isAuthPage ? (
            <span className="text-sm text-gray-400 font-medium">Secure Portal</span>
          ) : (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === link.to
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="ml-3 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}