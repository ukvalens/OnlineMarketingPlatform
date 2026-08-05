import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faChevronDown, faUser, faRightFromBracket, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import useBreakpoint from '../../hooks/useBreakpoint';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Blog', to: '/blog' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isDesktop } = useBreakpoint();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-close mobile menu when resizing to desktop
  useEffect(() => { if (isDesktop) { setOpen(false); setDropdownOpen(false); } }, [isDesktop]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const dashboardPath = ['admin','staff','editor','finance'].includes(user?.role) ? '/dashboard/admin' : '/dashboard/client';

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="logo-icon">DM</span>
          <span className="logo-text">DigitalMark<span>RW</span></span>
        </Link>

        <ul className={`navbar__links${open ? ' navbar__links--open' : ''}`}>
          {NAV_LINKS.map(({ label, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            </li>
          ))}
          {/* Auth links inside mobile menu */}
          {!isDesktop && !user && (
            <li className="navbar__links-auth">
              <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Get Started</Link>
            </li>
          )}
        </ul>

        <div className="navbar__actions">
          {user ? (
            <div className="navbar__user" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="navbar__avatar">{user.name?.[0]?.toUpperCase()}</div>
              <span className="navbar__username">{user.name?.split(' ')[0]}</span>
              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 14 }} />
              {dropdownOpen && (
                <div className="navbar__dropdown">
                  <Link to={dashboardPath} onClick={() => setDropdownOpen(false)}>
                    <FontAwesomeIcon icon={faTableCells} /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                    <FontAwesomeIcon icon={faUser} /> Profile
                  </Link>
                  <button onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        <button className="navbar__burger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <FontAwesomeIcon icon={faXmark} style={{ fontSize: 22 }} /> : <FontAwesomeIcon icon={faBars} style={{ fontSize: 22 }} />}
        </button>
      </div>
    </nav>
  );
}
