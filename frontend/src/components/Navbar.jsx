import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.pathname === '/' || location.pathname === '/signup';
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location.pathname]); // Update when route changes

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className={`navbar ${isGuest ? 'guest' : ''}`}>
      <Link to={user ? "/dashboard" : "/"} className="navbar-brand">
        <img src="https://assets.splitwise.com/assets/core/logo-wordmark-horizontal-green-9e1e073c683b7ff46ea17696cffca7ce2fb4208a101b0b7aa7d62058b762391d.svg" alt="Splitwise" height="30" />
      </Link>
      
      <div className="navbar-actions">
        {isGuest && !user ? (
          <>
            <Link to="/" style={{ color: 'var(--primary-color)', fontWeight: 500, marginRight: '10px' }}>Log in</Link>
            <Link to="/signup" className="btn-primary">Sign up</Link>
          </>
        ) : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={`https://ui-avatars.com/api/?name=${user.name || 'User'}&background=ff652f&color=fff&rounded=true`} alt="User" width="30" height="30" />
              <span>{user.name}</span>
            </div>
            <button onClick={handleLogout} className="btn-outline" style={{ padding: '5px 10px' }}>Log out</button>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
