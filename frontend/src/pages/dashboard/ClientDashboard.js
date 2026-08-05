import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBagShopping, faFileLines, faMessage, faPlus, faArrowRight,
  faChartLine, faCheckCircle, faClock, faCircleExclamation,
  faBullhorn, faPaintBrush, faGlobe, faPhotoFilm, faBriefcase,
  faHandshake, faCartShopping, faChevronRight, faSpinner,
  faInbox, faRocket, faCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import api, { getImageUrl } from '../../api';
import './dashboard.css';
import './client-dashboard.css';

const fmt     = (n) => Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const STATUS_STEP = { requested: 0, quoted: 1, confirmed: 2, in_progress: 3, in_review: 4, completed: 5 };
const STATUS_LABELS = ['Requested', 'Quoted', 'Confirmed', 'In Progress', 'In Review', 'Completed'];

const SERVICE_ICONS = {
  'Social Media Marketing': faBullhorn,
  'Digital Advertising':    faChartLine,
  'Website Promotion':      faGlobe,
  'Graphic Design':         faPaintBrush,
  'Branding Services':      faPhotoFilm,
  'Business Consulting':    faBriefcase,
  'Online Product Marketing': faCartShopping,
};

const QUICK_ACTIONS = [
  { label: 'Request a Service',  to: '/dashboard/client/orders',   icon: faPlus,        color: 'blue',   desc: 'Place a new order' },
  { label: 'Pay Invoice',        to: '/dashboard/client/invoices',  icon: faFileLines,   color: 'orange', desc: 'Settle outstanding bills' },
  { label: 'Messages',           to: '/dashboard/client/messages',  icon: faMessage,     color: 'purple', desc: 'Chat with our team' },
  { label: 'Track Progress',     to: '/dashboard/client/orders',    icon: faChartLine,   color: 'green',  desc: 'View project milestones' },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders,   setOrders]   = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      const [o, i, s] = await Promise.all([
        api.get('/orders'),
        api.get('/invoices'),
        api.get('/services'),
      ]);
      setOrders(o.data);
      setInvoices(i.data);
      setServices(s.data.slice(0, 7));

      // Fetch unread messages across all orders
      const activeOrds = o.data.filter(ord => !['completed','cancelled'].includes(ord.status));
      if (activeOrds.length > 0) {
        const msgRes = await Promise.all(
          activeOrds.slice(0, 3).map(ord =>
            api.get(`/orders/${ord.id}/messages`).then(r => r.data.map(m => ({ ...m, reference: ord.reference }))).catch(() => [])
          )
        );
        const allMsgs = msgRes.flat().sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
        setMessages(allMsgs.slice(0, 5));
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeOrders  = orders.filter(o => !['completed','cancelled'].includes(o.status));
  const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalSpent    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);

  const stats = [
    { icon: faBagShopping,      label: 'Total Orders',    value: orders.length,          color: 'blue',   sub: `${activeOrders.length} active` },
    { icon: faChartLine,        label: 'In Progress',     value: activeOrders.length,    color: 'purple', sub: 'ongoing projects' },
    { icon: faCircleExclamation,label: 'Unpaid Invoices', value: unpaidInvoices.length,  color: 'orange', sub: unpaidInvoices.length > 0 ? `RWF ${fmt(unpaidInvoices.reduce((s,i)=>s+Number(i.amount),0))} due` : 'all clear' },
    { icon: faCircleCheck,      label: 'Completed',       value: completedOrders.length, color: 'green',  sub: totalSpent > 0 ? `RWF ${fmt(totalSpent)} spent` : 'no spend yet' },
  ];

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout
      pageTitle={`${greeting}, ${user?.name?.split(' ')[0]} 👋`}
      pageSubtitle="Here's an overview of your marketing projects"
    >
      {/* ── Stats ── */}
      <div className="stat-cards">
        {stats.map(({ icon, label, value, color, sub }) => (
          <div key={label} className="stat-card">
            <div className={`stat-card__icon stat-card__icon--${color}`}>
              <FontAwesomeIcon icon={icon} />
            </div>
            <div>
              <div className="stat-card__value">{loading ? '—' : value}</div>
              <div className="stat-card__label">{label}</div>
              <div className="stat-card__sub">{loading ? '' : sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alert: unpaid invoices ── */}
      {!loading && unpaidInvoices.length > 0 && (
        <div className="cd-alert cd-alert--warning">
          <FontAwesomeIcon icon={faCircleExclamation} />
          <span>You have <strong>{unpaidInvoices.length}</strong> unpaid invoice{unpaidInvoices.length > 1 ? 's' : ''} totalling <strong>RWF {fmt(unpaidInvoices.reduce((s,i)=>s+Number(i.amount),0))}</strong>.</span>
          <Link to="/dashboard/client/invoices" className="btn btn-sm btn-primary" style={{ marginLeft: 'auto', flexShrink: 0 }}>Pay Now</Link>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="cd-quick-actions">
        {QUICK_ACTIONS.map(({ label, to, icon, color, desc }) => (
          <Link key={label} to={to} className={`cd-quick-card cd-quick-card--${color}`}>
            <div className="cd-quick-card__icon"><FontAwesomeIcon icon={icon} /></div>
            <div>
              <strong>{label}</strong>
              <span>{desc}</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="cd-quick-card__arrow" />
          </Link>
        ))}
      </div>

      <div className="cd-main-grid">

        {/* ── Active Orders with Progress ── */}
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header">
            <h3><FontAwesomeIcon icon={faRocket} style={{ marginRight: 8, color: 'var(--primary)' }} />Active Orders</h3>
            <Link to="/dashboard/client/orders" className="btn btn-outline btn-sm">
              View All <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>

          {loading ? (
            <div className="dash-empty"><FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 28 }} /></div>
          ) : activeOrders.length === 0 ? (
            <div className="dash-empty">
              <FontAwesomeIcon icon={faBagShopping} style={{ fontSize: 36, marginBottom: 12 }} />
              <p>No active orders yet.</p>
              <Link to="/dashboard/client/orders" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                <FontAwesomeIcon icon={faPlus} /> Place Your First Order
              </Link>
            </div>
          ) : (
            <div className="cd-order-list">
              {activeOrders.slice(0, 5).map(order => {
                const step = STATUS_STEP[order.status] ?? 0;
                const pct  = order.progress_percent || 0;
                return (
                  <div key={order.id} className="cd-order-item">
                    <div className="cd-order-item__top">
                      <div>
                        <strong className="cd-order-item__ref">{order.reference}</strong>
                        <span className="cd-order-item__service">{order.service_name}</span>
                      </div>
                      <span className={`status-badge status-badge--${order.status}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Step tracker */}
                    <div className="cd-steps">
                      {STATUS_LABELS.slice(0, 6).map((lbl, i) => (
                        <div key={lbl} className={`cd-step${i <= step ? ' done' : ''}${i === step ? ' current' : ''}`}>
                          <div className="cd-step__dot">
                            {i < step ? <FontAwesomeIcon icon={faCheckCircle} /> : i + 1}
                          </div>
                          <span>{lbl}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    {pct > 0 && (
                      <div className="cd-order-item__progress">
                        <div className="cd-progress-bar">
                          <div className="cd-progress-bar__fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    )}

                    <div className="cd-order-item__footer">
                      <span className="cd-order-item__date"><FontAwesomeIcon icon={faClock} /> {fmtDate(order.created_at)}</span>
                      {order.quote_amount && (
                        <span className="cd-order-item__amount">RWF {fmt(order.quote_amount)}</span>
                      )}
                      {order.status === 'quoted' && (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/client/orders')}>
                          <FontAwesomeIcon icon={faCheckCircle} /> Accept Quote
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="cd-right-col">

          {/* Unpaid Invoices */}
          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header">
              <h3><FontAwesomeIcon icon={faFileLines} style={{ marginRight: 8, color: '#f59e0b' }} />Invoices Due</h3>
              <Link to="/dashboard/client/invoices" className="btn btn-outline btn-sm">View All</Link>
            </div>
            {loading ? (
              <div className="dash-empty"><FontAwesomeIcon icon={faSpinner} spin /></div>
            ) : unpaidInvoices.length === 0 ? (
              <div className="dash-empty" style={{ padding: '28px 24px' }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 28, color: '#15803d', marginBottom: 8 }} />
                <p>All invoices paid!</p>
              </div>
            ) : (
              <div className="cd-invoice-list">
                {unpaidInvoices.slice(0, 4).map(inv => (
                  <div key={inv.id} className="cd-invoice-item">
                    <div>
                      <strong>{inv.reference}</strong>
                      <span className={`status-badge status-badge--${inv.status}`} style={{ marginLeft: 8 }}>{inv.status}</span>
                      {inv.due_date && <div className="cd-invoice-item__due">Due {fmtDate(inv.due_date)}</div>}
                    </div>
                    <div className="cd-invoice-item__right">
                      <strong className="cd-invoice-item__amount">RWF {fmt(inv.amount)}</strong>
                      <Link to="/dashboard/client/invoices" className="btn btn-primary btn-sm">Pay</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="dash-table-wrap" style={{ marginTop: 24 }}>
            <div className="dash-table-wrap__header">
              <h3><FontAwesomeIcon icon={faMessage} style={{ marginRight: 8, color: '#7c3aed' }} />Recent Messages</h3>
              <Link to="/dashboard/client/messages" className="btn btn-outline btn-sm">View All</Link>
            </div>
            {loading ? (
              <div className="dash-empty"><FontAwesomeIcon icon={faSpinner} spin /></div>
            ) : messages.length === 0 ? (
              <div className="dash-empty" style={{ padding: '28px 24px' }}>
                <FontAwesomeIcon icon={faInbox} style={{ fontSize: 28, marginBottom: 8 }} />
                <p>No messages yet.</p>
              </div>
            ) : (
              <div className="cd-msg-list">
                {messages.map(msg => (
                  <div key={msg.id} className={`cd-msg-item${!msg.is_read && msg.sender_role !== 'client' ? ' unread' : ''}`}>
                    <div className="cd-msg-item__avatar">
                      {msg.sender_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="cd-msg-item__body">
                      <div className="cd-msg-item__top">
                        <strong>{msg.sender_name}</strong>
                        <span className="cd-msg-item__ref">#{msg.reference}</span>
                        <span className="cd-msg-item__time">{fmtTime(msg.sent_at)}</span>
                      </div>
                      <p className="cd-msg-item__text">{msg.content || '📎 Attachment'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Services We Offer ── */}
      <div className="cd-services-section">
        <div className="cd-services-header">
          <div>
            <h3>Our Services</h3>
            <p>Explore what we can do for your business</p>
          </div>
          <Link to="/services" className="btn btn-outline btn-sm">Browse All <FontAwesomeIcon icon={faArrowRight} /></Link>
        </div>
        <div className="cd-services-grid">
          {loading ? (
            <div className="dash-empty"><FontAwesomeIcon icon={faSpinner} spin /></div>
          ) : services.map(svc => (
            <div key={svc.id} className="cd-service-card" onClick={() => navigate('/dashboard/client/orders')}>
              <div className="cd-service-card__icon">
                <FontAwesomeIcon icon={SERVICE_ICONS[svc.name] || faHandshake} />
              </div>
              <div className="cd-service-card__body">
                <strong>{svc.name}</strong>
                {svc.category && <span>{svc.category}</span>}
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="cd-service-card__arrow" />
            </div>
          ))}
        </div>
      </div>

    </DashboardLayout>
  );
}
