import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faLock, faShield, faTriangleExclamation,
  faCheck, faEye, faEyeSlash, faCamera
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api, { getImageUrl } from '../../api';
import './orders.css';
import './admin-content.css';
import './profile.css';

const ROLE_META = {
  admin:   { bg: '#f5f3ff', color: '#7c3aed', label: 'Administrator', desc: 'Full platform access — manage users, content, analytics and settings.' },
  client:  { bg: '#eff6ff', color: '#1d4ed8', label: 'Client',        desc: 'Place orders, track projects, pay invoices and message the team.' },
  staff:   { bg: '#f0fdf4', color: '#15803d', label: 'Staff',         desc: 'Manage orders, update statuses and communicate with clients.' },
  editor:  { bg: '#fffbeb', color: '#b45309', label: 'Editor',        desc: 'Create and publish blog posts and portfolio items.' },
  finance: { bg: '#ecfeff', color: '#0e7490', label: 'Finance',       desc: 'View and manage invoices, payments and financial reports.' },
};

const TABS = [
  { id: 'info',     label: 'Profile Info',   icon: faUser },
  { id: 'password', label: 'Password',       icon: faLock },
  { id: 'account',  label: 'Account',        icon: faShield },
];

const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const fmtDate  = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'long', year: 'numeric' });

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('info');
  const avatarInputRef = useRef();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.put('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(data);
    } catch { /* ignore */ }
    setAvatarUploading(false);
    e.target.value = '';
  };

  return (
    <DashboardLayout pageTitle="My Profile" pageSubtitle="Manage your account information and security">
      <div className="profile-layout">

        {/* Left — identity card */}
        <aside className="profile-card">
          <div className="profile-card__avatar"
            style={{ background: user?.avatar_url ? 'transparent' : ROLE_META[user?.role]?.color }}
            onClick={() => avatarInputRef.current.click()}>
            {user?.avatar_url
              ? <img src={getImageUrl(user.avatar_url)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }} />
              : initials(user?.name)
            }
            <div className="profile-card__avatar-overlay">
              {avatarUploading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <FontAwesomeIcon icon={faCamera} />}
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <h2 className="profile-card__name">{user?.name}</h2>
          <span className="role-badge profile-card__role"
            style={{ background: ROLE_META[user?.role]?.bg, color: ROLE_META[user?.role]?.color }}>
            {user?.role === 'admin' && <FontAwesomeIcon icon={faShield} style={{ marginRight: 5, fontSize: 11 }} />}
            {ROLE_META[user?.role]?.label}
          </span>
          <p className="profile-card__email">{user?.email}</p>
          {user?.company_name && <p className="profile-card__company">{user.company_name}</p>}

          <div className="profile-card__divider" />

          <div className="profile-card__meta">
            <div className="profile-card__meta-item">
              <span>Member since</span>
              <strong>{user?.created_at ? fmtDate(user.created_at) : '—'}</strong>
            </div>
            <div className="profile-card__meta-item">
              <span>Role</span>
              <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong>
            </div>
            {user?.phone && (
              <div className="profile-card__meta-item">
                <span>Phone</span>
                <strong>{user.phone}</strong>
              </div>
            )}
            {user?.industry && (
              <div className="profile-card__meta-item">
                <span>Industry</span>
                <strong>{user.industry}</strong>
              </div>
            )}
          </div>

          <div className="profile-card__divider" />

          <div className="role-info-box"
            style={{ background: ROLE_META[user?.role]?.bg, borderColor: ROLE_META[user?.role]?.color + '44', color: ROLE_META[user?.role]?.color }}>
            <FontAwesomeIcon icon={faShield} />
            <span>{ROLE_META[user?.role]?.desc}</span>
          </div>
        </aside>

        {/* Right — tabs */}
        <div className="profile-main">
          <div className="admin-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`admin-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                <FontAwesomeIcon icon={t.icon} style={{ marginRight: 7 }} />{t.label}
              </button>
            ))}
          </div>

          {tab === 'info'     && <InfoTab user={user} updateUser={updateUser} />}
          {tab === 'password' && <PasswordTab />}
          {tab === 'account'  && <AccountTab user={user} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ══════════════════════════════════════════
   INFO TAB
══════════════════════════════════════════ */
function InfoTab({ user, updateUser }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company_name: '', industry: '',
  });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (user) setForm({
      name:         user.name         || '',
      email:        user.email        || '',
      phone:        user.phone        || '',
      company_name: user.company_name || '',
      industry:     user.industry     || '',
    });
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      const { data } = await api.put('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes.');
    }
    setSaving(false);
  };

  return (
    <form className="profile-section" onSubmit={handleSubmit}>
      <div className="profile-section__header">
        <h3>Personal Information</h3>
        <p>Update your name, contact details and business information.</p>
      </div>

      {error   && <div className="auth-form__alert auth-form__alert--error">{error}</div>}
      {success && <div className="auth-form__alert auth-form__alert--success"><FontAwesomeIcon icon={faCheck} /> Profile updated successfully.</div>}

      <div className="form-row-2">
        <div className="form-group">
          <label>Full Name *</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Email Address *</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-group">
          <label>Phone Number</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+250 780 000 000" />
        </div>
        <div className="form-group">
          <label>Company / Organisation</label>
          <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Optional" />
        </div>
      </div>
      <div className="form-group" style={{ maxWidth: 360 }}>
        <label>Industry</label>
        <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Retail, Technology, NGO" />
      </div>

      <div className="profile-section__footer">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : <><FontAwesomeIcon icon={faCheck} /> Save Changes</>}
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════
   PASSWORD TAB
══════════════════════════════════════════ */
function PasswordTab() {
  const [form, setForm]       = useState({ current_password: '', new_password: '', confirm: '' });
  const [show, setShow]       = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const rules = [
    { label: '8+ characters',  ok: form.new_password.length >= 8 },
    { label: 'Uppercase',      ok: /[A-Z]/.test(form.new_password) },
    { label: 'Number',         ok: /\d/.test(form.new_password) },
    { label: 'Passwords match',ok: form.new_password.length > 0 && form.new_password === form.confirm },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) return setError('Passwords do not match.');
    setSaving(true); setError(''); setSuccess(false);
    try {
      await api.put('/profile/password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setForm({ current_password: '', new_password: '', confirm: '' });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    }
    setSaving(false);
  };

  const toggle = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <form className="profile-section" onSubmit={handleSubmit}>
      <div className="profile-section__header">
        <h3>Change Password</h3>
        <p>Use a strong password you don't use elsewhere.</p>
      </div>

      {error   && <div className="auth-form__alert auth-form__alert--error">{error}</div>}
      {success && <div className="auth-form__alert auth-form__alert--success"><FontAwesomeIcon icon={faCheck} /> Password updated successfully.</div>}

      <div className="form-group" style={{ maxWidth: 420 }}>
        <label>Current Password *</label>
        <div className="password-wrapper">
          <input
            type={show.current ? 'text' : 'password'}
            value={form.current_password}
            onChange={e => { setForm({ ...form, current_password: e.target.value }); setError(''); }}
            required autoComplete="current-password"
          />
          <button type="button" className="password-toggle" onClick={() => toggle('current')}>
            <FontAwesomeIcon icon={show.current ? faEyeSlash : faEye} />
          </button>
        </div>
      </div>

      <div className="form-group" style={{ maxWidth: 420 }}>
        <label>New Password *</label>
        <div className="password-wrapper">
          <input
            type={show.new ? 'text' : 'password'}
            value={form.new_password}
            onChange={e => { setForm({ ...form, new_password: e.target.value }); setError(''); }}
            required minLength={8} autoComplete="new-password"
          />
          <button type="button" className="password-toggle" onClick={() => toggle('new')}>
            <FontAwesomeIcon icon={show.new ? faEyeSlash : faEye} />
          </button>
        </div>
        <div className="password-rules" style={{ marginTop: 10 }}>
          {rules.slice(0, 3).map(r => (
            <span key={r.label} className={`password-rule${r.ok ? ' password-rule--ok' : ''}`}>
              {r.ok ? '✓' : '○'} {r.label}
            </span>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ maxWidth: 420 }}>
        <label>Confirm New Password *</label>
        <div className="password-wrapper">
          <input
            type={show.confirm ? 'text' : 'password'}
            value={form.confirm}
            onChange={e => { setForm({ ...form, confirm: e.target.value }); setError(''); }}
            required autoComplete="new-password"
          />
          <button type="button" className="password-toggle" onClick={() => toggle('confirm')}>
            <FontAwesomeIcon icon={show.confirm ? faEyeSlash : faEye} />
          </button>
        </div>
        {form.confirm.length > 0 && (
          <span className={`password-rule${rules[3].ok ? ' password-rule--ok' : ''}`} style={{ marginTop: 8, display: 'inline-flex' }}>
            {rules[3].ok ? '✓' : '○'} {rules[3].label}
          </span>
        )}
      </div>

      <div className="profile-section__footer">
        <button type="submit" className="btn btn-primary" disabled={saving || !rules.every(r => r.ok)}>
          {saving ? 'Updating…' : <><FontAwesomeIcon icon={faLock} /> Update Password</>}
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════
   ACCOUNT TAB
══════════════════════════════════════════ */
function AccountTab({ user }) {
  const fmtDateTime = (d) => new Date(d).toLocaleString('en-RW', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="profile-section">
      <div className="profile-section__header">
        <h3>Account Details</h3>
        <p>Read-only information about your account.</p>
      </div>

      <div className="account-info-grid">
        <div className="account-info-item">
          <span>Account ID</span>
          <strong className="account-id">{user?.id}</strong>
        </div>
        <div className="account-info-item">
          <span>Role</span>
          <strong>
            <span className="role-badge"
              style={{ background: ROLE_META[user?.role]?.bg, color: ROLE_META[user?.role]?.color }}>
              {user?.role === 'admin' && <FontAwesomeIcon icon={faShield} style={{ marginRight: 4, fontSize: 10 }} />}
              {ROLE_META[user?.role]?.label}
            </span>
          </strong>
        </div>
        <div className="account-info-item">
          <span>Account Status</span>
          <strong><span className="status-badge status-badge--completed">Active</span></strong>
        </div>
        <div className="account-info-item">
          <span>Member Since</span>
          <strong>{user?.created_at ? fmtDateTime(user.created_at) : '—'}</strong>
        </div>
        <div className="account-info-item">
          <span>Email</span>
          <strong>{user?.email}</strong>
        </div>
        <div className="account-info-item">
          <span>Phone</span>
          <strong>{user?.phone || '—'}</strong>
        </div>
      </div>

      <div className="profile-section__divider" />

      {/* Danger zone */}
      <div className="danger-zone">
        <div className="danger-zone__header">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <div>
            <strong>Danger Zone</strong>
            <p>These actions are irreversible. Please be certain.</p>
          </div>
        </div>
        <div className="danger-zone__actions">
          <div className="danger-zone__item">
            <div>
              <strong>Sign out of all sessions</strong>
              <p>Removes your token and logs you out everywhere.</p>
            </div>
            <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>
              Sign Out All
            </button>
          </div>
          <div className="danger-zone__item">
            <div>
              <strong>Deactivate account</strong>
              <p>Contact an administrator to deactivate your account.</p>
            </div>
            <a href="/contact" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              Contact Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
