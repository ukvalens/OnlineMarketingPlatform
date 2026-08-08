import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faMobileAlt, faCreditCard,
  faCircleCheck, faReceipt, faClock, faCoins
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import './orders.css';

const fmt = (n) => Number(n).toLocaleString();
const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const METHOD_LABEL = { mtn_momo: 'MTN MoMo', airtel_money: 'Airtel Money', card: 'Card' };
const METHOD_ICON  = { mtn_momo: faMobileAlt, airtel_money: faMobileAlt, card: faCreditCard };

const STATUS_FILTERS = ['all', 'paid', 'pending', 'failed'];

export default function TransactionsPage() {
  const { user } = useAuth();
  const isClient = user?.role === 'client';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const endpoint = isClient ? '/payments/my' : '/payments';
    api.get(endpoint)
      .then(r => setTransactions(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isClient]);

  const filtered = transactions.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch = !search ||
      t.reference?.toLowerCase().includes(search.toLowerCase()) ||
      t.transaction_ref?.toLowerCase().includes(search.toLowerCase()) ||
      t.service_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.client_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const { paged, page, totalPages, setPage, reset } = usePagination(filtered, 15);
  useEffect(() => { reset(); }, [filter, search]); // eslint-disable-line

  const totalPaid = transactions.filter(t => t.status === 'paid').reduce((s, t) => s + Number(t.amount), 0);

  const stats = [
    { label: 'Total',      value: transactions.length,                                     color: 'blue',   icon: faReceipt },
    { label: 'Paid',       value: transactions.filter(t => t.status === 'paid').length,    color: 'green',  icon: faCircleCheck },
    { label: 'Pending',    value: transactions.filter(t => t.status === 'pending').length, color: 'orange', icon: faClock },
    { label: 'Total Paid', value: `RWF ${fmt(totalPaid)}`,                                 color: 'purple', icon: faCoins },
  ];

  return (
    <DashboardLayout pageTitle="Transactions" pageSubtitle="History of all payments made">

      <div className="stat-cards" style={{ marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card__icon stat-card__icon--${s.color}`}>
              <FontAwesomeIcon icon={s.icon} />
            </div>
            <div>
              <div className="stat-card__value" style={{ fontSize: typeof s.value === 'string' ? 15 : undefined }}>
                {loading ? '—' : s.value}
              </div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="orders-toolbar">
        <div className="orders-filters">
          {STATUS_FILTERS.map(s => (
            <button key={s} className={`orders-filter-btn${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <input
          className="orders-search"
          placeholder={isClient ? 'Search by order ref or service…' : 'Search by ref, client or service…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="dash-table-wrap">
        {loading ? (
          <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: 32, marginBottom: 12 }} />
            <p>{transactions.length === 0 ? 'No transactions yet.' : 'No transactions match your filter.'}</p>
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Service</th>
                {!isClient && <th>Client</th>}
                <th>Method</th>
                <th>Amount (RWF)</th>
                <th>Status</th>
                <th>Transaction Ref</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.reference || '—'}</strong></td>
                  <td>{t.service_name || '—'}</td>
                  {!isClient && <td>{t.client_name || '—'}</td>}
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FontAwesomeIcon icon={METHOD_ICON[t.method] || faCreditCard} />
                      {METHOD_LABEL[t.method] || t.method}
                    </span>
                  </td>
                  <td><strong>{fmt(t.amount)}</strong></td>
                  <td>
                    <span className={`status-badge status-badge--${t.status === 'paid' ? 'completed' : t.status === 'pending' ? 'requested' : 'cancelled'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.transaction_ref || '—'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {t.created_at ? fmtDate(t.created_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} total={filtered.length} pageSize={15} />

    </DashboardLayout>
  );
}
