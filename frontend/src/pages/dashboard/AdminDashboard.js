import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faBook, faImage, faArrowRight, faPrint } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import ResponsiveTable from '../../components/ui/ResponsiveTable';
import api, { exportCsv, printElement } from '../../api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders]       = useState([]);
  const [posts, setPosts]         = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [clients, setClients]     = useState([]);
  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const isEditor  = user?.role === 'editor';
    const isAdmin   = ['admin', 'finance'].includes(user?.role);

    const requests = [];
    if (!isEditor) requests.push(api.get('/orders'));
    if (isAdmin)   requests.push(api.get('/admin/analytics'));
    if (isEditor || user?.role === 'admin') {
      requests.push(api.get('/blog/admin/all'));
      requests.push(api.get('/portfolio'));
    }
    if (isAdmin) {
      requests.push(api.get('/admin/clients'));
      requests.push(api.get('/payments'));
    }

    Promise.all(requests)
      .then((results) => {
        let idx = 0;
        if (!isEditor)  { setOrders(results[idx++]?.data || []); }
        if (isAdmin)    { setAnalytics(results[idx++]?.data); }
        if (isEditor || user?.role === 'admin') {
          setPosts(results[idx++]?.data || []);
          setPortfolio(results[idx++]?.data || []);
        }
        if (isAdmin) {
          setClients(results[idx++]?.data || []);
          setPayments(results[idx++]?.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const isEditor = user?.role === 'editor';

  // Editor-specific stats
  const editorStats = [
    { icon: '📝', label: 'Total Posts',  value: posts.length,                                       color: 'blue'   },
    { icon: '🌐', label: 'Published',    value: posts.filter(p => p.status === 'published').length,  color: 'green'  },
    { icon: '📄', label: 'Drafts',       value: posts.filter(p => p.status === 'draft').length,      color: 'orange' },
    { icon: '🖼️', label: 'Portfolio',    value: portfolio.length,                                    color: 'purple' },
    { icon: '🌟', label: 'Published Portfolio', value: portfolio.filter(p => p.is_published).length, color: 'green'  },
  ];

  const adminStats = analytics
    ? [
        { icon: '👥', label: 'Total Clients', value: analytics.total_clients,                              color: 'blue'   },
        { icon: '📦', label: 'Total Orders',  value: orders.length,                                        color: 'purple' },
        { icon: '💰', label: 'Revenue (RWF)', value: `${Number(analytics.total_revenue_rwf).toLocaleString()}`, color: 'green' },
        { icon: '📬', label: 'New Inquiries', value: analytics.unread_contacts,                            color: 'orange' },
      ]
    : [
        { icon: '📦', label: 'Total Orders',  value: orders.length,                                        color: 'blue'   },
        { icon: '⚡', label: 'In Progress',   value: orders.filter(o => o.status === 'in_progress').length, color: 'purple' },
        { icon: '🔍', label: 'In Review',     value: orders.filter(o => o.status === 'in_review').length,  color: 'orange' },
        { icon: '✅', label: 'Completed',     value: orders.filter(o => o.status === 'completed').length,  color: 'green'  },
      ];

  const stats = isEditor ? editorStats : adminStats;

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

      {/* Editor quick actions */}
      {isEditor && (
        <div className="dash-grid-2" style={{ marginTop: 24 }}>
          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header">
              <h3><FontAwesomeIcon icon={faBook} style={{ marginRight: 8 }} />Recent Blog Posts</h3>
              <Link to="/dashboard/admin/blog" className="btn btn-primary btn-sm">
                Manage <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
            ) : posts.length === 0 ? (
              <div className="dash-empty" style={{ padding: 24 }}><p>No posts yet.</p></div>
            ) : (
              <ResponsiveTable>
                <table className="dash-table">
                  <thead><tr><th>Title</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {posts.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>{p.title}</strong>
                        </td>
                        <td>
                          <span className={`portfolio-card__badge ${p.status === 'published' ? 'published' : 'draft'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ResponsiveTable>
            )}
          </div>

          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header">
              <h3><FontAwesomeIcon icon={faImage} style={{ marginRight: 8 }} />Portfolio Items</h3>
              <Link to="/dashboard/admin/portfolio" className="btn btn-primary btn-sm">
                Manage <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
            ) : portfolio.length === 0 ? (
              <div className="dash-empty" style={{ padding: 24 }}><p>No portfolio items yet.</p></div>
            ) : (
              <ResponsiveTable>
                <table className="dash-table">
                  <thead><tr><th>Title</th><th>Category</th><th>Status</th></tr></thead>
                  <tbody>
                    {portfolio.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.title}</strong></td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.category || '—'}</td>
                        <td>
                          <span className={`portfolio-card__badge ${p.is_published ? 'published' : 'draft'}`}>
                            {p.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ResponsiveTable>
            )}
          </div>
        </div>
      )}

      {/* Orders table — non-editor roles */}
      {!isEditor && (
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header">
            <h3>Recent Orders</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {user?.role === 'admin' && (
                <button className="btn btn-outline btn-sm" onClick={() => exportCsv('orders', 'orders.csv')}>
                  <FontAwesomeIcon icon={faDownload} /> Export CSV
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => printElement('dashboard-orders-print', 'Recent Orders')}>
                <FontAwesomeIcon icon={faPrint} /> PDF
              </button>
              <Link to="/dashboard/admin/orders" className="btn btn-primary btn-sm">View All</Link>
            </div>
          </div>
          <ResponsiveTable minWidth={600}>
            <table className="dash-table" id="dashboard-orders-print">
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
          </ResponsiveTable>
        </div>
      )}

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
                { label: 'Clients',  csvPath: 'clients',  csvFile: 'clients.csv',  pdfId: 'qe-clients-print'  },
                { label: 'Orders',   csvPath: 'orders',   csvFile: 'orders.csv',   pdfId: 'dashboard-orders-print' },
                { label: 'Payments', csvPath: 'payments', csvFile: 'payments.csv', pdfId: 'qe-payments-print' },
              ].map(({ label, csvPath, csvFile, pdfId }) => (
                <div key={csvPath} style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => exportCsv(csvPath, csvFile)}>
                    <FontAwesomeIcon icon={faDownload} /> Export {label} CSV
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => printElement(pdfId, `${label} Report`)}>
                    <FontAwesomeIcon icon={faPrint} /> PDF
                  </button>
                </div>
              ))}
            </div>

            {/* Hidden printable tables for Clients & Payments */}
            <div style={{ display: 'none' }}>
              <div id="qe-clients-print">
                <table className="dash-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Orders</th><th>Total Paid (RWF)</th><th>Status</th></tr></thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id}>
                        <td>{c.name}</td><td>{c.email}</td><td>{c.company_name || '—'}</td>
                        <td>{c.order_count}</td><td>{Number(c.total_paid).toLocaleString()}</td>
                        <td>{c.is_active ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div id="qe-payments-print">
                <table className="dash-table">
                  <thead><tr><th>Transaction Ref</th><th>Order Ref</th><th>Client</th><th>Method</th><th>Amount (RWF)</th><th>Status</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td>{p.transaction_ref || '—'}</td><td>{p.reference || '—'}</td>
                        <td>{p.client_name || '—'}</td><td>{p.method?.replace('_', ' ')}</td>
                        <td>{Number(p.amount).toLocaleString()}</td><td>{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
