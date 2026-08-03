import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileLines, faXmark, faCreditCard, faMobileAlt,
  faCheckCircle, faChevronDown, faChevronUp, faPrint
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api from '../../api';
import './orders.css';
import './invoices.css';

const fmt = (n) => Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_FILTERS = ['all', 'pending', 'partial', 'paid', 'failed'];

const METHODS = [
  { id: 'mtn_momo',    label: 'MTN MoMo',     icon: '📱', needsPhone: true },
  { id: 'airtel_money',label: 'Airtel Money',  icon: '📲', needsPhone: true },
  { id: 'card',        label: 'Card',          icon: '💳', needsPhone: false },
];

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Pay modal
  const [payTarget, setPayTarget] = useState(null);
  const [method, setMethod] = useState('mtn_momo');
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState(null); // { success, message }

  // Receipt drawer
  const [receipt, setReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const loadInvoices = useCallback(() =>
    api.get('/invoices').then(r => setInvoices(r.data)).catch(() => {}), []);

  useEffect(() => {
    loadInvoices().finally(() => setLoading(false));
  }, [loadInvoices]);

  const openPay = (inv) => { setPayTarget(inv); setPayResult(null); setPhone(''); setMethod('mtn_momo'); };
  const closePay = () => { setPayTarget(null); setPayResult(null); };

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      const { data } = await api.post(`/invoices/${payTarget.id}/pay`, { method, phone });
      setPayResult({ success: true, message: data.message });
      await loadInvoices();
    } catch (err) {
      setPayResult({ success: false, message: err.response?.data?.message || 'Payment failed. Please try again.' });
    }
    setPaying(false);
  };

  const openReceipt = async (inv) => {
    setReceiptLoading(true);
    setReceipt({ loading: true, inv });
    try {
      const { data } = await api.get(`/invoices/${inv.id}/receipt`);
      setReceipt(data);
    } catch { setReceipt(null); }
    setReceiptLoading(false);
  };

  const filtered = invoices.filter(i => filter === 'all' || i.status === filter);

  const stats = [
    { label: 'Total',   value: invoices.length,                                          color: 'blue',   icon: '📄' },
    { label: 'Unpaid',  value: invoices.filter(i => i.status === 'pending').length,      color: 'orange', icon: '⏳' },
    { label: 'Paid',    value: invoices.filter(i => i.status === 'paid').length,         color: 'green',  icon: '✅' },
    { label: 'Total Due',
      value: `RWF ${fmt(invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0))}`,
      color: 'purple', icon: '💰' },
  ];

  return (
    <DashboardLayout pageTitle="Invoices" pageSubtitle="View and pay your invoices">

      {/* Stats */}
      <div className="stat-cards" style={{ marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card__icon stat-card__icon--${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-card__value" style={{ fontSize: typeof s.value === 'string' ? 16 : undefined }}>
                {loading ? '—' : s.value}
              </div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="orders-filters" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            className={`orders-filter-btn${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="dash-table-wrap">
        {loading ? (
          <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <span><FontAwesomeIcon icon={faFileLines} style={{ fontSize: 32 }} /></span>
            <p>{invoices.length === 0 ? 'No invoices yet.' : 'No invoices match this filter.'}</p>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Amount (RWF)</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Issued</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.reference}</strong></td>
                  <td><strong>{fmt(inv.amount)}</strong></td>
                  <td><span className={`status-badge status-badge--${inv.status}`}>{inv.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {inv.due_date ? fmtDate(inv.due_date) : '—'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtDate(inv.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {inv.status !== 'paid' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openPay(inv)}>
                          Pay Now
                        </button>
                      )}
                      {inv.status === 'paid' && (
                        <button className="btn btn-outline btn-sm" onClick={() => openReceipt(inv)}>
                          <FontAwesomeIcon icon={faFileLines} /> Receipt
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

      {/* ── Pay Modal ── */}
      {payTarget && (
        <div className="modal-overlay" onClick={closePay}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Pay Invoice — {payTarget.reference}</h3>
              <button className="modal__close" onClick={closePay}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            {payResult ? (
              <div className="modal__body">
                <div className={`auth-form__alert ${payResult.success ? 'auth-form__alert--success' : 'auth-form__alert--error'}`}>
                  {payResult.success && <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8 }} />}
                  {payResult.message}
                </div>
                {payResult.success && method !== 'card' && (
                  <p className="inv-pay-hint">Check your phone and approve the payment prompt.</p>
                )}
                <div className="modal__footer">
                  <button className="btn btn-outline" onClick={closePay}>Close</button>
                </div>
              </div>
            ) : (
              <form className="modal__body" onSubmit={handlePay}>
                {/* Amount summary */}
                <div className="inv-summary">
                  <span>Amount Due</span>
                  <strong>RWF {fmt(payTarget.amount)}</strong>
                </div>

                {/* Method selector */}
                <div className="form-group">
                  <label>Payment Method</label>
                  <div className="pay-methods">
                    {METHODS.map(m => (
                      <div
                        key={m.id}
                        className={`pay-method${method === m.id ? ' selected' : ''}`}
                        onClick={() => setMethod(m.id)}
                      >
                        <span className="pay-method__icon">{m.icon}</span>
                        <span className="pay-method__label">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phone field for mobile money */}
                {METHODS.find(m => m.id === method)?.needsPhone && (
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 0780000000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Enter the number registered with {METHODS.find(m => m.id === method)?.label}.
                    </span>
                  </div>
                )}

                {method === 'card' && (
                  <div className="auth-form__alert auth-form__alert--error" style={{ fontSize: 13 }}>
                    Card payments are not yet available. Please use MTN MoMo or Airtel Money.
                  </div>
                )}

                <div className="modal__footer">
                  <button type="button" className="btn btn-outline" onClick={closePay}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={paying || method === 'card'}>
                    {paying ? 'Processing…' : `Pay RWF ${fmt(payTarget.amount)}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Receipt Drawer ── */}
      {receipt && (
        <div className="drawer-overlay" onClick={() => setReceipt(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer__header">
              <div>
                <h3>Receipt</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{receipt.reference}</span>
              </div>
              <button className="modal__close" onClick={() => setReceipt(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            {receiptLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <span className="spinner" />
              </div>
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
                      <strong><span className={`status-badge status-badge--${receipt.status}`}>{receipt.status}</span></strong>
                    </div>
                    <div className="detail-item"><span>Amount</span><strong>RWF {fmt(receipt.amount)}</strong></div>
                    <div className="detail-item"><span>Currency</span><strong>{receipt.currency}</strong></div>
                  </div>

                  <div className="receipt-divider" />

                  {/* Payments */}
                  <strong style={{ fontSize: 13 }}>Payment Transactions</strong>
                  {receipt.payments?.filter(p => p.paid_at).length === 0 ? (
                    <p className="detail-empty" style={{ marginTop: 8 }}>No completed payments recorded.</p>
                  ) : (
                    <ul className="receipt-payments">
                      {receipt.payments?.filter(p => p.paid_at).map((p, i) => (
                        <li key={i} className="receipt-payment-item">
                          <div>
                            <strong style={{ textTransform: 'capitalize' }}>{p.method?.replace('_', ' ')}</strong>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                              Ref: {p.ref}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong>RWF {fmt(p.amount)}</strong>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                              {fmtDate(p.paid_at)}
                            </span>
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
