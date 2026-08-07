import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faUsers, faEnvelope, faBoxOpen,
  faMoneyBillWave, faUserPlus, faArrowTrendUp, faDownload, faPrint
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api, { printElement } from '../../api';
import './dashboard.css';
import './admin-content.css';
import './orders.css';

const RANGES = [
  { label: '7 days',  value: '7'  },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
];

const fmt    = (n) => Number(n).toLocaleString();
const fmtRwf = (n) => `RWF ${Number(n).toLocaleString()}`;

/* ── Inline SVG sparkline ── */
function Sparkline({ data = [], color = '#0057B8', height = 48 }) {
  if (data.length < 2) return <div style={{ height }} />;
  const vals = data.map(d => Number(d.views ?? d.leads ?? 0));
  const max = Math.max(...vals, 1);
  const w = 200;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = height - (v / max) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── Bar chart for orders by status ── */
function StatusBars({ data = [] }) {
  const total = data.reduce((s, r) => s + parseInt(r.count), 0) || 1;
  const COLORS = {
    requested: '#94a3b8', quoted: '#f97316', confirmed: '#3b82f6',
    in_progress: '#8b5cf6', in_review: '#eab308', completed: '#22c55e', cancelled: '#ef4444',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
      {data.map(({ status, count }) => {
        const pct = Math.round((parseInt(count) / total) * 100);
        return (
          <div key={status}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ textTransform: 'capitalize', color: 'var(--text)', fontWeight: 600 }}>
                {status.replace('_', ' ')}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: COLORS[status] || '#94a3b8', borderRadius: 4, transition: 'width .5s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Day-by-day area chart ── */
function AreaChart({ data = [], valueKey = 'views', color = '#0057B8', label = 'Views' }) {
  if (data.length < 2) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      Not enough data yet
    </div>
  );
  const vals = data.map(d => Number(d[valueKey] ?? 0));
  const max = Math.max(...vals, 1);
  const W = 600; const H = 100;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - (v / max) * (H - 10) - 5;
    return [x, y];
  });
  const linePts = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const areaPts = `0,${H} ` + pts.map(([x, y]) => `${x},${y}`).join(' ') + ` ${W},${H}`;

  // x-axis labels: show first, middle, last
  const labelIdxs = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 120, display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPts} fill={`url(#grad-${valueKey})`} />
        <polyline points={linePts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          vals[i] === max ? <circle key={i} cx={x} cy={y} r="4" fill={color} /> : null
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        {labelIdxs.map(i => (
          <span key={i}>{new Date(data[i]?.day).toLocaleDateString('en-RW', { month: 'short', day: 'numeric' })}</span>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange]     = useState('30');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: d } = await api.get(`/analytics/summary?range=${range}`).catch(() => ({ data: null }));
    setData(d);
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const stats = data ? [
    { icon: faEye,           label: 'Page Views',      value: fmt(data.total_views),      color: 'blue',   spark: data.views_by_day,  sparkKey: 'views',  sparkColor: '#0057B8' },
    { icon: faUsers,         label: 'Unique Visitors',  value: fmt(data.unique_visitors),  color: 'purple', spark: null },
    { icon: faEnvelope,      label: 'Leads',            value: fmt(data.total_leads),      color: 'orange', spark: data.leads_by_day,  sparkKey: 'leads',  sparkColor: '#f97316' },
    { icon: faBoxOpen,       label: 'Active Orders',    value: fmt(data.active_orders),    color: 'green',  spark: null },
    { icon: faMoneyBillWave, label: 'Revenue (RWF)',    value: fmtRwf(data.revenue_rwf),   color: 'green',  spark: null },
    { icon: faUserPlus,      label: 'New Clients',      value: fmt(data.new_clients),      color: 'blue',   spark: null },
  ] : [];

  return (
    <DashboardLayout pageTitle="Analytics" pageSubtitle="Traffic, leads, orders & revenue">

      {/* Range selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        <FontAwesomeIcon icon={faArrowTrendUp} style={{ color: 'var(--primary)', marginRight: 4 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginRight: 8 }}>Period:</span>
        {RANGES.map(r => (
          <button
            key={r.value}
            className={`orders-filter-btn${range === r.value ? ' active' : ''}`}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a href="http://localhost:5000/api/admin/export/orders" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            <FontAwesomeIcon icon={faDownload} /> Export Orders
          </a>
          <button className="btn btn-outline btn-sm" onClick={() => printElement('analytics-content-print', 'Analytics Report')}>
            <FontAwesomeIcon icon={faPrint} /> PDF
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div id="analytics-content-print">
      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="stat-card" style={{ opacity: 0.4 }}>
                <div className="stat-card__icon stat-card__icon--blue" />
                <div><div className="stat-card__value">—</div><div className="stat-card__label">Loading…</div></div>
              </div>
            ))
          : stats.map(({ icon, label, value, color, spark, sparkKey, sparkColor }) => (
              <div key={label} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
                  <div className={`stat-card__icon stat-card__icon--${color}`}>
                    <FontAwesomeIcon icon={icon} />
                  </div>
                  <div>
                    <div className="stat-card__value" style={{ fontSize: 22 }}>{value}</div>
                    <div className="stat-card__label">{label}</div>
                  </div>
                </div>
                {spark && spark.length > 1 && (
                  <div style={{ width: '100%', paddingTop: 4 }}>
                    <Sparkline data={spark} color={sparkColor} height={36} />
                  </div>
                )}
              </div>
            ))
        }
      </div>

      {/* Charts row */}
      <div className="dash-grid-2" style={{ marginTop: 0 }}>
        {/* Views over time */}
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header"><h3>Page Views Over Time</h3></div>
          <div style={{ padding: '20px 24px 16px' }}>
            {loading
              ? <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>
              : <AreaChart data={data?.views_by_day || []} valueKey="views" color="#0057B8" label="Views" />
            }
          </div>
        </div>

        {/* Leads over time */}
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header"><h3>Leads Over Time</h3></div>
          <div style={{ padding: '20px 24px 16px' }}>
            {loading
              ? <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>
              : <AreaChart data={data?.leads_by_day || []} valueKey="leads" color="#f97316" label="Leads" />
            }
          </div>
        </div>
      </div>

      <div className="dash-grid-2" style={{ marginTop: 24 }}>
        {/* Top pages */}
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header"><h3>Top Pages</h3></div>
          {loading
            ? <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
            : !data?.top_pages?.length
              ? <div className="dash-empty"><p>No page view data yet.</p></div>
              : (
                <table className="dash-table">
                  <thead><tr><th>Page</th><th style={{ textAlign: 'right' }}>Views</th></tr></thead>
                  <tbody>
                    {data.top_pages.map(({ path, views }) => (
                      <tr key={path}>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{path}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(views)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }
        </div>

        {/* Orders by status */}
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header"><h3>Orders by Status</h3></div>
          <div style={{ padding: '20px 24px' }}>
            {loading
              ? <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>
              : <StatusBars data={data?.orders_by_status || []} />
            }
          </div>
        </div>
      </div>
      </div>

    </DashboardLayout>
  );
}
