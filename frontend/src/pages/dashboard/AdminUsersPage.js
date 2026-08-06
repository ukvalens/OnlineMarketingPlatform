/**
 * frontend/src/pages/dashboard/AdminUsersPage.js
 *
 * Admin page for managing all platform users.
 *
 * Changes:
 * - Initial implementation: user table with role/status filters, search, and pagination.
 * - Added stat cards (total, clients, staff/admin, inactive) and role summary cards.
 * - Added Create User modal with full form (name, email, password, phone, company, role).
 * - Added Edit Role modal with role-picker grid and role descriptions.
 * - Added Toggle Active (deactivate / reactivate) per user row and detail drawer.
 * - Added User Detail drawer with info grid, actions, and audit history log.
 * - Added handleDelete: calls DELETE /admin/users/:id with a confirmation dialog.
 * - Added trash button in the table row actions (hidden for self).
 * - Added "Delete Permanently" button in the detail drawer actions.
 * - Imported faTrash icon.
 */
import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCheck, faUserXmark, faEdit, faXmark, faCheck,
  faSearch, faPlus, faUser, faDownload, faShield,
  faClockRotateLeft, faEye, faTrash, faPrint
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api, { exportCsvData, printElement } from '../../api';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import './orders.css';
import './admin-content.css';
import './admin-users.css';

const ROLES = ['client', 'staff', 'editor', 'finance', 'admin'];
const ROLE_META = {
  admin:   { bg: '#f5f3ff', color: '#7c3aed', desc: 'Full platform access' },
  client:  { bg: '#eff6ff', color: '#1d4ed8', desc: 'Can place orders & pay invoices' },
  staff:   { bg: '#f0fdf4', color: '#15803d', desc: 'Manages orders & clients' },
  editor:  { bg: '#fffbeb', color: '#b45309', desc: 'Manages blog & portfolio' },
  finance: { bg: '#ecfeff', color: '#0e7490', desc: 'Manages invoices & payments' },
};

const fmtDate  = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime  = (d) => new Date(d).toLocaleString('en-RW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmt      = (n) => Number(n).toLocaleString();
const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'client', company_name: '' };

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit user modal
  const [editModal, setEditModal]   = useState(null);
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);
  const [editError, setEditError]   = useState('');

  // Detail drawer
  const [drawer, setDrawer]         = useState(null);
  const [auditLog, setAuditLog]     = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/users').catch(() => ({ data: [] }));
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Create user ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setCreateError('');
    try {
      await api.post('/admin/users', form);
      await load();
      setCreateModal(false);
      setForm(emptyForm);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create user.');
    }
    setCreating(false);
  };

  /* ── Edit user ── */
  const openEdit = (u) => {
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', company_name: u.company_name || '', role: u.role });
    setEditError('');
    setEditModal(u);
  };
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true); setEditError('');
    try {
      const { data } = await api.patch(`/admin/users/${editModal.id}`, editForm);
      setUsers(prev => prev.map(u => u.id === editModal.id ? { ...u, ...data } : u));
      if (drawer?.id === editModal.id) setDrawer(prev => ({ ...prev, ...data }));
      setEditModal(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user.');
    }
    setSaving(false);
  };

  /* ── Toggle active ── */
  const toggleActive = async (u) => {
    const next = !u.is_active;
    if (!window.confirm(`${next ? 'Reactivate' : 'Deactivate'} ${u.name}?`)) return;
    try {
      await api.patch(`/admin/users/${u.id}`, { is_active: next });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: next } : x));
      if (drawer?.id === u.id) setDrawer(prev => ({ ...prev, is_active: next }));
    } catch { /* ignore */ }
  };

  /* ── Detail drawer ── */
  const openDrawer = async (u) => {
    setDrawer(u);
    setAuditLoading(true);
    const { data } = await api.get(`/admin/users/${u.id}/audit`).catch(() => ({ data: [] }));
    setAuditLog(data);
    setAuditLoading(false);
  };

  /* ── Delete user ── */
  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name} (${u.email})? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      if (drawer?.id === u.id) setDrawer(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  /* ── Filtered list ── */
  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.company_name || '').toLowerCase().includes(q);
    return matchRole && matchStatus && matchSearch;
  });

  const { paged: pagedUsers, page, totalPages, setPage, reset } = usePagination(filtered, 10);
  useEffect(() => { reset(); }, [filtered.length, roleFilter, statusFilter, search]); // eslint-disable-line

  const stats = [
    { label: 'Total Users',  value: users.length,                                                          color: 'blue',   icon: '👥' },
    { label: 'Clients',      value: users.filter(u => u.role === 'client').length,                         color: 'purple', icon: '🧑‍💼' },
    { label: 'Staff / Admin',value: users.filter(u => ['staff','editor','finance','admin'].includes(u.role)).length, color: 'green', icon: '🛠️' },
    { label: 'Inactive',     value: users.filter(u => !u.is_active).length,                                color: 'orange', icon: '🚫' },
  ];

  return (
    <DashboardLayout pageTitle="User Management" pageSubtitle="Super Admin · Manage all users, roles and access">

      {/* Stats */}
      <div className="stat-cards" style={{ marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-card__icon stat-card__icon--${s.color}`}>{s.icon}</div>
            <div>
              <div className="stat-card__value">{loading ? '—' : s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Role summary cards */}
      <div className="role-summary-row">
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r).length;
          return (
            <div key={r} className="role-summary-card" style={{ borderColor: ROLE_META[r].color + '44' }}
              onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}>
              <div className="role-summary-card__dot" style={{ background: ROLE_META[r].color }} />
              <div>
                <div className="role-summary-card__name" style={{ color: ROLE_META[r].color }}>{r.charAt(0).toUpperCase() + r.slice(1)}</div>
                <div className="role-summary-card__count">{loading ? '—' : count} user{count !== 1 ? 's' : ''}</div>
                <div className="role-summary-card__desc">{ROLE_META[r].desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="orders-toolbar" style={{ marginTop: 24 }}>
        <div className="orders-filters" style={{ flexWrap: 'wrap' }}>
          {['all', ...ROLES].map(r => (
            <button key={r} className={`orders-filter-btn${roleFilter === r ? ' active' : ''}`} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          <div className="filter-divider" />
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} className={`orders-filter-btn${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="orders-toolbar__right">
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input className="orders-search" style={{ paddingLeft: 34 }}
              placeholder="Search name, email, company…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() =>
              exportCsvData(filtered.map(u => ({
                  name: u.name,
                  email: u.email,
                  phone: u.phone || '',
                  company: u.company_name || '',
                  role: u.role,
                  status: u.is_active ? 'Active' : 'Inactive',
                  orders: u.order_count || 0,
                  total_paid_rwf: u.total_paid ? Number(u.total_paid).toLocaleString() : '0',
                  joined: fmtDate(u.created_at),
                })), 'users.xls')}>
            <FontAwesomeIcon icon={faDownload} /> Export Excel
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => printElement('users-table-print', 'Users')}>
            <FontAwesomeIcon icon={faPrint} /> PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(emptyForm); setCreateError(''); setCreateModal(true); }}>
            <FontAwesomeIcon icon={faPlus} /> Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="dash-table-wrap" id="users-table-print">
        {loading ? (
          <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty"><span><FontAwesomeIcon icon={faUser} style={{ fontSize: 32 }} /></span><p>No users match your filters.</p></div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Company</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Revenue (RWF)</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map(u => (
                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ background: ROLE_META[u.role]?.color }}>
                        {initials(u.name)}
                      </div>
                      <div>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {u.name}
                          {u.id === me?.id && <span className="you-badge">You</span>}
                        </strong>
                        {u.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.company_name || '—'}</td>
                  <td>
                    <span className="role-badge" style={{ background: ROLE_META[u.role]?.bg, color: ROLE_META[u.role]?.color }}>
                      {u.role === 'admin' && <FontAwesomeIcon icon={faShield} style={{ marginRight: 4, fontSize: 10 }} />}
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{u.order_count || 0}</td>
                  <td style={{ fontWeight: 600 }}>{u.total_paid > 0 ? fmt(u.total_paid) : '—'}</td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'status-badge--completed' : 'status-badge--cancelled'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(u.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openDrawer(u)} title="View details">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      {u.id !== me?.id && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)} title="Edit user">
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleActive(u)}
                            title={u.is_active ? 'Deactivate' : 'Reactivate'}
                          >
                            <FontAwesomeIcon icon={u.is_active ? faUserXmark : faUserCheck} />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u)} title="Delete permanently">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={setPage} total={filtered.length} pageSize={10} />

      {/* ── Create User Modal ── */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Create New User</h3>
              <button className="modal__close" onClick={() => setCreateModal(false)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={handleCreate}>
              {createError && <div className="auth-form__alert auth-form__alert--error">{createError}</div>}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="user@example.com" />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} placeholder="Min. 8 characters" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+250 780 000 000" />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Company</label>
                  <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="role-info-box" style={{ background: ROLE_META[form.role]?.bg, borderColor: ROLE_META[form.role]?.color + '55', color: ROLE_META[form.role]?.color }}>
                <FontAwesomeIcon icon={faShield} />
                <span>{ROLE_META[form.role]?.desc}</span>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : <><FontAwesomeIcon icon={faPlus} /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div>
                <h3>Edit User</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{editModal.email}</span>
              </div>
              <button className="modal__close" onClick={() => setEditModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSaveEdit}>
              {editError && <div className="auth-form__alert auth-form__alert--error">{editError}</div>}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+250 780 000 000" />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Role *</label>
              </div>
              <div className="role-picker-grid">
                {ROLES.map(r => (
                  <div key={r}
                    className={`role-picker-card${editForm.role === r ? ' selected' : ''}`}
                    style={editForm.role === r ? { background: ROLE_META[r].bg, borderColor: ROLE_META[r].color } : {}}
                    onClick={() => setEditForm({ ...editForm, role: r })}
                  >
                    <div className="role-picker-card__name" style={{ color: editForm.role === r ? ROLE_META[r].color : undefined }}>
                      {r === 'admin' && <FontAwesomeIcon icon={faShield} style={{ marginRight: 5 }} />}
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </div>
                    <div className="role-picker-card__desc">{ROLE_META[r].desc}</div>
                    {editForm.role === r && <FontAwesomeIcon icon={faCheck} className="role-picker-card__check" style={{ color: ROLE_META[r].color }} />}
                  </div>
                ))}
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : <><FontAwesomeIcon icon={faCheck} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── User Detail Drawer ── */}
      {drawer && (
        <div className="drawer-overlay" onClick={() => setDrawer(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="user-avatar user-avatar--lg" style={{ background: ROLE_META[drawer.role]?.color }}>
                  {initials(drawer.name)}
                </div>
                <div>
                  <h3 style={{ marginBottom: 4 }}>{drawer.name}</h3>
                  <span className="role-badge" style={{ background: ROLE_META[drawer.role]?.bg, color: ROLE_META[drawer.role]?.color }}>
                    {drawer.role === 'admin' && <FontAwesomeIcon icon={faShield} style={{ marginRight: 4, fontSize: 10 }} />}
                    {drawer.role}
                  </span>
                </div>
              </div>
              <button className="modal__close" onClick={() => setDrawer(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            <div className="drawer__body">
              {/* Info grid */}
              <div className="detail-grid" id="user-detail-print">
                <div className="detail-item"><span>Email</span><strong style={{ fontSize: 13 }}>{drawer.email}</strong></div>
                <div className="detail-item"><span>Phone</span><strong>{drawer.phone || '—'}</strong></div>
                <div className="detail-item"><span>Company</span><strong>{drawer.company_name || '—'}</strong></div>
                <div className="detail-item"><span>Status</span>
                  <strong>
                    <span className={`status-badge ${drawer.is_active ? 'status-badge--completed' : 'status-badge--cancelled'}`}>
                      {drawer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </strong>
                </div>
                <div className="detail-item"><span>Orders</span><strong>{drawer.order_count || 0}</strong></div>
                <div className="detail-item"><span>Total Paid</span><strong>{drawer.total_paid > 0 ? `RWF ${fmt(drawer.total_paid)}` : '—'}</strong></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><span>Joined</span><strong>{fmtDate(drawer.created_at)}</strong></div>
              </div>

              {/* Actions */}
              {drawer.id !== me?.id && (
                <div className="drawer__actions">
                  <button className="btn btn-outline" onClick={() => { openEdit(drawer); }}>
                    <FontAwesomeIcon icon={faEdit} /> Edit User
                  </button>
                  <button className="btn btn-outline" onClick={() =>
                    exportCsvData([{
                      name: drawer.name,
                      email: drawer.email,
                      phone: drawer.phone || '',
                      company: drawer.company_name || '',
                      role: drawer.role,
                      status: drawer.is_active ? 'Active' : 'Inactive',
                      orders: drawer.order_count || 0,
                      total_paid_rwf: drawer.total_paid ? Number(drawer.total_paid).toLocaleString() : '0',
                      joined: fmtDate(drawer.created_at),
                    }], `user-${drawer.name.replace(/\s+/g,'-')}.xls`)
                  }>
                    <FontAwesomeIcon icon={faDownload} /> Excel
                  </button>
                  <button className="btn btn-outline" onClick={() => printElement('user-detail-print', `User ${drawer.name}`)}>
                    <FontAwesomeIcon icon={faPrint} /> PDF
                  </button>
                  <button
                    className={`btn ${drawer.is_active ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleActive(drawer)}
                  >
                    <FontAwesomeIcon icon={drawer.is_active ? faUserXmark : faUserCheck} />
                    {drawer.is_active ? ' Deactivate' : ' Reactivate'}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(drawer)}>
                    <FontAwesomeIcon icon={faTrash} /> Delete Permanently
                  </button>
                </div>
              )}

              {/* Audit log */}
              <div className="detail-section">
                <div className="detail-section__toggle" style={{ cursor: 'default' }}>
                  <strong><FontAwesomeIcon icon={faClockRotateLeft} style={{ marginRight: 8 }} />Audit History</strong>
                </div>
                <div className="detail-section__body">
                  {auditLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><span className="spinner" /></div>
                  ) : auditLog.length === 0 ? (
                    <p className="detail-empty">No audit events for this user.</p>
                  ) : (
                    <ul className="audit-list">
                      {auditLog.map(log => (
                        <li key={log.id} className="audit-item">
                          <div className="audit-item__dot" />
                          <div className="audit-item__body">
                            <strong>{log.action.replace(/_/g, ' ')}</strong>
                            {log.actor && <span> by {log.actor}</span>}
                            {log.meta && <div className="audit-item__meta">{JSON.stringify(log.meta)}</div>}
                            <div className="audit-item__time">{fmtTime(log.created_at)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
