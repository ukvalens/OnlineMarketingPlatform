import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import {
  faPlus, faEdit, faTrash, faXmark, faCheck,
  faEye, faEyeSlash, faSearch, faImage, faNewspaper, faArrowUpRightFromSquare
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api, { getImageUrl } from '../../api';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import './orders.css';
import './admin-content.css';
import './editor-blog.css';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' });
const emptyForm = { title: '', excerpt: '', body: '', status: 'draft' };

export default function EditorBlogPage() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  // Editor drawer
  const [drawer, setDrawer]   = useState(null); // null | { mode:'add'|'edit', post? }
  const [form, setForm]       = useState(emptyForm);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/blog/admin/all').catch(() => ({ data: [] }));
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyForm);
    setCoverFile(null); setCoverPreview(null); setError('');
    setDrawer({ mode: 'add' });
  };

  const openEdit = (post) => {
    setForm({ title: post.title, excerpt: post.excerpt || '', body: post.body || '', status: post.status });
    setCoverFile(null);
    setCoverPreview(post.cover_image ? getImageUrl(post.cover_image) : null);
    setError('');
    setDrawer({ mode: 'edit', post });
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coverFile) fd.append('cover_image', coverFile);
      if (drawer.mode === 'add') {
        await api.post('/blog', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.put(`/blog/${drawer.post.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await load();
      setDrawer(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const togglePublish = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const fd = new FormData();
    fd.append('status', newStatus);
    await api.put(`/blog/${post.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p));
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    await api.delete(`/blog/${post.id}`).catch(() => {});
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  const filtered = posts.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const { paged, page, totalPages, setPage, reset } = usePagination(filtered, 10);
  useEffect(() => { reset(); }, [filter, search]); // eslint-disable-line

  const stats = [
    { label: 'Total Posts',   value: posts.length,                                        color: 'blue',   icon: '📝' },
    { label: 'Published',     value: posts.filter(p => p.status === 'published').length,  color: 'green',  icon: '🌐' },
    { label: 'Drafts',        value: posts.filter(p => p.status === 'draft').length,      color: 'orange', icon: '📄' },
  ];

  return (
    <DashboardLayout pageTitle="Blog Management" pageSubtitle="Editor · Create and publish blog posts">

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

      {/* Toolbar */}
      <div className="orders-toolbar">
        <div className="orders-filters">
          {['all', 'published', 'draft'].map(f => (
            <button key={f} className={`orders-filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="orders-toolbar__right">
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input className="orders-search" style={{ paddingLeft: 34 }}
              placeholder="Search title, excerpt…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <FontAwesomeIcon icon={faPlus} /> New Post
          </button>
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="dash-empty">
          <span><FontAwesomeIcon icon={faNewspaper} style={{ fontSize: 32 }} /></span>
          <p>{posts.length === 0 ? 'No blog posts yet. Create your first post!' : 'No posts match your filters.'}</p>
        </div>
      ) : (
        <div className="blog-list">
          {paged.map(post => (
            <div key={post.id} className="blog-row">
              <div className="blog-row__cover">
                {post.cover_image
                  ? <img src={getImageUrl(post.cover_image)} alt={post.title} />
                  : <div className="blog-row__cover-placeholder"><FontAwesomeIcon icon={faImage} /></div>}
              </div>
              <div className="blog-row__body">
                <div className="blog-row__meta">
                  <span className={`portfolio-card__badge ${post.status === 'published' ? 'published' : 'draft'}`}>
                    {post.status}
                  </span>
                  <span className="blog-row__date">{fmtDate(post.created_at)}</span>
                  {post.published_at && <span className="blog-row__date">Published: {fmtDate(post.published_at)}</span>}
                </div>
                <strong className="blog-row__title">{post.title}</strong>
                {post.excerpt && <p className="blog-row__excerpt">{post.excerpt}</p>}
                <span className="blog-row__author">By {post.author}</span>
              </div>
              <div className="blog-row__actions">
                {post.status === 'published' && (
                  <Link to={`/blog/${post.slug}`} className="btn btn-outline btn-sm"
                    title="View live post">
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> View
                  </Link>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => togglePublish(post)}
                  title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                  <FontAwesomeIcon icon={post.status === 'published' ? faEyeSlash : faEye} />
                  {post.status === 'published' ? ' Unpublish' : ' Publish'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(post)}>
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(post)}>
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} total={filtered.length} pageSize={10} />

      {/* ── Editor Drawer ── */}
      {drawer && (
        <div className="drawer-overlay" onClick={() => setDrawer(null)}>
          <div className="drawer drawer--wide blog-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer__header">
              <div>
                <h3>{drawer.mode === 'add' ? 'New Blog Post' : 'Edit Post'}</h3>
                {drawer.post && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{drawer.post.title}</span>}
              </div>
              <button className="modal__close" onClick={() => setDrawer(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="drawer__body" onSubmit={handleSave}>
              {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}

              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  required placeholder="Post title…" />
              </div>

              <div className="form-group">
                <label>Excerpt</label>
                <textarea rows={2} value={form.excerpt}
                  onChange={e => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Short summary shown in listings…" style={{ resize: 'vertical' }} />
              </div>

              <div className="form-group">
                <label>Cover Image</label>
                <input type="file" accept="image/*" onChange={handleCoverChange} />
                {coverPreview && (
                  <div className="blog-cover-preview">
                    <img src={coverPreview} alt="Cover preview" />
                    <button type="button" className="blog-cover-remove" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Content *</label>
                <textarea
                  className="blog-body-editor"
                  rows={18}
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  required
                  placeholder="Write your blog post content here…"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div className="blog-status-toggle">
                  {['draft', 'published'].map(s => (
                    <button key={s} type="button"
                      className={`blog-status-btn${form.status === s ? ' active' : ''}`}
                      onClick={() => setForm({ ...form, status: s })}>
                      <FontAwesomeIcon icon={s === 'published' ? faEye : faEyeSlash} />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setDrawer(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : <><FontAwesomeIcon icon={faCheck} /> {form.status === 'published' ? 'Publish' : 'Save Draft'}</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
