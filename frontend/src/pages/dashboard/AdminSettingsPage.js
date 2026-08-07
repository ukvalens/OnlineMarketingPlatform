import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear, faListCheck, faEnvelope, faClockRotateLeft,
  faCheck, faEnvelopeOpen, faDownload, faPrint
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api, { exportCsvData, printElement } from '../../api';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import './dashboard.css';
import './admin-content.css';
import './admin-users.css';
import './orders.css';

const fmtDate = (d) => new Date(d).toLocaleString('en-RW', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const ACTION_COLORS = {
  LOGIN: '#0e7490', REGISTER: '#15803d',
  PASSWORD_RESET: '#b45309', PASSWORD_CHANGED: '#b45309',
  CREATE_USER: '#15803d', UPDATE_USER: '#1d4ed8', DELETE_USER: '#b91c1c',
  PROFILE_UPDATED: '#1d4ed8', AVATAR_UPDATED: '#1d4ed8',
  ORDER_PLACED: '#7c3aed', ORDER_CONFIRMED: '#15803d', ORDER_CANCELLED: '#b91c1c',
  ORDER_STATUS_UPDATED: '#7c3aed', QUOTE_SUBMITTED: '#0e7490',
  STAFF_ASSIGNED: '#1d4ed8', MILESTONE_ADDED: '#0e7490', MILESTONE_COMPLETED: '#15803d',
  DELIVERABLE_UPLOADED: '#7c3aed', INVOICE_CREATED: '#0e7490',
  INVOICE_STATUS_UPDATED: '#1d4ed8', DELETE_INVOICE: '#b91c1c',
  RECORD_PAYMENT: '#15803d', CONFIRM_PAYMENT: '#15803d', DELETE_PAYMENT: '#b91c1c',
  DELETE_ORDER: '#b91c1c', MARK_CONTACT_READ: '#6b7280',
};

const parseMeta = (meta) => {
  if (!meta) return {};
  if (typeof meta === 'object') return meta;
  try { return JSON.parse(meta); } catch { return {}; }
};

function formatAuditEntity(action, entity, entityId, meta, actor) {
  const m = parseMeta(meta);
  switch (action) {
    case 'LOGIN':
    case 'REGISTER':
    case 'PASSWORD_RESET':
    case 'PASSWORD_CHANGED':
    case 'AVATAR_UPDATED':
    case 'PROFILE_UPDATED':      return actor || 'Unknown user';
    case 'CREATE_USER':
    case 'UPDATE_USER':
    case 'DELETE_USER':          return m.name || m.email || actor || 'User';
    case 'ORDER_PLACED':
    case 'ORDER_CONFIRMED':
    case 'ORDER_CANCELLED':
    case 'ORDER_STATUS_UPDATED':
    case 'QUOTE_SUBMITTED':
    case 'STAFF_ASSIGNED':
    case 'DELETE_ORDER':         return m.reference ? `Order ${m.reference}` : 'Order';
    case 'MILESTONE_ADDED':
    case 'MILESTONE_COMPLETED':  return m.title ? `"${m.title}"` : 'Milestone';
    case 'DELIVERABLE_UPLOADED': return m.file_name || 'Deliverable';
    case 'INVOICE_CREATED':
    case 'INVOICE_STATUS_UPDATED':
    case 'DELETE_INVOICE':       return m.reference ? `Invoice ${m.reference}` : 'Invoice';
    case 'RECORD_PAYMENT':
    case 'CONFIRM_PAYMENT':
    case 'DELETE_PAYMENT':       return m.reference ? `Payment · ${m.reference}` : 'Payment';
    case 'MARK_CONTACT_READ':    return m.name || 'Contact';
    default:                     return entity ? entity.replace(/_/g, ' ') : '—';
  }
}

function formatAuditDetail(action, meta) {
  const m = parseMeta(meta);
  switch (action) {
    case 'LOGIN':                return `Role: ${m.role || '—'}`;
    case 'REGISTER':             return `${m.name || ''} · ${m.email || ''}`;
    case 'PASSWORD_RESET':       return 'Password reset via email link';
    case 'PASSWORD_CHANGED':     return 'Password changed successfully';
    case 'AVATAR_UPDATED':       return 'Profile photo updated';
    case 'PROFILE_UPDATED': {
      const parts = [];
      if (m.name)         parts.push(`Name → ${m.name}`);
      if (m.email)        parts.push(`Email → ${m.email}`);
      if (m.phone)        parts.push(`Phone → ${m.phone}`);
      if (m.company_name) parts.push(`Company → ${m.company_name}`);
      return parts.length ? parts.join(' · ') : 'Profile updated';
    }
    case 'CREATE_USER':          return m.role ? `Role: ${m.role}` : 'New user created';
    case 'UPDATE_USER': {
      const parts = [];
      if (m.role != null)      parts.push(`Role → ${m.role}`);
      if (m.is_active != null) parts.push(m.is_active ? 'Activated' : 'Deactivated');
      if (m.name)              parts.push(`Name → ${m.name}`);
      if (m.email)             parts.push(`Email → ${m.email}`);
      return parts.length ? parts.join(' · ') : 'User updated';
    }
    case 'DELETE_USER':          return `${m.name || ''} (${m.email || ''})`;
    case 'ORDER_PLACED':         return `Ref: ${m.reference || '—'}`;
    case 'ORDER_CONFIRMED':      return `Ref: ${m.reference || '—'}`;
    case 'ORDER_CANCELLED':      return `Ref: ${m.reference || '—'}`;
    case 'ORDER_STATUS_UPDATED': return `${(m.from || '').replace(/_/g, ' ')} → ${(m.to || '').replace(/_/g, ' ')}${m.progress_percent != null ? ` (${m.progress_percent}%)` : ''}`;
    case 'QUOTE_SUBMITTED':      return `RWF ${Number(m.quote_amount || 0).toLocaleString()}${m.proposed_timeline ? ` · ${m.proposed_timeline}` : ''}`;
    case 'STAFF_ASSIGNED':       return m.assigned_staff_id ? 'Assigned to staff' : 'Unassigned';
    case 'MILESTONE_ADDED':      return `"${m.title || '—'}"`;
    case 'MILESTONE_COMPLETED':  return 'Milestone marked complete';
    case 'DELIVERABLE_UPLOADED': return `File: ${m.file_name || '—'}`;
    case 'INVOICE_CREATED':      return `RWF ${Number(m.amount || 0).toLocaleString()}`;
    case 'INVOICE_STATUS_UPDATED': return `Status → ${m.status || '—'}`;
    case 'DELETE_INVOICE':       return 'Invoice permanently deleted';
    case 'RECORD_PAYMENT':       return `RWF ${Number(m.amount || 0).toLocaleString()} via ${(m.method || '').replace(/_/g, ' ')}`;
    case 'CONFIRM_PAYMENT':      return 'Payment confirmed';
    case 'DELETE_PAYMENT':       return 'Payment record deleted';
    case 'DELETE_ORDER':         return `Ref: ${m.reference || '—'}`;
    case 'MARK_CONTACT_READ':    return 'Contact marked as read';
    default: {
      const keys = Object.keys(m);
      return keys.length ? keys.map(k => `${k}: ${m[k]}`).join(' · ') : '—';
    }
  }
}

const TABS = [
  { id: 'general',  label: 'General',   icon: faGear           },
  { id: 'services', label: 'Services',  icon: faListCheck      },
  { id: 'contacts', label: 'Contacts',  icon: faEnvelope       },
  { id: 'audit',    label: 'Audit Log', icon: faClockRotateLeft },
];

function Toast({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { settings, saveSettings } = useSiteSettings();
  const [tab, setTab]         = useState('general');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts]   = useState([]);

  const [profile, setProfile] = useState(() => ({ ...settings }));
  const [saving, setSaving]   = useState(false);

  const [services, setServices] = useState([]);

  const [contacts, setContacts]         = useState([]);
  const [contactSearch, setContactSearch] = useState('');

  const [auditLogs, setAuditLogs]       = useState([]);
  const [auditSearch, setAuditSearch]   = useState('');

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (tab === 'services') loadServices();
    if (tab === 'contacts') loadContacts();
    if (tab === 'audit')    loadAudit();
  }, [tab]); // eslint-disable-line

  const loadServices = async () => {
    setLoading(true);
    const { data } = await api.get('/services').catch(() => ({ data: [] }));
    setServices(data);
    setLoading(false);
  };

  const loadContacts = async () => {
    setLoading(true);
    const { data } = await api.get('/admin/contacts').catch(() => ({ data: [] }));
    setContacts(data);
    setLoading(false);
  };

  const loadAudit = async () => {
    setLoading(true);
    const { data } = await api.get('/admin/audit-logs').catch(() => ({ data: [] }));
    setAuditLogs(data);
    setLoading(false);
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    saveSettings(profile);
    await api.patch('/admin/settings', profile).catch(() => {});
    toast('Settings saved successfully');
    setSaving(false);
  };

  const markRead = async (id) => {
    await api.patch(`/admin/contacts/${id}/read`).catch(() => {});
    setContacts(prev => prev.map(c => c.id === id ? { ...c, is_read: true } : c));
    toast('Marked as read');
  };

  const markAllRead = async () => {
    const unread = contacts.filter(c => !c.is_read);
    await Promise.all(unread.map(c => api.patch(`/admin/contacts/${c.id}/read`).catch(() => {})));
    setContacts(prev => prev.map(c => ({ ...c, is_read: true })));
    toast(`Marked ${unread.length} as read`);
  };

  const filteredContacts = contacts.filter(c => {
    const q = contactSearch.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.message?.toLowerCase().includes(q);
  });

  const filteredAudit = auditLogs.filter(a => {
    const q = auditSearch.toLowerCase();
    return !q || a.action?.toLowerCase().includes(q) || a.actor?.toLowerCase().includes(q) || a.entity?.toLowerCase().includes(q);
  });

  const unreadCount = contacts.filter(c => !c.is_read).length;

  return (
    <DashboardLayout pageTitle="Settings" pageSubtitle="Site configuration, services, contacts & audit log">

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`admin-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            <FontAwesomeIcon icon={t.icon} style={{ marginRight: 7 }} />
            {t.label}
            {t.id === 'contacts' && unreadCount > 0 && (
              <span style={{ marginLeft: 7, background: 'var(--primary)', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 7px' }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {tab === 'general' && (
        <div className="dash-grid-2" style={{ alignItems: 'flex-start' }}>
          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header"><h3>Site Information</h3></div>
            <form onSubmit={handleSaveGeneral} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Site Title',    key: 'site_title'    },
                { label: 'Tagline',       key: 'tagline'       },
                { label: 'Website',       key: 'website'       },
                { label: 'Contact Email', key: 'contact_email', type: 'email' },
                { label: 'Phone',         key: 'phone'         },
                { label: 'Address',       key: 'address'       },
                { label: 'TIN Number',    key: 'tin'           },
              ].map(({ label, key, type = 'text' }) => (
                <div className="form-group" key={key} style={{ margin: 0 }}>
                  <label>{label}</label>
                  <input type={type} value={profile[key] || ''} onChange={e => setProfile({ ...profile, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <FontAwesomeIcon icon={faCheck} style={{ marginRight: 7 }} />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="dash-table-wrap">
            <div className="dash-table-wrap__header"><h3>Preview</h3></div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <img src="/logo192.png" alt="logo" style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--border)' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--primary)' }}>{profile.site_title || '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.tagline || '—'}</div>
                </div>
              </div>
              {[
                { label: 'Website', value: profile.website       },
                { label: 'Email',   value: profile.contact_email },
                { label: 'Phone',   value: profile.phone         },
                { label: 'Address', value: profile.address       },
                { label: 'TIN',     value: profile.tin           },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: 'var(--text)' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Services ── */}
      {tab === 'services' && (
        <div className="dash-table-wrap">
          <div className="dash-table-wrap__header">
            <h3>Services <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>({services.length})</span></h3>
          </div>
          {loading ? (
            <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : services.length === 0 ? (
            <div className="dash-empty"><p>No services found.</p></div>
          ) : (
            <table className="dash-table">
              <thead>
                <tr><th>Name</th><th>Category</th><th>Packages</th><th>Status</th></tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.category || '—'}</td>
                    <td style={{ fontSize: 13 }}>
                      {['basic', 'standard', 'premium'].filter(t => s[`${t}_price`]).map(t => (
                        <span key={t} style={{ marginRight: 6, background: 'var(--light)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                          {t}
                        </span>
                      ))}
                    </td>
                    <td>
                      <span className={`status-badge ${s.is_active !== false ? 'status-badge--completed' : 'status-badge--cancelled'}`}>
                        {s.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Contacts ── */}
      {tab === 'contacts' && (
        <>
          <div className="orders-toolbar" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {contacts.length} total · <strong style={{ color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>{unreadCount} unread</strong>
            </span>
            <div className="orders-toolbar__right">
              <input className="orders-search" placeholder="Search name, email, message…"
                value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
              {unreadCount > 0 && (
                <button className="btn btn-outline btn-sm" onClick={markAllRead}>
                  <FontAwesomeIcon icon={faEnvelopeOpen} /> Mark All Read
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => exportCsvData(
                contacts.map(c => ({ name: c.name, email: c.email, phone: c.phone || '', message: c.message, received: fmtDate(c.created_at), read: c.is_read ? 'Yes' : 'No' })),
                'contacts.xls'
              )}>
                <FontAwesomeIcon icon={faDownload} /> Export
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => printElement('contacts-print', 'Contact Submissions')}>
                <FontAwesomeIcon icon={faPrint} /> PDF
              </button>
            </div>
          </div>

          <div className="dash-table-wrap" id="contacts-print">
            {loading ? (
              <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : filteredContacts.length === 0 ? (
              <div className="dash-empty">
                <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: 32, color: 'var(--border)' }} />
                <p>{contacts.length === 0 ? 'No contact submissions yet.' : 'No results match your search.'}</p>
              </div>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr><th>From</th><th>Phone</th><th>Message</th><th>Received</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {filteredContacts.map(c => (
                    <tr key={c.id} style={{ opacity: c.is_read ? 0.6 : 1 }}>
                      <td>
                        <strong style={{ display: 'block' }}>{c.name}</strong>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                      <td style={{ maxWidth: 380, fontSize: 13 }}>
                        {c.message?.slice(0, 160)}{c.message?.length > 160 ? '…' : ''}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                      <td>
                        <span className={`status-badge ${c.is_read ? 'status-badge--completed' : 'status-badge--requested'}`}>
                          {c.is_read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td>
                        {!c.is_read && (
                          <button className="btn btn-outline btn-sm" onClick={() => markRead(c.id)} title="Mark as read">
                            <FontAwesomeIcon icon={faEnvelopeOpen} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Audit Log ── */}
      {tab === 'audit' && (
        <>
          <div className="orders-toolbar" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{auditLogs.length} entries</span>
            <div className="orders-toolbar__right">
              <input className="orders-search" placeholder="Search action, actor, entity…"
                value={auditSearch} onChange={e => setAuditSearch(e.target.value)} />
              <button className="btn btn-outline btn-sm" onClick={() => exportCsvData(
                auditLogs.map(a => ({
                  when:    fmtDate(a.created_at),
                  actor:   a.actor || 'System',
                  action:  a.action,
                  entity:  formatAuditEntity(a.action, a.entity, a.entity_id, a.meta, a.actor),
                  details: formatAuditDetail(a.action, a.meta),
                })),
                'audit-log.xls'
              )}>
                <FontAwesomeIcon icon={faDownload} /> Export
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => printElement('audit-print', 'Audit Log')}>
                <FontAwesomeIcon icon={faPrint} /> PDF
              </button>
            </div>
          </div>

          <div className="dash-table-wrap" id="audit-print">
            {loading ? (
              <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : filteredAudit.length === 0 ? (
              <div className="dash-empty">
                <FontAwesomeIcon icon={faClockRotateLeft} style={{ fontSize: 32, color: 'var(--border)' }} />
                <p>{auditLogs.length === 0 ? 'No audit entries yet.' : 'No results match your search.'}</p>
              </div>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {filteredAudit.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</td>
                      <td style={{ fontSize: 13 }}><strong>{a.actor || 'System'}</strong></td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '2px 9px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                          background: `${ACTION_COLORS[a.action] || '#6b7280'}18`,
                          color: ACTION_COLORS[a.action] || '#6b7280',
                        }}>
                          {a.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {formatAuditEntity(a.action, a.entity, a.entity_id, a.meta, a.actor)}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 260 }}>
                        {formatAuditDetail(a.action, a.meta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <Toast toasts={toasts} />
    </DashboardLayout>
  );
}
