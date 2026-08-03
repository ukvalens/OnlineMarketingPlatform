import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import api from '../../api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAdmin = ['admin', 'finance'].includes(user?.role);
    const requests = [api.get('/orders')];
    if (isAdmin) requests.push(api.get('/admin/analytics'));

    Promise.all(requests)
      .then(([o, a]) => {
        setOrders(o.data);
        if (a) setAnalytics(a.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const stats = analytics
    ? [
        { icon: '👥', label: 'Total Clients', value: analytics.total_clients, color: 'blue' },
        { icon: '📦', label: 'Total Orders', value: orders.length, color: 'purple' },
        { icon: '💰', label: 'Revenue (RWF)', value: `${Number(analytics.total_revenue_rwf).toLocaleString()}`, color: 'green' },
        { icon: '📬', label: 'New Inquiries', value: analytics.unread_contacts, color: 'orange' },
      ]
    : [
        { icon: '📦', label: 'Total Orders', value: orders.length, color: 'blue' },
        { icon: '⚡', label: 'In Progress', value: orders.filter(o => o.status === 'in_progress').length, color: 'purple' },
        { icon: '🔍', label: 'In Review', value: orders.filter(o => o.status === 'in_review').length, color: 'orange' },
        { icon: '✅', label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: 'green' },
      ];

  const roleLabel = { admin: 'Admin', staff: 'Staff', editor: 'Editor', finance: 'Finance' };

  return (
    <DashboardLayout
      pageTitle={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
      pageSubtitle={`You're logged in as ${user?.name} · ${roleLabel[user?.role] || user?.role}`}
    >
      <div className="stat-cards">
        {stats.map(({ icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-card__icon stat-card__icon--${color}`}>{icon}</div>
            <div>
              <div className="stat-card__value">{loading ? '—' : value}</div>
              <div className="stat-card__label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="dash-table-wrap">
        <div className="dash-table-wrap__header">
          <h3>Recent Orders</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {user?.role === 'admin' && (
              <a href="http://localhost:5000/api/admin/export/orders" className="btn btn-outline btn-sm" target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={faDownload} /> Export CSV
              </a>
            )}
            <Link to="/dashboard/admin/orders" className="btn btn-primary btn-sm">View All</Link>
          </div>
        </div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Client</th>
              <th>Service</th>
              <th>Status</th>
              <th>Amount (RWF)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : orders.slice(0, 8).map(order => (
              <tr key={order.id}>
                <td><strong>{order.reference}</strong></td>
                <td>{order.client_name}</td>
                <td>{order.service_name}</td>
                <td><span className={`status-badge status-badge--${order.status}`}>{order.status.replace('_', ' ')}</span></td>
                <td>{order.quote_amount ? Number(order.quote_amount).toLocaleString() : '—'}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={6} className="dash-empty">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Analytics breakdown if admin */}
      {analytics && (
        <div className="dash-grid-2" style={{ marginTop: 24 }}>
          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header"><h3>Orders by Status</h3></div>
            <table className="dash-table">
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>
                {analytics.orders_by_status.map(({ status, count }) => (
                  <tr key={status}>
                    <td><span className={`status-badge status-badge--${status}`}>{status.replace('_', ' ')}</span></td>
                    <td><strong>{count}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header">
              <h3>Quick Exports</h3>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Export Clients CSV', path: 'clients' },
                { label: 'Export Orders CSV', path: 'orders' },
                { label: 'Export Payments CSV', path: 'payments' },
              ].map(({ label, path }) => (
                <a key={path} href={`http://localhost:5000/api/admin/export/${path}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <FontAwesomeIcon icon={faDownload} /> {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
