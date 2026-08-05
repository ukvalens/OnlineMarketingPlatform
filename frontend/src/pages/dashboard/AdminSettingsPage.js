import { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import api from '../../api';
import './dashboard.css';
import './admin-content.css';

export default function AdminSettingsPage() {
  const [tab, setTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (tab === 'general') loadSettings();
    if (tab === 'services') loadServices();
    if (tab === 'contacts') loadContacts();
    if (tab === 'audit') loadAudit();
  }, [tab]);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
    } catch (err) {
      setSettings(null);
    } finally { setLoading(false); }
  }

  async function saveSettings() {
    setLoading(true);
    try {
      await api.patch('/admin/settings', settings);
      alert('Settings saved');
    } catch (err) { alert('Save failed'); }
    setLoading(false);
  }

  async function loadServices() {
    setLoading(true);
    try {
      const res = await api.get('/services');
      setServices(res.data || []);
    } catch (err) { setServices([]); }
    setLoading(false);
  }

  async function loadContacts() {
    setLoading(true);
    try {
      const res = await api.get('/admin/contacts');
      setContacts(res.data || []);
    } catch (err) { setContacts([]); }
    setLoading(false);
  }

  async function markRead(id) {
    try {
      await api.patch(`/admin/contacts/${id}/read`);
      setContacts(prev => prev.map(c => c.id === id ? { ...c, is_read: true } : c));
    } catch (err) { /* ignore */ }
  }

  async function loadAudit() {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      setAuditLogs(res.data || []);
    } catch (err) { setAuditLogs([]); }
    setLoading(false);
  }

  return (
    <DashboardLayout pageTitle="Settings" pageSubtitle="Site configuration & administration">
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        {['general','services','contacts','audit'].map(t => (
          <button
            key={t}
            className={`btn btn-outline btn-sm${tab===t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', padding: 18, borderRadius: 6 }}>
        {tab === 'general' && (
          <div>
            {loading && <div className="spinner" />}
            {!loading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
                <div>
                  <label>Site Title</label>
                  <input className="input" value={settings?.site_title || ''} onChange={e => setSettings({ ...settings, site_title: e.target.value })} />
                  <label>Contact Email</label>
                  <input className="input" value={settings?.contact_email || ''} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} />
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={saveSettings}>Save</button>
                  </div>
                </div>
                <div>
                  <h4>Preview</h4>
                  <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 6 }}>
                    <strong>{settings?.site_title || '—'}</strong>
                    <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>{settings?.contact_email ?? 'No contact email set'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'services' && (
          <div>
            {loading && <div className="spinner" />}
            {!loading && (
              <table className="dash-table">
                <thead><tr><th>Name</th><th>Category</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.category}</td>
                      <td style={{ textAlign: 'right' }}>
                        <a href={`/dashboard/admin/portfolio`} className="btn btn-outline btn-sm">Manage</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'contacts' && (
          <div>
            {loading && <div className="spinner" />}
            {!loading && (
              <table className="dash-table">
                <thead><tr><th>From</th><th>Message</th><th>Received</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id} style={{ opacity: c.is_read ? 0.6 : 1 }}>
                      <td>{c.name} <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div></td>
                      <td style={{ maxWidth: 480 }}>{c.message?.slice(0,200)}{c.message?.length>200 ? '…' : ''}</td>
                      <td>{new Date(c.created_at).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        {!c.is_read && <button className="btn btn-primary btn-sm" onClick={() => markRead(c.id)}>Mark read</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div>
            {loading && <div className="spinner" />}
            {!loading && (
              <table className="dash-table">
                <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
                <tbody>
                  {auditLogs.map(a => (
                    <tr key={a.id}>
                      <td>{new Date(a.created_at).toLocaleString()}</td>
                      <td>{a.actor || 'System'}</td>
                      <td>{a.action}</td>
                      <td>{a.entity} {a.entity_id ? `#${a.entity_id}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
