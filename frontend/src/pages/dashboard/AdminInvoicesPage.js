import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileLines, faXmark, faPrint, faSearch, faDownload,
  faPlus, faCheck, faEye, faPen
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api, { exportCsv } from '../../api';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import './orders.css';
import './invoices.css';
import './admin-orders.css';

const fmt     = (n) => Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_FILTERS = ['all', 'pending', 'partial', 'paid', 'failed'];
const STATUS_COLORS  = { pending: 'requested', partial: 'in_progress', paid: 'completed', failed: 'cancelled' };

export default function AdminInvoicesPage() {
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');

  // Create invoice modal
  const [createModal, setCreateModal] = useState(false);
  const [orders, setOrders]           = useState([]);
  const [form, setForm]               = useState({ order_id: '', amount: '', due_date: '' });
  const [creating, setCreating]       = useState(false);
  const [createErr, setCreateErr]     = useState('');

  // Edit status modal
  const [editModal, setEditModal]   = useState(null);
  const [newStatus, setNewStatus]   = useState('');
  const [saving, setSaving]         = useState(false);

  // Receipt drawer
  const [receipt, setReceipt]       = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/invoices').catch(() => ({ data: [] }));
    setInvoices(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    const { data } = await api.get('/orders').catch(() => ({ data: [] }));
    setOrders(data.filter(o => o.status === 'confirmed' || o.status === 'in_progress' || o.status === 'completed'));
    setForm({ order_id: '', amount: '', due_date: '' });
    setCreateErr('');
    setCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setCreateErr('');
    try {
      await api.post('/invoices', form);
      await load();
      setCreateModal(false);
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed to create invoice.');
    }
    setCreating(false);
  };

  const openEdit = (inv) => { setNewStatus(inv.status); setEditModal(inv); };
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/invoices/${editModal.id}/status`, { status: newStatus });
      setInvoices(prev => prev.map(i => i.id === editModal.id ? { ...i, status: newStatus } : i));
      setEditModal(null);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const openReceipt = async (inv) => {
    setReceiptLoading(true);
    setReceipt({ loading: true });
    try {
      const { data } = await api.get(`/invoices/${inv.id}/receipt`);
      setReceipt(data);
    } catch { setReceipt(null); }
    setReceiptLoading(false);
  };

  const filtered = invoices.filter(inv => {
    const matchStatus = filter === 'all' || inv.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (inv.reference || '').toLowerCase().includes(q) ||
      (inv.client_name || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const { paged: pagedInvoices, page, totalPages, setPage, reset } = usePagination(filtered, 10);
  useEffect(() => { reset(); }, [filter, search]); // eslint-disable-line

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0);

  const stats = [
    { label: 'Total Invoices', value: invoices.length,                                    color: 'blue',   icon: '📄' },
    { label: 'Paid',           value: invoices.filter(i => i.status === 'paid').length,   color: 'green',  icon: '✅' },
    { label: 'Pending',        value: invoices.filter(i => i.status === 'pending').length,color: 'orange', icon: '⏳' },
    { label: 'Revenue (RWF)',  value: `RWF ${fmt(totalRevenue)}`,                         color: 'purple', icon: '💰' },
    { label: 'Outstanding',    value: `RWF ${fmt(totalPending)}`,                         color: 'red',    icon: '🔴' },
  ];

  return (
    <DashboardLayout pageTitle="Invoices" pageSubtitle="Finance · Manage all client invoices">

      {/* Stats */}
      <div className="stat-cards" style={{ marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card__icon stat-card__icon--${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-card__value" style={{ fontSize: typeof s.value === 'string' ? 15 : undefined }}>
                {loading ? '—' : s.value}
              </div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="orders-toolbar">
        <div className="orders-filters">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`orders-filter-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="orders-toolbar__right">
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input className="orders-search" style={{ paddingLeft: 34 }}
              placeholder="Search order ref, client…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => exportCsv('payments', 'payments.csv')}>
            <FontAwesomeIcon icon={faDownload} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <FontAwesomeIcon icon={faPlus} /> New Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-wrap">
        {loading ? (
          <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <span><FontAwesomeIcon icon={faFileLines} style={{ fontSize: 32 }} /></span>
            <p>{invoices.length === 0 ? 'No invoices yet.' : 'No invoices match your filters.'}</p>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Client</th>
                <th>Amount (RWF)</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Issued</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedInvoices.map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.reference}</strong></td>
                  <td style={{ fontSize: 13 }}>{inv.client_name || '—'}</td>
                  <td><strong>{fmt(inv.amount)}</strong></td>
                  <td>
                    <span className={`status-badge status-badge--${STATUS_COLORS[inv.status] || 'requested'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {inv.due_date ? fmtDate(inv.due_date) : '—'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(inv.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openReceipt(inv)} title="View receipt">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(inv)} title="Update status">
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} total={filtered.length} pageSize={10} />

      {/* ── Create Invoice Modal ── */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>New Invoice</h3>
              <button className="modal__close" onClick={() => setCreateModal(false)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={handleCreate}>
              {createErr && <div className="auth-form__alert auth-form__alert--error">{createErr}</div>}
              <div className="form-group">
                <label>Order *</label>
                <select value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })} required>
                  <option value="">Select an order…</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.reference} — {o.client_name || o.service_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Amount (RWF) *</label>
                  <input type="number" min="0" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="e.g. 150000" />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : <><FontAwesomeIcon icon={faPlus} /> Create Invoice</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Status Modal ── */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div>
                <h3>Update Status</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{editModal.reference} · RWF {fmt(editModal.amount)}</span>
              </div>
              <button className="modal__close" onClick={() => setEditModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSaveStatus}>
              <div className="form-group">
                <label>Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {['pending', 'partial', 'paid', 'failed'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : <><FontAwesomeIcon icon={faCheck} /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Receipt Drawer ── */}
      {receipt && (
        <div className="drawer-overlay" onClick={() => setReceipt(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer__header">
              <div>
                <h3>Invoice Receipt</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{receipt.reference}</span>
              </div>
              <button className="modal__close" onClick={() => setReceipt(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            {receiptLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" /></div>
            ) : (
              <div className="drawer__body">
                <div className="receipt-card">
                  <div className="receipt-header">
                    <div className="receipt-logo">DM<span>RW</span></div>
                    <div>
                      <div className="receipt-title">Payment Receipt</div>
                      <div className="receipt-sub">DigitalMarkRW</div>
                    </div>
                  </div>
                  <div className="receipt-divider" />
                  <div className="detail-grid">
                    <div className="detail-item"><span>Client</span><strong>{receipt.client_name}</strong></div>
                    <div className="detail-item"><span>Email</span><strong style={{ fontSize: 12 }}>{receipt.email}</strong></div>
                    <div className="detail-item"><span>Order Ref</span><strong>{receipt.reference}</strong></div>
                    <div className="detail-item"><span>Status</span>
                      <strong><span className={`status-badge status-badge--${STATUS_COLORS[receipt.status]}`}>{receipt.status}</span></strong>
                    </div>
                    <div className="detail-item"><span>Amount</span><strong>RWF {fmt(receipt.amount)}</strong></div>
                    <div className="detail-item"><span>Due Date</span><strong>{receipt.due_date ? fmtDate(receipt.due_date) : '—'}</strong></div>
                  </div>
                  <div className="receipt-divider" />
                  <strong style={{ fontSize: 13 }}>Payment Transactions</strong>
                  {receipt.payments?.filter(p => p.paid_at).length === 0 ? (
                    <p className="detail-empty" style={{ marginTop: 8 }}>No completed payments recorded.</p>
                  ) : (
                    <ul className="receipt-payments">
                      {receipt.payments?.filter(p => p.paid_at).map((p, i) => (
                        <li key={i} className="receipt-payment-item">
                          <div>
                            <strong style={{ textTransform: 'capitalize' }}>{p.method?.replace('_', ' ')}</strong>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Ref: {p.ref}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong>RWF {fmt(p.amount)}</strong>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>{fmtDate(p.paid_at)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="receipt-divider" />
                  <div className="receipt-total">
                    <span>Total Paid</span>
                    <strong>RWF {fmt(receipt.amount)}</strong>
                  </div>
                </div>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.print()}>
                  <FontAwesomeIcon icon={faPrint} /> Print Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
