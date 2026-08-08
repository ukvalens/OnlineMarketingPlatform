import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faBagShopping, faEye, faXmark, faCheck, faBan,
  faDownload, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import OrderModal from './OrderModal';
import api, { getImageUrl } from '../../api';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import './orders.css';

const STATUSES = ['all', 'requested', 'quoted', 'confirmed', 'in_progress', 'in_review', 'completed', 'cancelled'];

const fmt = (n) => Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtStatus = (status) => typeof status === 'string' ? status.replace('_', ' ') : 'Unknown';

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Detail drawer
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrders = useCallback(() =>
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {}), []);

  useEffect(() => {
    Promise.all([loadOrders(), api.get('/services').then(r => setServices(r.data))])
      .finally(() => setLoading(false));
  }, [loadOrders]);

  const handleOrderSuccess = async () => {
    await loadOrders();
    setShowModal(false);
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 4000);
  };

  const openDetail = async (order) => {
    setSelected(order);
    setDetailLoading(true);
    try {
      const [d, m, del] = await Promise.all([
        api.get(`/orders/${order.id}`),
        api.get(`/orders/${order.id}/milestones`),
        api.get(`/orders/${order.id}/deliverables`),
      ]);
      setDetail(d.data);
      setMilestones(m.data);
      setDeliverables(del.data);
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelected(null); setDetail(null); setMilestones([]); setDeliverables([]); };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${selected.id}/confirm`);
      await loadOrders();
      await openDetail({ id: selected.id });
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to confirm order.');
    }
    setActionLoading(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/orders/${selected.id}/cancel`);
      await loadOrders();
      closeDetail();
    } catch (e) {
      alert(e.response?.data?.message || 'Cannot cancel this order.');
    }
    setActionLoading(false);
  };

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const matchSearch = !search || o.reference.toLowerCase().includes(search.toLowerCase()) ||
      o.service_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const { paged: pagedOrders, page, totalPages, setPage, reset } = usePagination(filtered, 10);
  useEffect(() => { reset(); }, [filter, search]); // eslint-disable-line

  const stats = [
    { label: 'Total',     value: orders.length, color: 'blue',   icon: '📦' },
    { label: 'Active',    value: orders.filter(o => ['requested','quoted','confirmed','in_progress','in_review'].includes(o.status)).length, color: 'purple', icon: '⚡' },
    { label: 'Completed', value: orders.filter(o => o.status === 'completed').length,  color: 'green',  icon: '✅' },
    { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length,  color: 'orange', icon: '🚫' },
  ];

  return (
    <DashboardLayout pageTitle="My Orders" pageSubtitle="Track and manage your service orders">

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

      {orderSuccess && (
        <div className="auth-form__alert auth-form__alert--success" style={{ marginBottom: 16 }}>
          ✅ Order submitted! Our team will review it and get back to you shortly.
        </div>
      )}

      <div className="orders-toolbar">
        <div className="orders-filters">
          {STATUSES.map(s => (
            <button key={s} className={`orders-filter-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : fmtStatus(s)}
            </button>
          ))}
        </div>
        <div className="orders-toolbar__right">
          <input className="orders-search" placeholder="Search by ref or service…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> New Order
          </button>
        </div>
      </div>

      <div className="dash-table-wrap">
        {loading ? (
          <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <span><FontAwesomeIcon icon={faBagShopping} style={{ fontSize: 32 }} /></span>
            {orders.length === 0
              ? <><p>No orders yet.</p><Link to="/dashboard/services" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Browse Services</Link></>
              : <p>No orders match your filter.</p>}
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Reference</th><th>Service</th><th>Package</th>
                <th>Quote (RWF)</th><th>Status</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map(order => (
                <tr key={order.id}>
                  <td><strong>{order.reference}</strong></td>
                  <td>{order.service_name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{order.tier || '—'}</td>
                  <td>{order.quote_amount ? fmt(order.quote_amount) : order.package_price ? fmt(order.package_price) : '—'}</td>
                  <td><span className={`status-badge status-badge--${order.status || 'unknown'}`}>{fmtStatus(order.status)}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtDate(order.created_at)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openDetail(order)}>
                      <FontAwesomeIcon icon={faEye} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} total={filtered.length} pageSize={10} />

      {showModal && (
        <OrderModal
          services={services}
          onClose={() => setShowModal(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* ── Order Detail Drawer ── */}
      {selected && (
        <div className="drawer-overlay" onClick={closeDetail}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer__header">
              <div>
                <h3>{selected.reference}</h3>
                <span className={`status-badge status-badge--${selected.status || 'unknown'}`}>{fmtStatus(selected.status)}</span>
              </div>
              <button className="modal__close" onClick={closeDetail}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            {detailLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <span className="spinner" />
              </div>
            ) : detail && (
              <div className="drawer__body">
                <div className="detail-grid">
                  <div className="detail-item"><span>Service</span><strong>{detail.service_name}</strong></div>
                  <div className="detail-item"><span>Package</span><strong style={{ textTransform: 'capitalize' }}>{detail.tier || '—'}</strong></div>
                  <div className="detail-item"><span>Quote</span><strong>{detail.quote_amount ? `RWF ${fmt(detail.quote_amount)}` : 'Pending'}</strong></div>
                  <div className="detail-item"><span>Timeline</span><strong>{detail.proposed_timeline || '—'}</strong></div>
                  <div className="detail-item"><span>Progress</span><strong>{detail.progress_percent}%</strong></div>
                  <div className="detail-item"><span>Placed</span><strong>{fmtDate(detail.created_at)}</strong></div>
                  <div className="detail-item"><span>Updated</span><strong>{fmtDate(detail.updated_at)}</strong></div>
                </div>

                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${detail.progress_percent}%` }} />
                </div>

                {detail.notes && (
                  <div className="detail-notes">
                    <strong>Your Notes</strong>
                    <p style={{ whiteSpace: 'pre-line' }}>{detail.notes}</p>
                  </div>
                )}

                <div className="drawer__actions">
                  {detail.status === 'quoted' && (
                    <button className="btn btn-primary" onClick={handleConfirm} disabled={actionLoading}>
                      <FontAwesomeIcon icon={faCheck} /> Accept Quote (RWF {fmt(detail.quote_amount)})
                    </button>
                  )}
                  {['requested', 'quoted', 'confirmed'].includes(detail.status) && (
                    <button className="btn btn-danger" onClick={handleCancel} disabled={actionLoading}>
                      <FontAwesomeIcon icon={faBan} /> Cancel Order
                    </button>
                  )}
                  <Link to="/dashboard/client/messages" className="btn btn-outline">💬 Message Us</Link>
                </div>

                <DetailSection title={`Milestones (${milestones.length})`}>
                  {milestones.length === 0 ? <p className="detail-empty">No milestones added yet.</p> : (
                    <ul className="milestone-list">
                      {milestones.map(m => (
                        <li key={m.id} className={`milestone-item${m.is_completed ? ' done' : ''}`}>
                          <span className="milestone-dot" />
                          <span>{m.title}</span>
                          {m.is_completed && <span className="milestone-check">✓</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </DetailSection>

                <DetailSection title={`Deliverables (${deliverables.length})`}>
                  {deliverables.length === 0 ? <p className="detail-empty">No deliverables uploaded yet.</p> : (
                    <ul className="deliverable-list">
                      {deliverables.map(d => (
                        <li key={d.id} className="deliverable-item">
                          <span>📎 {d.file_name}</span>
                          <a href={getImageUrl(d.file_url)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                            <FontAwesomeIcon icon={faDownload} /> Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </DetailSection>
              </div>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

function DetailSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="detail-section">
      <button className="detail-section__toggle" onClick={() => setOpen(!open)}>
        <strong>{title}</strong>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} />
      </button>
      {open && <div className="detail-section__body">{children}</div>}
    </div>
  );
}
