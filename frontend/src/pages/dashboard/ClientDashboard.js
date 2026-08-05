import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faFileLines, faMessage, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import ResponsiveTable from '../../components/ui/ResponsiveTable';
import api from '../../api';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/orders'), api.get('/invoices')])
      .then(([o, i]) => { setOrders(o.data); setInvoices(i.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter(o => !['completed','cancelled'].includes(o.status));
  const unpaidInvoices = invoices.filter(i => i.status !== 'paid');

  const stats = [
    { icon: '📦', label: 'Total Orders', value: orders.length, color: 'blue' },
    { icon: '⚡', label: 'Active Orders', value: activeOrders.length, color: 'purple' },
    { icon: '📄', label: 'Unpaid Invoices', value: unpaidInvoices.length, color: 'orange' },
    { icon: '✅', label: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: 'green' },
  ];

  return (
    <DashboardLayout
      pageTitle={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
      pageSubtitle="Here's what's happening with your campaigns"
    >
      {/* Stats */}
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

      <div className="dash-grid-2">
        {/* Recent Orders */}
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header">
            <h3>Recent Orders</h3>
            <Link to="/dashboard/client/orders" className="btn btn-primary btn-sm">
              <FontAwesomeIcon icon={faPlus} /> New Order
            </Link>
          </div>
          {orders.length === 0 && !loading ? (
            <div className="dash-empty">
              <span><FontAwesomeIcon icon={faBagShopping} style={{ fontSize: 32 }} /></span>
              No orders yet. <Link to="/services" style={{ color: 'var(--primary)' }}>Browse services</Link>
            </div>
          ) : (
            <ResponsiveTable>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id}>
                      <td><strong>{order.reference}</strong></td>
                      <td>{order.service_name}</td>
                      <td><span className={`status-badge status-badge--${order.status}`}>{order.status.replace('_', ' ')}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header">
            <h3>Invoices</h3>
            <Link to="/dashboard/client/invoices" className="btn btn-outline btn-sm">
              <FontAwesomeIcon icon={faFileLines} /> View All
            </Link>
          </div>
          {invoices.length === 0 && !loading ? (
            <div className="dash-empty">
              <span><FontAwesomeIcon icon={faFileLines} style={{ fontSize: 32 }} /></span>
              No invoices yet.
            </div>
          ) : (
            <ResponsiveTable>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Amount (RWF)</th>
                    <th>Status</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map(inv => (
                    <tr key={inv.id}>
                      <td><strong>{inv.reference}</strong></td>
                      <td>{Number(inv.amount).toLocaleString()}</td>
                      <td><span className={`status-badge status-badge--${inv.status}`}>{inv.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/services" className="btn btn-primary"><FontAwesomeIcon icon={faBagShopping} /> Request a Service</Link>
        <Link to="/dashboard/client/messages" className="btn btn-outline"><FontAwesomeIcon icon={faMessage} /> Messages</Link>
        <Link to="/dashboard/client/invoices" className="btn btn-outline"><FontAwesomeIcon icon={faFileLines} /> Pay Invoice</Link>
      </div>
    </DashboardLayout>
  );
}
