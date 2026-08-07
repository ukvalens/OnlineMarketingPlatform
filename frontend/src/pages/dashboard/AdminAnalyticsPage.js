import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faUsers, faEnvelope, faBoxOpen,
  faMoneyBillWave, faUserPlus, faDownload, faPrint, faRotateRight
} from '@fortawesome/free-solid-svg-icons';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import DashboardLayout from './DashboardLayout';
import api, { exportCsvData, printElement } from '../../api';
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
const fmtDay = (d) => new Date(d).toLocaleDateString('en-RW', { month: 'short', day: 'numeric' });

const STATUS_COLORS = {
  requested:   '#94a3b8',
  quoted:      '#f97316',
  confirmed:   '#3b82f6',
  in_progress: '#8b5cf6',
  in_review:   '#eab308',
  completed:   '#22c55e',
  cancelled:   '#ef4444',
};

const STAT_CONFIGS = [
  { key: 'total_views',     label: 'Page Views',     icon: faEye,           color: '#0057B8', bg: '#eff6ff' },
  { key: 'unique_visitors', label: 'Unique Visitors', icon: faUsers,         color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'total_leads',     label: 'Leads',           icon: faEnvelope,      color: '#f97316', bg: '#fff7ed' },
  { key: 'active_orders',   label: 'Active Orders',   icon: faBoxOpen,       color: '#0e7490', bg: '#ecfeff' },
  { key: 'revenue_rwf',     label: 'Revenue (RWF)',   icon: faMoneyBillWave, color: '#15803d', bg: '#f0fdf4', format: fmtRwf },
  { key: 'new_clients',     label: 'New Clients',     icon: faUserPlus,      color: '#be185d', bg: '#fdf2f8' },
];

/* ── Custom tooltip for area/bar charts ── */
function ChartTooltip({ active, payload, label, prefix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#1F2937' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{prefix}{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

/* ── Custom pie tooltip ── */
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  const total = p.total;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}>
      <div style={{ fontWeight: 700, textTransform: 'capitalize', color: '#1F2937' }}>{name.replace(/_/g, ' ')}</div>
      <div style={{ color: '#6B7280' }}>Count: <strong style={{ color: '#1F2937' }}>{value}</strong></div>
      <div style={{ color: '#6B7280' }}>Share: <strong style={{ color: '#1F2937' }}>{Math.round((value / total) * 100)}%</strong></div>
    </div>
  );
}

/* ── Custom pie label ── */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const R = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + R * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + R * Math.sin(-midAngle * Math.PI / 180);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

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

  /* Enrich pie data with total for tooltip */
  const pieData = (data?.orders_by_status || []).map(r => ({
    name:  r.status,
    value: parseInt(r.count),
    total: (data?.orders_by_status || []).reduce((s, x) => s + parseInt(x.count), 0),
  }));

  const viewsData  = (data?.views_by_day  || []).map(d => ({ day: fmtDay(d.day), views: parseInt(d.views) }));
  const leadsData  = (data?.leads_by_day  || []).map(d => ({ day: fmtDay(d.day), leads: parseInt(d.leads) }));
  const topPages   = data?.top_pages || [];

  return (
    <DashboardLayout pageTitle="Analytics" pageSubtitle="Traffic · Leads · Orders · Revenue">

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Period:</span>
        {RANGES.map(r => (
          <button key={r.value} className={`orders-filter-btn${range === r.value ? ' active' : ''}`}
            onClick={() => setRange(r.value)}>
            {r.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <FontAwesomeIcon icon={faRotateRight} spin={loading} /> Refresh
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => exportCsvData(
            (data?.top_pages || []).map(p => ({ page: p.path, views: p.views })),
            'analytics-top-pages.xls'
          )}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => printElement('analytics-print', 'Analytics Report')}>
            <FontAwesomeIcon icon={faPrint} /> PDF
          </button>
        </div>
      </div>

      <div id="analytics-print">

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {STAT_CONFIGS.map(({ key, label, icon, color, bg, format }) => {
            const val = data?.[key] ?? 0;
            return (
              <div key={key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FontAwesomeIcon icon={icon} style={{ color, fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: loading ? 18 : 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
                    {loading ? '—' : (format ? format(val) : fmt(val))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Row 1: Area charts ── */}
        <div className="dash-grid-2" style={{ marginBottom: 24 }}>

          {/* Page Views over time */}
          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header"><h3>Page Views Over Time</h3></div>
            <div style={{ padding: '16px 16px 8px' }}>
              {loading ? (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>
              ) : viewsData.length < 2 ? (
                <div className="dash-empty" style={{ height: 180 }}><p>Not enough data yet.</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={viewsData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0057B8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0057B8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="views" name="Views" stroke="#0057B8" strokeWidth={2.5} fill="url(#gViews)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Leads over time */}
          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header"><h3>Leads Over Time</h3></div>
            <div style={{ padding: '16px 16px 8px' }}>
              {loading ? (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>
              ) : leadsData.length < 2 ? (
                <div className="dash-empty" style={{ height: 180 }}><p>Not enough data yet.</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={leadsData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f97316" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#f97316" strokeWidth={2.5} fill="url(#gLeads)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 2: Pie + Bar ── */}
        <div className="dash-grid-2" style={{ marginBottom: 24 }}>

          {/* Orders by status — Pie */}
          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header"><h3>Orders by Status</h3></div>
            <div style={{ padding: '16px 8px 8px' }}>
              {loading ? (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>
              ) : pieData.length === 0 ? (
                <div className="dash-empty" style={{ height: 240 }}><p>No orders yet.</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={44}
                      dataKey="value" labelLine={false} label={renderPieLabel}>
                      {pieData.map(entry => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 11, textTransform: 'capitalize', color: 'var(--text)' }}>{value.replace(/_/g, ' ')}</span>}
                      iconType="circle" iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Orders by status — Bar */}
          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header"><h3>Orders Count by Status</h3></div>
            <div style={{ padding: '16px 8px 8px' }}>
              {loading ? (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>
              ) : pieData.length === 0 ? (
                <div className="dash-empty" style={{ height: 240 }}><p>No orders yet.</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={pieData} margin={{ top: 4, right: 8, left: -20, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false}
                      tickFormatter={v => v.replace(/_/g, ' ')} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Orders" radius={[4, 4, 0, 0]}>
                      {pieData.map(entry => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: Top pages ── */}
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header">
            <h3>Top Pages</h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>by views in period</span>
          </div>
          {loading ? (
            <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : topPages.length === 0 ? (
            <div className="dash-empty"><p>No page view data yet.</p></div>
          ) : (() => {
            const maxViews = Math.max(...topPages.map(p => parseInt(p.views)), 1);
            return (
              <div style={{ padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topPages.map(({ path, views }) => {
                  const pct = Math.round((parseInt(views) / maxViews) * 100);
                  return (
                    <div key={path}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text)', fontWeight: 500 }}>{path}</span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{fmt(views)}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#0057B8', borderRadius: 3, transition: 'width .5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

      </div>{/* end analytics-print */}

    </DashboardLayout>
  );
}
