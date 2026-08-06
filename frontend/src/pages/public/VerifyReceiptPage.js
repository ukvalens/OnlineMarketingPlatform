import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPrint } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import ReceiptCard from '../../components/ReceiptCard';
import api, { exportCsvData, printElement } from '../../api';
import './verify-receipt.css';

export default function VerifyReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get(`/invoices/${id}/receipt`)
      .then(r => setReceipt(r.data))
      .catch(() => setError('Receipt not found or access is restricted.'));
  }, [id]);

  return (
    <Layout>
      <div className="verify-page">

        {/* Company banner */}
        <div className="verify-company-banner">
          <img src="/logo192.png" alt="DigitalMarkRW" className="verify-company-logo" />
          <div className="verify-company-info">
            <h1 className="verify-company-name">DigitalMarkRW</h1>
            <p className="verify-company-tagline">Digital Marketing &amp; Business Promotion Platform · Rwanda</p>
          </div>
          <div className="verify-verified-badge">
            <span className="verify-check">✓</span> Verified Document
          </div>
        </div>

        {/* Business details */}
        <div className="verify-biz-details">
          <div className="verify-biz-item">
            <span className="verify-biz-label">Website</span>
            <a href="https://www.digitalmarkrw.com" target="_blank" rel="noreferrer">www.digitalmarkrw.com</a>
          </div>
          <div className="verify-biz-item">
            <span className="verify-biz-label">Email</span>
            <a href="mailto:info@digitalmarkrw.com">info@digitalmarkrw.com</a>
          </div>
          <div className="verify-biz-item">
            <span className="verify-biz-label">Phone</span>
            <a href="tel:+250780000000">+250 780 000 000</a>
          </div>
          <div className="verify-biz-item">
            <span className="verify-biz-label">Address</span>
            <span>KG 123 St, Kigali, Rwanda</span>
          </div>
          <div className="verify-biz-item">
            <span className="verify-biz-label">TIN</span>
            <span>123456789</span>
          </div>
          <div className="verify-biz-item">
            <span className="verify-biz-label">Registration</span>
            <span>RDB/2024/001234</span>
          </div>
        </div>

        <div className="verify-divider">
          <span>Payment Receipt</span>
        </div>

        {/* Public actions */}
        {receipt && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() =>
              exportCsvData([{
                order_reference: receipt.reference,
                client: receipt.client_name,
                email: receipt.email,
                amount_rwf: Number(receipt.amount).toLocaleString(),
                status: receipt.status,
                issued: new Date(receipt.created_at).toLocaleString(),
              }], `receipt-${receipt.reference}.xls`)
            }>
              <FontAwesomeIcon icon={faDownload} /> Export Excel
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => printElement('receipt-printable', `Receipt ${receipt.reference}`)}>
              <FontAwesomeIcon icon={faPrint} /> Print / Save PDF
            </button>
          </div>
        )}

        {/* Receipt or states */}
        {!receipt && !error && (
          <div className="verify-center">
            <span className="spinner" />
          </div>
        )}
        {error && (
          <div className="verify-center verify-error">
            <div style={{ fontSize: 40 }}>🔍</div>
            <p>{error}</p>
          </div>
        )}
        {receipt && <ReceiptCard receipt={receipt} />}

      </div>
    </Layout>
  );
}
