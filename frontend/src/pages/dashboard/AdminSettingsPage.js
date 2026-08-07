import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear, faListCheck, faEnvelope, faClockRotateLeft,
  faCheck, faEnvelopeOpen, faTrash, faDownload, faPrint
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
  CREATE_USER: '#15803d', UPDATE_USER: '#1d4ed8', DELETE_USER: '#b91c1c',
  DELETE_ORDER: '#b91c1c', DELETE_INVOICE: '#b91c1c', DELETE_PAYMENT: '#b91c1c',
  CONFIRM_PAYMENT: '#15803d', UPDATE_ORDER_STATUS: '#7c3aed',
  MARK_CONTACT_READ: '#0e7490',
};

const TABS = [
  { id: 'general',  label: 'General',  icon: faGear           },
  { id: 'services', label: 'Services', icon: faListCheck       },
  { id: 'contacts', label: 'Contacts', icon: faEnvelope        },
  { id: 'audit',    label: 'Audit Log',icon: faClockRotateLeft },
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

  // General
  const [profile, setProfile] = useState(() => ({ ...settings }));
  const [saving, setSaving]   = useState(false);

  // Services
  const [services, setServices] = useState([]);

  // Contacts
  const [contacts, setContacts]   = useState([]);
  const [contactSearch, setContactSearch] = useState('');

  // Audit
  const [auditLogs, setAuditLogs]   = useState([]);
  const [auditSearch, setAuditSearch] = useState('');

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
                { label: 'Site Title',     key: 'site_title'     },
                { label: 'Tagline',        key: 'tagline'        },
                { label: 'Website',        key: 'website'        },
                { label: 'Contact Email',  key: 'contact_email', type: 'email' },
                { label: 'Phone',          key: 'phone'          },
                { label: 'Address',        key: 'address'        },
                { label: 'TIN Number',     key: 'tin'            },
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
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Digital Marketing · Kigali, Rwanda</div>
                </div>
              </div>
              {[
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
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Packages</th>
                  <th>Status</th>
                </tr>
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {contacts.length} total · <strong style={{ color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>{unreadCount} unread</strong>
              </span>
            </div>
            <div className="orders-toolbar__right">
              <div style={{ position: 'relative' }}>
                <input className="orders-search" style={{ paddingLeft: 34 }}
                  placeholder="Search name, email, message…"
                  value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
              </div>
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
                  <tr>
                    <th>From</th>
                    <th>Phone</th>
                    <th>Message</th>
                    <th>Received</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
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
              <div style={{ position: 'relative' }}>
                <input className="orders-search" style={{ paddingLeft: 34 }}
                  placeholder="Search action, actor, entity…"
                  value={auditSearch} onChange={e => setAuditSearch(e.target.value)} />
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => exportCsvData(
                auditLogs.map(a => ({ when: fmtDate(a.created_at), actor: a.actor || 'System', action: a.action, entity: a.entity, entity_id: a.entity_id || '', meta: a.meta ? JSON.stringify(a.meta) : '' })),
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
                  <tr>
                    <th>When</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
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
                      <td style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {a.entity?.replace(/_/g, ' ')}{a.entity_id ? ` #${String(a.entity_id).slice(0, 8)}` : ''}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.meta ? JSON.stringify(a.meta) : '—'}
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
