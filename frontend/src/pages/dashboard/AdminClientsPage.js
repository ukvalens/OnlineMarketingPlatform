import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faDownload, faEye, faXmark,
  faUserCheck, faUserXmark, faBuilding,
  faEnvelope, faPhone, faCalendar, faBoxOpen
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api, { exportCsv } from '../../api';
import './orders.css';
import './admin-content.css';
import './admin-users.css';

const fmt     = (n) => Number(n).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const AVATAR_COLORS = ['#0057B8','#7c3aed','#0e7490','#15803d','#b45309','#be185d'];
const avatarColor = (id) => AVATAR_COLORS[(id?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

export default function AdminClientsPage() {
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer
  const [drawer, setDrawer]           = useState(null);
  const [orders, setOrders]           = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/clients').catch(() => ({ data: [] }));
    setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDrawer = async (client) => {
    setDrawer(client);
    setOrders([]);
    setDrawerLoading(true);
    const { data } = await api.get(`/admin/clients/${client.id}/orders`).catch(() => ({ data: [] }));
    setOrders(data);
    setDrawerLoading(false);
  };

  const toggleActive = async (client) => {
    const next = !client.is_active;
    if (!window.confirm(`${next ? 'Reactivate' : 'Deactivate'} ${client.name}?`)) return;
    await api.patch(`/admin/users/${client.id}`, { is_active: next }).catch(() => {});
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_active: next } : c));
    if (drawer?.id === client.id) setDrawer(prev => ({ ...prev, is_active: next }));
  };

  const filtered = clients.filter(c => {
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.is_active : !c.is_active);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q);
    return matchStatus && matchSearch;
  });

  const stats = [
    { label: 'Total Clients',  value: clients.length,                                    color: 'blue',   icon: '👥' },
    { label: 'Active',         value: clients.filter(c => c.is_active).length,           color: 'green',  icon: '✅' },
    { label: 'With Orders',    value: clients.filter(c => c.order_count > 0).length,     color: 'purple', icon: '📦' },
    { label: 'Total Revenue',  value: `RWF ${fmt(clients.reduce((s, c) => s + Number(c.total_paid), 0))}`, color: 'orange', icon: '💰' },
  ];

  return (
    <DashboardLayout pageTitle="Clients" pageSubtitle="All registered clients · orders & spending overview">

      {/* Stats */}
      <div className="stat-cards" style={{ marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card__icon stat-card__icon--${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-card__value">{loading ? '—' : s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="orders-toolbar">
        <div className="orders-filters">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} className={`orders-filter-btn${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="orders-toolbar__right">
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none' }} />
            <input className="orders-search" style={{ paddingLeft: 34 }}
              placeholder="Search name, email, company…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => exportCsv('clients', 'clients.csv')}>
            <FontAwesomeIcon icon={faDownload} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-wrap">
        {loading ? (
          <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <span style={{ fontSize: 32 }}>👥</span>
            <p>{clients.length === 0 ? 'No clients yet.' : 'No clients match your search.'}</p>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Active</th>
                <th>Completed</th>
                <th>Total Paid (RWF)</th>
                <th>Last Order</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ opacity: c.is_active ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ background: avatarColor(c.id) }}>
                        {initials(c.name)}
                      </div>
                      <div>
                        <strong style={{ display: 'block' }}>{c.name}</strong>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.company_name || '—'}</td>
                  <td style={{ fontSize: 13 }}>{c.phone || '—'}</td>
                  <td style={{ fontWeight: 700 }}>{c.order_count}</td>
                  <td style={{ fontWeight: 700, color: c.active_orders > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {c.active_orders}
                  </td>
                  <td style={{ fontWeight: 700, color: c.completed_orders > 0 ? '#15803d' : 'var(--text-muted)' }}>
                    {c.completed_orders}
                  </td>
                  <td style={{ fontWeight: 700 }}>{c.total_paid > 0 ? fmt(c.total_paid) : '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(c.last_order_at)}</td>
                  <td>
                    <span className={`status-badge ${c.is_active ? 'status-badge--completed' : 'status-badge--cancelled'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openDrawer(c)} title="View details">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        className={`btn btn-sm ${c.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleActive(c)}
                        title={c.is_active ? 'Deactivate' : 'Reactivate'}
                      >
                        <FontAwesomeIcon icon={c.is_active ? faUserXmark : faUserCheck} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Client Detail Drawer ── */}
      {drawer && (
        <div className="drawer-overlay" onClick={() => setDrawer(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="user-avatar user-avatar--lg" style={{ background: avatarColor(drawer.id) }}>
                  {initials(drawer.name)}
                </div>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{drawer.name}</h3>
                  <span className={`status-badge ${drawer.is_active ? 'status-badge--completed' : 'status-badge--cancelled'}`}>
                    {drawer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button className="modal__close" onClick={() => setDrawer(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <div className="drawer__body">
              {/* Contact info */}
              <div className="client-info-list">
                <div className="client-info-item">
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>{drawer.email}</span>
                </div>
                {drawer.phone && (
                  <div className="client-info-item">
                    <FontAwesomeIcon icon={faPhone} />
                    <span>{drawer.phone}</span>
                  </div>
                )}
                {drawer.company_name && (
                  <div className="client-info-item">
                    <FontAwesomeIcon icon={faBuilding} />
                    <span>{drawer.company_name}{drawer.industry ? ` · ${drawer.industry}` : ''}</span>
                  </div>
                )}
                <div className="client-info-item">
                  <FontAwesomeIcon icon={faCalendar} />
                  <span>Joined {fmtDate(drawer.created_at)}</span>
                </div>
              </div>

              {/* Summary tiles */}
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Total Orders</span>
                  <strong>{drawer.order_count}</strong>
                </div>
                <div className="detail-item">
                  <span>Active Orders</span>
                  <strong style={{ color: drawer.active_orders > 0 ? 'var(--primary)' : undefined }}>
                    {drawer.active_orders}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>Completed</span>
                  <strong style={{ color: drawer.completed_orders > 0 ? '#15803d' : undefined }}>
                    {drawer.completed_orders}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>Total Paid</span>
                  <strong>{drawer.total_paid > 0 ? `RWF ${fmt(drawer.total_paid)}` : '—'}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="drawer__actions">
                <button
                  className={`btn ${drawer.is_active ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => toggleActive(drawer)}
                >
                  <FontAwesomeIcon icon={drawer.is_active ? faUserXmark : faUserCheck} />
                  {drawer.is_active ? ' Deactivate' : ' Reactivate'}
                </button>
              </div>

              {/* Order history */}
              <div className="detail-section">
                <div className="detail-section__toggle" style={{ cursor: 'default' }}>
                  <strong><FontAwesomeIcon icon={faBoxOpen} style={{ marginRight: 8 }} />Order History</strong>
                </div>
                <div className="detail-section__body" style={{ padding: 0 }}>
                  {drawerLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><span className="spinner" /></div>
                  ) : orders.length === 0 ? (
                    <p className="detail-empty" style={{ padding: '16px' }}>No orders yet.</p>
                  ) : (
                    <table className="dash-table" style={{ fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Service</th>
                          <th>Status</th>
                          <th>Amount (RWF)</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id}>
                            <td><strong>{o.reference}</strong></td>
                            <td style={{ color: 'var(--text-muted)' }}>{o.service_name}</td>
                            <td><span className={`status-badge status-badge--${o.status}`}>{o.status.replace('_', ' ')}</span></td>
                            <td>{o.invoice_amount > 0 ? fmt(o.invoice_amount) : '—'}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{fmtDate(o.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
