import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faChevronDown, faUser, faRightFromBracket, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import LanguageSwitcher from '../LanguageSwitcher';
import useBreakpoint from '../../hooks/useBreakpoint';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isDesktop } = useBreakpoint();

  const NAV_LINKS = [
    { labelKey: 'nav_home',      to: '/' },
    { labelKey: 'nav_services',  to: '/services' },
    { labelKey: 'nav_portfolio', to: '/portfolio' },
    { labelKey: 'nav_blog',      to: '/blog' },
    { labelKey: 'nav_about',     to: '/about' },
    { labelKey: 'nav_contact',   to: '/contact' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { if (isDesktop) { setOpen(false); setDropdownOpen(false); } }, [isDesktop]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const dashboardPath = ['admin', 'staff', 'editor', 'finance'].includes(user?.role)
    ? '/dashboard/admin'
    : '/dashboard/client';

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="logo-icon">DM</span>
          <span className="logo-text">DigitalMark<span>RW</span></span>
        </Link>

        <ul className={`navbar__links${open ? ' navbar__links--open' : ''}`}>
          {NAV_LINKS.map(({ labelKey, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={() => setOpen(false)}
              >
                {t(labelKey)}
              </NavLink>
            </li>
          ))}
          {!isDesktop && (
            <li className="navbar__links-lang">
              <LanguageSwitcher />
            </li>
          )}
          {!isDesktop && !user && (
            <li className="navbar__links-auth">
              <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>{t('nav_login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>{t('nav_get_started')}</Link>
            </li>
          )}
        </ul>

        <div className="navbar__actions">
          <LanguageSwitcher />
          {user ? (
            <div className="navbar__user" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="navbar__avatar">{user.name?.[0]?.toUpperCase()}</div>
              <span className="navbar__username">{user.name?.split(' ')[0]}</span>
              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 14 }} />
              {dropdownOpen && (
                <div className="navbar__dropdown">
                  <Link to={dashboardPath} onClick={() => setDropdownOpen(false)}>
                    <FontAwesomeIcon icon={faTableCells} /> {t('nav_dashboard')}
                  </Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                    <FontAwesomeIcon icon={faUser} /> {t('nav_profile')}
                  </Link>
                  <button onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} /> {t('nav_logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">{t('nav_login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('nav_get_started')}</Link>
            </>
          )}
        </div>

        <button className="navbar__burger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open
            ? <FontAwesomeIcon icon={faXmark} style={{ fontSize: 22 }} />
            : <FontAwesomeIcon icon={faBars} style={{ fontSize: 22 }} />}
        </button>
      </div>
    </nav>
  );
}
