import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard, faXmark, faSearch, faDownload,
  faCheck, faEye, faMobileAlt, faMoneyBill
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api from '../../api';
import './orders.css';
import './invoices.css';
import './admin-orders.css';

const fmt     = (n) => Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const METHOD_ICONS = { mtn_momo: '📱', airtel_money: '📲', card: '💳' };
const STATUS_COLORS = { pending: 'requested', paid: 'completed', failed: 'cancelled', partial: 'in_progress' };

export default function AdminPaymentsPage() {
  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch]       = useState('');

  // Detail drawer
  const [drawer, setDrawer]       = useState(null);

  // Manual record modal
  const [recordModal, setRecordModal] = useState(false);
  const [invoices, setInvoices]       = useState([]);
  const [form, setForm]               = useState({ invoice_id: '', method: 'mtn_momo', amount: '', transaction_ref: '' });
  const [recording, setRecording]     = useState(false);
  const [recordErr, setRecordErr]     = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/payments').catch(() => ({ data: [] }));
    setPayments(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openRecord = async () => {
    const { data } = await api.get('/invoices').catch(() => ({ data: [] }));
    setInvoices(data.filter(i => i.status !== 'paid'));
    setForm({ invoice_id: '', method: 'mtn_momo', amount: '', transaction_ref: '' });
    setRecordErr('');
    setRecordModal(true);
  };

  const handleRecord = async (e) => {
    e.preventDefault();
    setRecording(true); setRecordErr('');
    try {
      await api.post('/payments', form);
      await load();
      setRecordModal(false);
    } catch (err) {
      setRecordErr(err.response?.data?.message || 'Failed to record payment.');
    }
    setRecording(false);
  };

  const filtered = payments.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchMethod = methodFilter === 'all' || p.method === methodFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.transaction_ref || '').toLowerCase().includes(q) ||
      (p.reference || '').toLowerCase().includes(q) ||
      (p.client_name || '').toLowerCase().includes(q);
    return matchStatus && matchMethod && matchSearch;
  });

  const totalPaid    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const mtnCount     = payments.filter(p => p.method === 'mtn_momo').length;
  const airtelCount  = payments.filter(p => p.method === 'airtel_money').length;

  const stats = [
    { label: 'Total Transactions', value: payments.length,                                      color: 'blue',   icon: '💳' },
    { label: 'Successful',         value: payments.filter(p => p.status === 'paid').length,     color: 'green',  icon: '✅' },
    { label: 'Pending',            value: payments.filter(p => p.status === 'pending').length,  color: 'orange', icon: '⏳' },
    { label: 'Total Collected',    value: `RWF ${fmt(totalPaid)}`,                              color: 'purple', icon: '💰' },
    { label: 'Awaiting',           value: `RWF ${fmt(totalPending)}`,                           color: 'red',    icon: '🔴' },
  ];

  return (
    <DashboardLayout pageTitle="Payments" pageSubtitle="Finance · All payment transactions">

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

      {/* Payment method summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'mtn_momo',     label: 'MTN MoMo',    icon: '📱', count: mtnCount },
          { id: 'airtel_money', label: 'Airtel Money', icon: '📲', count: airtelCount },
          { id: 'card',         label: 'Card',         icon: '💳', count: payments.filter(p => p.method === 'card').length },
        ].map(m => (
          <div key={m.id}
            className={`role-summary-card${methodFilter === m.id ? ' selected' : ''}`}
            style={{ cursor: 'pointer', minWidth: 140, borderColor: methodFilter === m.id ? 'var(--primary)' : undefined }}
            onClick={() => setMethodFilter(methodFilter === m.id ? 'all' : m.id)}
          >
            <span style={{ fontSize: 22 }}>{m.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{loading ? '—' : m.count} transaction{m.count !== 1 ? 's' : ''}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="orders-toolbar">
        <div className="orders-filters">
          {['all', 'pending', 'paid', 'failed'].map(s => (
            <button key={s} className={`orders-filter-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="orders-toolbar__right">
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input className="orders-search" style={{ paddingLeft: 34 }}
              placeholder="Search ref, order, client…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <a href="http://localhost:5000/api/admin/export/payments" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            <FontAwesomeIcon icon={faDownload} /> Export CSV
          </a>
          <button className="btn btn-primary btn-sm" onClick={openRecord}>
            <FontAwesomeIcon icon={faMoneyBill} /> Record Payment
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-wrap">
        {loading ? (
          <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <span><FontAwesomeIcon icon={faCreditCard} style={{ fontSize: 32 }} /></span>
            <p>{payments.length === 0 ? 'No payment records yet.' : 'No payments match your filters.'}</p>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Transaction Ref</th>
                <th>Order Ref</th>
                <th>Client</th>
                <th>Method</th>
                <th>Amount (RWF)</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {p.transaction_ref ? p.transaction_ref.slice(0, 16) + '…' : '—'}
                  </td>
                  <td><strong>{p.reference || '—'}</strong></td>
                  <td style={{ fontSize: 13 }}>{p.client_name || '—'}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      {METHOD_ICONS[p.method]} {p.method?.replace('_', ' ')}
                    </span>
                  </td>
                  <td><strong>{fmt(p.amount)}</strong></td>
                  <td>
                    <span className={`status-badge status-badge--${STATUS_COLORS[p.status] || 'requested'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {p.paid_at ? fmtDate(p.paid_at) : fmtDate(p.created_at)}
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setDrawer(p)} title="View details">
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Record Payment Modal ── */}
      {recordModal && (
        <div className="modal-overlay" onClick={() => setRecordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Record Manual Payment</h3>
              <button className="modal__close" onClick={() => setRecordModal(false)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={handleRecord}>
              {recordErr && <div className="auth-form__alert auth-form__alert--error">{recordErr}</div>}
              <div className="form-group">
                <label>Invoice *</label>
                <select value={form.invoice_id} onChange={e => setForm({ ...form, invoice_id: e.target.value })} required>
                  <option value="">Select invoice…</option>
                  {invoices.map(i => (
                    <option key={i.id} value={i.id}>{i.reference} — RWF {fmt(i.amount)} ({i.status})</option>
                  ))}
                </select>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Method *</label>
                  <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                    <option value="mtn_momo">MTN MoMo</option>
                    <option value="airtel_money">Airtel Money</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (RWF) *</label>
                  <input type="number" min="0" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="e.g. 150000" />
                </div>
              </div>
              <div className="form-group">
                <label>Transaction Reference</label>
                <input value={form.transaction_ref}
                  onChange={e => setForm({ ...form, transaction_ref: e.target.value })}
                  placeholder="e.g. MoMo ref or bank ref" />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setRecordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={recording}>
                  {recording ? 'Recording…' : <><FontAwesomeIcon icon={faCheck} /> Record Payment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Payment Detail Drawer ── */}
      {drawer && (
        <div className="drawer-overlay" onClick={() => setDrawer(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer__header">
              <div>
                <h3>Payment Detail</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{drawer.reference}</span>
              </div>
              <button className="modal__close" onClick={() => setDrawer(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="drawer__body">
              <div className="detail-grid">
                <div className="detail-item"><span>Client</span><strong>{drawer.client_name || '—'}</strong></div>
                <div className="detail-item"><span>Order Ref</span><strong>{drawer.reference || '—'}</strong></div>
                <div className="detail-item"><span>Method</span>
                  <strong>{METHOD_ICONS[drawer.method]} {drawer.method?.replace('_', ' ')}</strong>
                </div>
                <div className="detail-item"><span>Amount</span><strong>RWF {fmt(drawer.amount)}</strong></div>
                <div className="detail-item"><span>Status</span>
                  <strong>
                    <span className={`status-badge status-badge--${STATUS_COLORS[drawer.status]}`}>{drawer.status}</span>
                  </strong>
                </div>
                <div className="detail-item"><span>Paid At</span>
                  <strong style={{ fontSize: 12 }}>{drawer.paid_at ? fmtTime(drawer.paid_at) : '—'}</strong>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span>Transaction Ref</span>
                  <strong style={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {drawer.transaction_ref || '—'}
                  </strong>
                </div>
                {drawer.gateway_response && (
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                    <span>Gateway Response</span>
                    <pre style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--text-muted)' }}>
                      {JSON.stringify(drawer.gateway_response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
