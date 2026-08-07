import { QRCodeSVG } from 'qrcode.react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faDownload } from '@fortawesome/free-solid-svg-icons';
import { printElement, exportCsvData } from '../api';
import { useSiteSettings } from '../context/SiteSettingsContext';

const fmt     = (n) => Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit', hour12: false });

const STATUS_COLORS = { pending: 'requested', partial: 'in_progress', paid: 'completed', failed: 'cancelled' };

export default function ReceiptCard({ receipt }) {
  const { settings } = useSiteSettings();
  const paidPayments = receipt.payments?.filter(p => p.paid_at) ?? [];
  const qrValue = `${window.location.origin}/verify/receipt/${receipt.id}`;

  const handleExportCsv = () => {
    const rows = [
      {
        order_reference: receipt.reference,
        client: receipt.client_name,
        email: receipt.email,
        amount_rwf: Number(receipt.amount).toLocaleString(),
        status: receipt.status,
        issued: `${fmtDate(receipt.created_at)} ${fmtTime(receipt.created_at)}`,
        due_date: receipt.due_date ? fmtDate(receipt.due_date) : '',
      },
      ...paidPayments.map(p => ({
        order_reference: receipt.reference,
        client: receipt.client_name,
        email: receipt.email,
        amount_rwf: Number(p.amount).toLocaleString(),
        status: 'paid',
        issued: `${fmtDate(p.paid_at)} ${fmtTime(p.paid_at)}`,
        method: p.method?.replace(/_/g, ' ') || '',
        transaction_ref: p.ref || '',
      })),
    ];
    exportCsvData(rows, `receipt-${receipt.reference}.xls`);
  };

  return (
    <div className="receipt-card" id="receipt-printable">

      {/* Header: logo + company */}
      <div className="receipt-header">
        <img src="/logo192.png" alt={settings.site_title} className="receipt-logo-img" />
        <div className="receipt-company">
          <div className="receipt-title">{settings.site_title}</div>
          <div className="receipt-sub">{settings.tagline} · Rwanda</div>
        </div>
        <div className="receipt-badge">RECEIPT</div>
      </div>

      <div className="receipt-divider" />

      {/* Client + order info */}
      <div className="receipt-info-grid">
        <div className="receipt-info-block">
          <span className="receipt-label">Billed To</span>
          <strong>{receipt.client_name}</strong>
          <span className="receipt-muted">{receipt.email}</span>
        </div>
        <div className="receipt-info-block" style={{ textAlign: 'right' }}>
          <span className="receipt-label">Order Reference</span>
          <strong>{receipt.reference}</strong>
        </div>
      </div>

      {/* Dates */}
      <div className="receipt-info-grid" style={{ marginTop: 0 }}>
        <div className="receipt-info-block">
          <span className="receipt-label">Issued</span>
          <strong>{fmtDate(receipt.created_at)} {fmtTime(receipt.created_at)}</strong>
        </div>
        {receipt.due_date && (
          <div className="receipt-info-block" style={{ textAlign: 'right' }}>
            <span className="receipt-label">Due Date</span>
            <strong>{fmtDate(receipt.due_date)}</strong>
          </div>
        )}
        <div className="receipt-info-block" style={{ textAlign: receipt.due_date ? undefined : 'right' }}>
          <span className="receipt-label">Status</span>
          <span className={`status-badge status-badge--${STATUS_COLORS[receipt.status] || 'requested'}`}>
            {receipt.status}
          </span>
        </div>
      </div>

      <div className="receipt-divider" />

      {/* Transactions */}
      <div className="receipt-section-title">Payment Transactions</div>
      {paidPayments.length === 0 ? (
        <p className="detail-empty" style={{ margin: '8px 0' }}>No completed payments recorded.</p>
      ) : (
        <ul className="receipt-payments">
          {paidPayments.map((p, i) => (
            <li key={i} className="receipt-payment-item">
              <div>
                <strong style={{ textTransform: 'capitalize' }}>{p.method?.replace(/_/g, ' ')}</strong>
                <span className="receipt-muted" style={{ display: 'block' }}>Ref: {p.ref}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>RWF {fmt(p.amount)}</strong>
                <span className="receipt-muted" style={{ display: 'block' }}>
                  {fmtDate(p.paid_at)} · {fmtTime(p.paid_at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="receipt-divider" />

      {/* Total + QR */}
      <div className="receipt-footer">
        <div className="receipt-total-block">
          <span className="receipt-label">Total Amount</span>
          <div className="receipt-total-amount">RWF {fmt(receipt.amount)}</div>
          <span className="receipt-muted" style={{ fontSize: 11 }}>Rwandan Franc (RWF)</span>
        </div>
        <div className="receipt-qr">
          <QRCodeSVG value={qrValue} size={88} level="M" />
          <span className="receipt-muted" style={{ fontSize: 10, marginTop: 4, textAlign: 'center' }}>Scan to verify</span>
        </div>
      </div>

      <div className="receipt-divider" />

      {/* Footer note */}
      <div className="receipt-note">
        This receipt was issued by {settings.site_title} · {settings.address} · Scan QR to verify authenticity
      </div>

      {/* Action buttons — hidden on print */}
      <div className="receipt-actions">
        <button className="btn btn-outline" onClick={handleExportCsv}>
          <FontAwesomeIcon icon={faDownload} /> Export Excel
        </button>
        <button className="btn btn-primary" onClick={() => printElement('receipt-printable', `Receipt ${receipt.reference}`)}>
          <FontAwesomeIcon icon={faPrint} /> Print / Save PDF
        </button>
      </div>
    </div>
  );
}
