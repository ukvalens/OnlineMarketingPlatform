import { useEffect, useState, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboard, faEye, faXmark, faCheck, faBan, faUpload,
  faPlus, faChevronDown, faChevronUp, faDownload, faSearch,
  faPaperPlane, faSliders, faMessage, faTrash, faPrint
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api, { exportCsvData, printElement, getImageUrl } from '../../api';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import './orders.css';
import './admin-content.css';
import './admin-orders.css';

const STATUSES = ['all', 'requested', 'quoted', 'confirmed', 'in_progress', 'in_review', 'completed', 'cancelled'];

// Mirrors the server-side TRANSITIONS map
const TRANSITIONS = {
  confirmed:   ['in_progress', 'cancelled'],
  in_progress: ['in_review',   'cancelled'],
  in_review:   ['completed',   'in_progress'],
};

const fmt     = (n) => Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const canEdit = ['admin', 'staff'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  const [orders, setOrders]   = useState([]);
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');

  // Drawer
  const [drawer, setDrawer]           = useState(null);
  const [detail, setDetail]           = useState(null);
  const [milestones, setMilestones]   = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionBusy, setActionBusy]   = useState(false);
  const [drawerError, setDrawerError] = useState('');

  // Quote form
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');

  // Status update
  const [statusForm, setStatusForm]   = useState({ status: '', progress_percent: '' });

  // Milestone
  const [milestoneTitle, setMilestoneTitle] = useState('');

  // Deliverable upload
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  // Assign staff
  const [assignId, setAssignId] = useState('');

  const loadOrders = useCallback(async () => {
    const { data } = await api.get('/orders').catch(() => ({ data: [] }));
    setOrders(data);
  }, []);

  useEffect(() => {
    Promise.all([
      loadOrders(),
      api.get('/admin/users').then(r => setStaff(r.data.filter(u => ['staff', 'admin'].includes(u.role)))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [loadOrders]);

  /* ── open drawer ── */
  const openDrawer = async (order) => {
    setDrawer(order);
    setDrawerError('');
    setQuoteAmount('');
    setStatusForm({ status: '', progress_percent: '' });
    setMilestoneTitle('');
    setAssignId(order.assigned_staff_id || '');
    setDrawerLoading(true);
    try {
      const [d, m, del] = await Promise.all([
        api.get(`/orders/${order.id}`),
        api.get(`/orders/${order.id}/milestones`),
        api.get(`/orders/${order.id}/deliverables`),
      ]);
      setDetail(d.data);
      setMilestones(m.data);
      setDeliverables(del.data);
    } catch { setDrawerError('Failed to load order details.'); }
    setDrawerLoading(false);
  };

  const closeDrawer = () => { setDrawer(null); setDetail(null); setMilestones([]); setDeliverables([]); };

  const refreshDrawer = async () => {
    if (!drawer) return;
    const [d, m, del] = await Promise.all([
      api.get(`/orders/${drawer.id}`),
      api.get(`/orders/${drawer.id}/milestones`),
      api.get(`/orders/${drawer.id}/deliverables`),
    ]);
    setDetail(d.data);
    setMilestones(m.data);
    setDeliverables(del.data);
    await loadOrders();
  };

  /* ── submit quote ── */
  const handleQuote = async (e) => {
    e.preventDefault();
    setActionBusy(true); setDrawerError('');
    try {
      await api.patch(`/orders/${drawer.id}/quote`, { quote_amount: quoteAmount, proposed_timeline: quoteTimeline });
      setQuoteAmount(''); setQuoteTimeline('');
      await refreshDrawer();
    } catch (err) { setDrawerError(err.response?.data?.message || 'Failed to submit quote.'); }
    setActionBusy(false);
  };

  /* ── update status ── */
  const handleStatus = async (e) => {
    e.preventDefault();
    if (!statusForm.status) return;
    setActionBusy(true); setDrawerError('');
    try {
      await api.patch(`/orders/${drawer.id}/status`, {
        status: statusForm.status,
        progress_percent: statusForm.progress_percent || undefined,
      });
      setStatusForm({ status: '', progress_percent: '' });
      await refreshDrawer();
    } catch (err) { setDrawerError(err.response?.data?.message || 'Failed to update status.'); }
    setActionBusy(false);
  };

  /* ── cancel ── */
  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setActionBusy(true); setDrawerError('');
    try {
      await api.patch(`/orders/${drawer.id}/cancel`);
      await refreshDrawer();
    } catch (err) { setDrawerError(err.response?.data?.message || 'Cannot cancel.'); }
    setActionBusy(false);
  };

  /* ── add milestone ── */
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    setActionBusy(true);
    try {
      await api.post(`/orders/${drawer.id}/milestones`, { title: milestoneTitle });
      setMilestoneTitle('');
      await refreshDrawer();
    } catch { /* ignore */ }
    setActionBusy(false);
  };

  /* ── complete milestone ── */
  const handleCompleteMilestone = async (mid) => {
    await api.patch(`/orders/${drawer.id}/milestones/${mid}`).catch(() => {});
    await refreshDrawer();
  };

  /* ── upload deliverable ── */
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/orders/${drawer.id}/deliverables`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshDrawer();
    } catch { /* ignore */ }
    setUploading(false);
    e.target.value = '';
  };

  /* ── assign staff ── */
  const handleAssign = async () => {
    setActionBusy(true);
    try {
      await api.patch(`/orders/${drawer.id}/assign`, { assigned_staff_id: assignId || null });
      await refreshDrawer();
    } catch { /* ignore */ }
    setActionBusy(false);
  };

  /* ── delete order ── */
  const handleDelete = async (o) => {
    if (!window.confirm(`Permanently delete order ${o.reference}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/orders/${o.id}`);
      setOrders(prev => prev.filter(x => x.id !== o.id));
      if (drawer?.id === o.id) closeDrawer();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete.'); }
  };

  /* ── filtered list ── */
  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || o.reference.toLowerCase().includes(q) ||
      o.service_name?.toLowerCase().includes(q) ||
      o.client_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const { paged: pagedOrders, page, totalPages, setPage, reset } = usePagination(filtered, 10);
  useEffect(() => { reset(); }, [filter, search]); // eslint-disable-line

  const stats = [
    { label: 'Total',       value: orders.length,                                                                    color: 'blue',   icon: '📦' },
    { label: 'Pending',     value: orders.filter(o => ['requested','quoted'].includes(o.status)).length,             color: 'orange', icon: '⏳' },
    { label: 'In Progress', value: orders.filter(o => ['confirmed','in_progress','in_review'].includes(o.status)).length, color: 'purple', icon: '⚡' },
    { label: 'Completed',   value: orders.filter(o => o.status === 'completed').length,                              color: 'green',  icon: '✅' },
  ];

  return (
    <DashboardLayout pageTitle="Orders Management" pageSubtitle="View, quote, update and track all client orders">

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
          {STATUSES.map(s => (
            <button key={s} className={`orders-filter-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="orders-toolbar__right">
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none' }} />
            <input className="orders-search" style={{ paddingLeft: 34 }}
              placeholder="Search ref, client, service…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => exportCsvData(filtered.map(o => ({
                reference: o.reference,
                client: o.client_name || '',
                service: o.service_name || '',
                package: o.tier || '',
                status: o.status.replace('_', ' '),
                quote_rwf: o.quote_amount ? Number(o.quote_amount).toLocaleString() : '',
                progress: `${o.progress_percent || 0}%`,
                placed: fmtDate(o.created_at),
              })), 'orders.xls')}>
            <FontAwesomeIcon icon={faDownload} /> Export Excel
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => printElement('orders-table-print', 'Orders')}>
            <FontAwesomeIcon icon={faPrint} /> PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-wrap" id="orders-table-print">
        {loading ? (
          <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <span><FontAwesomeIcon icon={faClipboard} style={{ fontSize: 32 }} /></span>
            <p>{orders.length === 0 ? 'No orders yet.' : 'No orders match your filter.'}</p>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Service</th>
                <th>Quote (RWF)</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.reference}</strong></td>
                  <td>{o.client_name}</td>
                  <td style={{ fontSize: 13 }}>{o.service_name}</td>
                  <td>{o.quote_amount ? fmt(o.quote_amount) : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: '100%', width: `${o.progress_percent || 0}%`, background: 'var(--primary)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{o.progress_percent || 0}%</span>
                    </div>
                  </td>
                  <td><span className={`status-badge status-badge--${o.status}`}>{o.status.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(o.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openDrawer(o)}>
                        <FontAwesomeIcon icon={faEye} /> Manage
                      </button>
                      {canDelete && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o)} title="Delete">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} total={filtered.length} pageSize={10} />

      {/* ── Order Management Drawer ── */}
      {drawer && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <div className="drawer drawer--wide" onClick={e => e.stopPropagation()}>
            <div className="drawer__header">
              <div>
                <h3>{drawer.reference}</h3>
                {detail && <span className={`status-badge status-badge--${detail.status}`}>{detail.status.replace('_', ' ')}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {detail && (
                  <>
                    <button className="btn btn-outline btn-sm" onClick={() =>
                      exportCsvData([{
                        reference: detail.reference,
                        client: detail.client_name || '',
                        service: detail.service_name || '',
                        package: detail.tier || '',
                        status: detail.status.replace('_', ' '),
                        quote_rwf: detail.quote_amount ? Number(detail.quote_amount).toLocaleString() : '',
                        timeline: detail.proposed_timeline || '',
                        progress: `${detail.progress_percent}%`,
                        assigned_staff: detail.assigned_staff_name || '',
                        placed: fmtDate(detail.created_at),
                        notes: detail.notes || '',
                      }], `order-${detail.reference}.xls`)
                    }>
                      <FontAwesomeIcon icon={faDownload} /> Excel
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => printElement('order-detail-print', `Order ${detail.reference}`)}>
                      <FontAwesomeIcon icon={faPrint} /> PDF
                    </button>
                  </>
                )}
                <button className="modal__close" onClick={closeDrawer}><FontAwesomeIcon icon={faXmark} /></button>
              </div>
            </div>

            {drawerLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><span className="spinner" /></div>
            ) : detail && (
              <div className="drawer__body">
                {drawerError && <div className="auth-form__alert auth-form__alert--error">{drawerError}</div>}

                {/* Info grid */}
                <div className="detail-grid" id="order-detail-print">
                  <div className="detail-item"><span>Client</span><strong>{detail.client_name}</strong></div>
                  <div className="detail-item"><span>Service</span><strong>{detail.service_name}</strong></div>
                  <div className="detail-item"><span>Package</span><strong style={{ textTransform: 'capitalize' }}>{detail.tier || '—'}</strong></div>
                  <div className="detail-item"><span>Quote</span><strong>{detail.quote_amount ? `RWF ${fmt(detail.quote_amount)}` : 'Not set'}</strong></div>
                  <div className="detail-item"><span>Timeline</span><strong>{detail.proposed_timeline || '—'}</strong></div>
                  <div className="detail-item"><span>Progress</span><strong>{detail.progress_percent}%</strong></div>
                  <div className="detail-item"><span>Placed</span><strong>{fmtDate(detail.created_at)}</strong></div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${detail.progress_percent}%` }} />
                </div>

                {detail.notes && (
                  <div className="detail-notes">
                    <strong>Client Notes</strong>
                    <p>{detail.notes}</p>
                  </div>
                )}

                {canEdit && (
                  <>
                    {/* ── Quote ── */}
                    {detail.status === 'requested' && (
                      <AdminSection title="Submit Quote" icon={faPaperPlane}>
                        <form className="admin-action-row" onSubmit={handleQuote}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Quote Amount (RWF) *</label>
                            <input type="number" min="0" placeholder="e.g. 150000"
                              value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Proposed Timeline</label>
                            <input type="text" placeholder="e.g. 2 weeks"
                              value={quoteTimeline} onChange={e => setQuoteTimeline(e.target.value)} />
                          </div>
                          <button type="submit" className="btn btn-primary btn-sm" disabled={actionBusy} style={{ alignSelf: 'flex-end' }}>
                            <FontAwesomeIcon icon={faPaperPlane} /> Send Quote
                          </button>
                        </form>
                      </AdminSection>
                    )}

                    {/* ── Status update ── */}
                    {TRANSITIONS[detail.status] && (
                      <AdminSection title="Update Status" icon={faSliders}>
                        {/* State machine flow */}
                        <div className="state-flow">
                          {['requested','quoted','confirmed','in_progress','in_review','completed'].map((s, i, arr) => (
                            <span key={s} className="state-flow__wrap">
                              <span className={`state-flow__node${
                                s === detail.status ? ' current' :
                                ['requested','quoted','confirmed','in_progress','in_review','completed']
                                  .indexOf(s) < arr.indexOf(detail.status) ? ' done' : ''
                              }`}>{s.replace('_',' ')}</span>
                              {i < arr.length - 1 && <span className="state-flow__arrow">›</span>}
                            </span>
                          ))}
                        </div>
                        <form className="admin-action-row" onSubmit={handleStatus} style={{ marginTop: 12 }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Move to *</label>
                            <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })} required>
                              <option value="">Select next status…</option>
                              {(TRANSITIONS[detail.status] || []).map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ width: 120 }}>
                            <label>Progress %</label>
                            <input type="number" min="0" max="100" placeholder="0–100"
                              value={statusForm.progress_percent}
                              onChange={e => setStatusForm({ ...statusForm, progress_percent: e.target.value })} />
                          </div>
                          <button type="submit" className="btn btn-primary btn-sm" disabled={actionBusy || !statusForm.status} style={{ alignSelf: 'flex-end' }}>
                            <FontAwesomeIcon icon={faCheck} /> Update
                          </button>
                        </form>
                      </AdminSection>
                    )}

                    {/* ── Assign staff ── */}
                    <AdminSection title="Assign Staff" icon={faSliders}>
                      <div className="admin-action-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Assigned To</label>
                          <select value={assignId} onChange={e => setAssignId(e.target.value)}>
                            <option value="">Unassigned</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                          </select>
                        </div>
                        <button type="button" className="btn btn-outline btn-sm" disabled={actionBusy} style={{ alignSelf: 'flex-end' }} onClick={handleAssign}>
                          <FontAwesomeIcon icon={faCheck} /> Save
                        </button>
                      </div>
                    </AdminSection>

                    {/* ── Cancel ── */}
                    {['requested', 'quoted', 'confirmed'].includes(detail.status) && (
                      <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={actionBusy}>
                        <FontAwesomeIcon icon={faBan} /> Cancel Order
                      </button>
                    )}
                    <Link to="/dashboard/admin/messages" className="btn btn-outline btn-sm">
                      <FontAwesomeIcon icon={faMessage} /> Messages
                    </Link>
                  </>
                )}

                {/* ── Milestones ── */}
                <AdminSection title={`Milestones (${milestones.length})`} icon={faCheck} collapsible>
                  {canEdit && (
                    <form className="admin-action-row" onSubmit={handleAddMilestone} style={{ marginBottom: 12 }}>
                      <input className="orders-search" style={{ flex: 1 }} placeholder="Milestone title…"
                        value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} required />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={actionBusy}>
                        <FontAwesomeIcon icon={faPlus} /> Add
                      </button>
                    </form>
                  )}
                  {milestones.length === 0 ? (
                    <p className="detail-empty">No milestones yet.</p>
                  ) : (
                    <ul className="milestone-list">
                      {milestones.map(m => (
                        <li key={m.id} className={`milestone-item${m.is_completed ? ' done' : ''}`}>
                          <span className="milestone-dot" />
                          <span style={{ flex: 1 }}>{m.title}</span>
                          {m.is_completed
                            ? <span className="milestone-check" title={fmtTime(m.completed_at)}>✓ {fmtDate(m.completed_at)}</span>
                            : canEdit && (
                              <button className="btn btn-outline btn-sm" style={{ padding: '3px 10px' }}
                                onClick={() => handleCompleteMilestone(m.id)}>
                                Mark done
                              </button>
                            )}
                        </li>
                      ))}
                    </ul>
                  )}
                </AdminSection>

                {/* ── Deliverables ── */}
                <AdminSection title={`Deliverables (${deliverables.length})`} icon={faUpload} collapsible>
                  {canEdit && (
                    <div style={{ marginBottom: 12 }}>
                      <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleUpload} />
                      <button className="btn btn-outline btn-sm" onClick={() => fileRef.current.click()} disabled={uploading}>
                        <FontAwesomeIcon icon={faUpload} /> {uploading ? 'Uploading…' : 'Upload File'}
                      </button>
                    </div>
                  )}
                  {deliverables.length === 0 ? (
                    <p className="detail-empty">No deliverables uploaded yet.</p>
                  ) : (
                    <ul className="deliverable-list">
                      {deliverables.map(d => (
                        <li key={d.id} className="deliverable-item">
                          <div>
                            <span>📎 {d.file_name}</span>
                            {d.is_approved === true  && <span className="deliv-badge deliv-badge--ok">Approved</span>}
                            {d.is_approved === false && <span className="deliv-badge deliv-badge--rev">Revision requested</span>}
                            {d.revision_note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Note: {d.revision_note}</div>}
                          </div>
                          <a href={getImageUrl(d.file_url)} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                            <FontAwesomeIcon icon={faDownload} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </AdminSection>

              </div>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

function AdminSection({ title, icon, collapsible = false, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="detail-section">
      <div className={`detail-section__toggle${collapsible ? ' clickable' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        style={{ cursor: collapsible ? 'pointer' : 'default' }}>
        <strong>{icon && <FontAwesomeIcon icon={icon} style={{ marginRight: 8, opacity: 0.6 }} />}{title}</strong>
        {collapsible && <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} />}
      </div>
      {open && <div className="detail-section__body">{children}</div>}
    </div>
  );
}
