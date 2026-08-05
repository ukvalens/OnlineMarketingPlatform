import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faBagShopping, faMessage, faFileLines, faUser,
  faUsers, faChartBar, faGear, faRightFromBracket, faBars, faXmark,
  faTableCells, faBook, faImage, faDollarSign, faClipboard
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../api';
import Footer from '../../components/layout/Footer';
import useBreakpoint from '../../hooks/useBreakpoint';
import './dashboard.css';

const NAV = {
  client: [
    { label: 'Overview', to: '/dashboard/client', icon: <FontAwesomeIcon icon={faHouse} />, end: true },
    { label: 'My Orders', to: '/dashboard/client/orders', icon: <FontAwesomeIcon icon={faBagShopping} /> },
    { label: 'Messages', to: '/dashboard/client/messages', icon: <FontAwesomeIcon icon={faMessage} /> },
    { label: 'Invoices', to: '/dashboard/client/invoices', icon: <FontAwesomeIcon icon={faFileLines} /> },
    { label: 'Profile', to: '/dashboard/client/profile', icon: <FontAwesomeIcon icon={faUser} /> },
  ],
  staff: [
    { label: 'Overview', to: '/dashboard/admin', icon: <FontAwesomeIcon icon={faHouse} />, end: true },
    { label: 'Orders',   to: '/dashboard/admin/orders',   icon: <FontAwesomeIcon icon={faClipboard} /> },
    { label: 'Messages', to: '/dashboard/admin/messages', icon: <FontAwesomeIcon icon={faMessage} /> },
    { label: 'Clients',  to: '/dashboard/admin/clients',  icon: <FontAwesomeIcon icon={faUsers} /> },
    { label: 'Profile',  to: '/profile',                  icon: <FontAwesomeIcon icon={faUser} /> },
  ],
  editor: [
    { label: 'Overview', to: '/dashboard/admin', icon: <FontAwesomeIcon icon={faHouse} />, end: true },
    { label: 'Blog Posts', to: '/dashboard/admin/blog', icon: <FontAwesomeIcon icon={faBook} /> },
    { label: 'Portfolio', to: '/dashboard/admin/portfolio', icon: <FontAwesomeIcon icon={faImage} /> },
  ],
  finance: [
    { label: 'Overview', to: '/dashboard/admin', icon: <FontAwesomeIcon icon={faHouse} />, end: true },
    { label: 'Invoices', to: '/dashboard/admin/invoices', icon: <FontAwesomeIcon icon={faDollarSign} /> },
    { label: 'Payments', to: '/dashboard/admin/payments', icon: <FontAwesomeIcon icon={faFileLines} /> },
  ],
  admin: [
    { label: 'Overview', to: '/dashboard/admin', icon: <FontAwesomeIcon icon={faTableCells} />, end: true },
    { label: 'Orders', to: '/dashboard/admin/orders', icon: <FontAwesomeIcon icon={faClipboard} /> },
    { label: 'Clients', to: '/dashboard/admin/clients', icon: <FontAwesomeIcon icon={faUsers} /> },
    { label: 'Messages', to: '/dashboard/admin/messages', icon: <FontAwesomeIcon icon={faMessage} /> },
    { label: 'Invoices', to: '/dashboard/admin/invoices', icon: <FontAwesomeIcon icon={faDollarSign} /> },
    { label: 'Blog Posts', to: '/dashboard/admin/blog', icon: <FontAwesomeIcon icon={faBook} /> },
    { label: 'Portfolio', to: '/dashboard/admin/portfolio', icon: <FontAwesomeIcon icon={faImage} /> },
    { label: 'Analytics', to: '/dashboard/admin/analytics', icon: <FontAwesomeIcon icon={faChartBar} /> },
    { label: 'Users', to: '/dashboard/admin/users', icon: <FontAwesomeIcon icon={faUsers} /> },
    { label: 'Settings', to: '/dashboard/admin/settings', icon: <FontAwesomeIcon icon={faGear} /> },
  ],
};

export default function DashboardLayout({ children, pageTitle, pageSubtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDesktop } = useBreakpoint();

  const navLinks = NAV[user?.role] || NAV.client;

  // Auto-close sidebar when resizing to desktop
  useEffect(() => { if (isDesktop) setSidebarOpen(false); }, [isDesktop]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <aside className={`dashboard__sidebar${sidebarOpen ? ' dashboard__sidebar--open' : ''}`}>
        <Link to="/" className="sidebar__logo">
          <div className="sidebar__logo-icon">DM</div>
          DigitalMark<span>RW</span>
        </Link>

        <nav className="sidebar__nav">
          <div className="sidebar__section-label">Menu</div>
          {navLinks.map(({ label, to, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {icon} {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <NavLink to="/profile" className={({ isActive }) => `sidebar__user sidebar__user--link${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <div className="sidebar__user-avatar">
              {user?.avatar_url
                ? <img src={getImageUrl(user.avatar_url)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : user?.name?.[0]?.toUpperCase()
              }
            </div>
            <div className="sidebar__user-info">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
            <FontAwesomeIcon icon={faUser} style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.5 }} />
          </NavLink>
          <button className="sidebar__logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="dashboard__main">
        <header className="dashboard__topbar">
          <div className="topbar__title">
            <h2>{pageTitle}</h2>
            {pageSubtitle && <p>{pageSubtitle}</p>}
          </div>
          <div className="topbar__actions">
            <Link to="/" className="btn btn-outline btn-sm">← Public Site</Link>
            <Link to="/profile" className="topbar__avatar" title="My Profile">
              {user?.avatar_url
                ? <img src={getImageUrl(user.avatar_url)} alt={user.name} />
                : <span>{user?.name?.[0]?.toUpperCase()}</span>
              }
            </Link>
            <button className="topbar__burger" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FontAwesomeIcon icon={faXmark} /> : <FontAwesomeIcon icon={faBars} />}
            </button>
          </div>
        </header>

        <div className="dashboard__content">
          {children}
        </div>

        <Footer />
      </div>
    </div>
  );
}
