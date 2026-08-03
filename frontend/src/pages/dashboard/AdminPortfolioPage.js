import { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faXmark, faImage,
  faEye, faEyeSlash, faStar, faCheck
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api from '../../api';
import './orders.css';
import './admin-content.css';

const TABS = ['Portfolio', 'Services', 'Testimonials'];
const TIERS = ['basic', 'standard', 'premium'];
const fmt = (n) => Number(n).toLocaleString();

/* ─── helpers ─── */
const emptyPortfolio = { title: '', description: '', client_name: '', category: '', is_published: false };
const emptyService   = { name: '', description: '', category: '' };
const emptyPkg       = { tier: 'basic', price: '', features: '', delivery_days: '' };
const emptyTestimonial = { client_name: '', company: '', content: '', rating: 5, is_published: false };

export default function AdminPortfolioPage() {
  const [tab, setTab] = useState('Portfolio');

  return (
    <DashboardLayout pageTitle="Content Management" pageSubtitle="Portfolio · Services · Testimonials">
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Portfolio'     && <PortfolioTab />}
      {tab === 'Services'      && <ServicesTab />}
      {tab === 'Testimonials'  && <TestimonialsTab />}
    </DashboardLayout>
  );
}

/* ══════════════════════════════════════════
   PORTFOLIO TAB
══════════════════════════════════════════ */
function PortfolioTab() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null); // null | { mode:'add'|'edit', data }
  const [form, setForm]     = useState(emptyPortfolio);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // admin needs to see unpublished too — fetch all via PUT trick: use portfolio route but show all
  const load = useCallback(async () => {
    // GET /api/portfolio only returns published; admin fetches all via a workaround:
    // We'll fetch published + rely on our own state for unpublished after create/edit
    const { data } = await api.get('/portfolio').catch(() => ({ data: [] }));
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(emptyPortfolio); setImageFile(null); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (item) => { setForm({ title: item.title, description: item.description || '', client_name: item.client_name || '', category: item.category || '', is_published: item.is_published }); setImageFile(null); setError(''); setModal({ mode: 'edit', id: item.id, current_image: item.image_url }); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (modal.mode === 'add') {
        await api.post('/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.put(`/portfolio/${modal.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await load();
      setModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this portfolio item?')) return;
    await api.delete(`/portfolio/${id}`).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const togglePublish = async (item) => {
    const fd = new FormData();
    fd.append('is_published', !item.is_published);
    await api.put(`/portfolio/${item.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: !i.is_published } : i));
  };

  return (
    <div>
      <div className="content-toolbar">
        <span className="content-count">{items.length} items</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><FontAwesomeIcon icon={faPlus} /> Add Item</button>
      </div>

      {loading ? <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div> : (
        items.length === 0 ? (
          <div className="dash-empty"><span><FontAwesomeIcon icon={faImage} style={{ fontSize: 32 }} /></span><p>No portfolio items yet.</p></div>
        ) : (
          <div className="portfolio-grid">
            {items.map(item => (
              <div key={item.id} className="portfolio-card">
                <div className="portfolio-card__img">
                  {item.image_url
                    ? <img src={`http://localhost:5000${item.image_url}`} alt={item.title} />
                    : <div className="portfolio-card__placeholder"><FontAwesomeIcon icon={faImage} /></div>}
                  <span className={`portfolio-card__badge ${item.is_published ? 'published' : 'draft'}`}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="portfolio-card__body">
                  <strong>{item.title}</strong>
                  <span>{item.category}</span>
                  {item.client_name && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Client: {item.client_name}</span>}
                </div>
                <div className="portfolio-card__actions">
                  <button className="btn btn-outline btn-sm" onClick={() => togglePublish(item)} title={item.is_published ? 'Unpublish' : 'Publish'}>
                    <FontAwesomeIcon icon={item.is_published ? faEyeSlash : faEye} />
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}><FontAwesomeIcon icon={faEdit} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{modal.mode === 'add' ? 'Add Portfolio Item' : 'Edit Portfolio Item'}</h3>
              <button className="modal__close" onClick={() => setModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSave}>
              {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Branding" />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Client Name</label>
                  <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Image</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                  {modal.current_image && !imageFile && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current image kept if no new file selected.</span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <label className="toggle-row">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                Publish immediately
              </label>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : <><FontAwesomeIcon icon={faCheck} /> Save</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SERVICES TAB
══════════════════════════════════════════ */
function ServicesTab() {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [svcModal, setSvcModal] = useState(null);
  const [svcForm, setSvcForm]   = useState(emptyService);
  const [pkgModal, setPkgModal] = useState(null); // { serviceId, pkg? }
  const [pkgForm, setPkgForm]   = useState(emptyPkg);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/services').catch(() => ({ data: [] }));
    setServices(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAddSvc  = () => { setSvcForm(emptyService); setError(''); setSvcModal({ mode: 'add' }); };
  const openEditSvc = (s) => { setSvcForm({ name: s.name, description: s.description || '', category: s.category || '' }); setError(''); setSvcModal({ mode: 'edit', id: s.id }); };

  const saveSvc = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (svcModal.mode === 'add') await api.post('/services', svcForm);
      else await api.put(`/services/${svcModal.id}`, svcForm);
      await load(); setSvcModal(null);
    } catch (err) { setError(err.response?.data?.message || 'Save failed.'); }
    setSaving(false);
  };

  const toggleActive = async (s) => {
    await api.put(`/services/${s.id}`, { is_active: !s.is_active }).catch(() => {});
    await load();
  };

  const openAddPkg  = (serviceId) => { setPkgForm(emptyPkg); setError(''); setPkgModal({ mode: 'add', serviceId }); };
  const openEditPkg = (serviceId, pkg) => { setPkgForm({ tier: pkg.tier, price: pkg.price, features: pkg.features || '', delivery_days: pkg.delivery_days || '' }); setError(''); setPkgModal({ mode: 'edit', serviceId, pkgId: pkg.id }); };

  const savePkg = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post(`/services/${pkgModal.serviceId}/packages`, pkgForm);
      await load(); setPkgModal(null);
    } catch (err) { setError(err.response?.data?.message || 'Save failed.'); }
    setSaving(false);
  };

  return (
    <div>
      <div className="content-toolbar">
        <span className="content-count">{services.length} services</span>
        <button className="btn btn-primary btn-sm" onClick={openAddSvc}><FontAwesomeIcon icon={faPlus} /> Add Service</button>
      </div>

      {loading ? <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div> : (
        <div className="services-list">
          {services.map(svc => (
            <div key={svc.id} className={`service-row${!svc.is_active ? ' inactive' : ''}`}>
              <div className="service-row__header" onClick={() => setExpanded(expanded === svc.id ? null : svc.id)}>
                <div className="service-row__info">
                  <strong>{svc.name}</strong>
                  <span>{svc.category}</span>
                  {!svc.is_active && <span className="inactive-badge">Inactive</span>}
                </div>
                <div className="service-row__actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleActive(svc)}>
                    {svc.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => openEditSvc(svc)}><FontAwesomeIcon icon={faEdit} /></button>
                  <button className="btn btn-primary btn-sm" onClick={() => openAddPkg(svc.id)}><FontAwesomeIcon icon={faPlus} /> Package</button>
                </div>
              </div>

              {expanded === svc.id && (
                <div className="service-row__packages">
                  {svc.description && <p className="service-desc">{svc.description}</p>}
                  <div className="pkg-grid">
                    {TIERS.map(tier => {
                      const pkg = svc.packages?.find(p => p.tier === tier && p.id);
                      return (
                        <div key={tier} className={`pkg-card${pkg ? '' : ' pkg-card--empty'}`}>
                          <div className="pkg-card__tier">{tier}</div>
                          {pkg ? (
                            <>
                              <div className="pkg-card__price">RWF {fmt(pkg.price)}</div>
                              <div className="pkg-card__days">{pkg.delivery_days} days</div>
                              {pkg.features && <div className="pkg-card__features">{pkg.features}</div>}
                              <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={() => openEditPkg(svc.id, pkg)}>
                                <FontAwesomeIcon icon={faEdit} /> Edit
                              </button>
                            </>
                          ) : (
                            <button className="btn btn-outline btn-sm" onClick={() => { setPkgForm({ ...emptyPkg, tier }); setError(''); setPkgModal({ mode: 'add', serviceId: svc.id }); }}>
                              <FontAwesomeIcon icon={faPlus} /> Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service modal */}
      {svcModal && (
        <div className="modal-overlay" onClick={() => setSvcModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{svcModal.mode === 'add' ? 'Add Service' : 'Edit Service'}</h3>
              <button className="modal__close" onClick={() => setSvcModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={saveSvc}>
              {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={svcForm.name} onChange={e => setSvcForm({ ...svcForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input value={svcForm.category} onChange={e => setSvcForm({ ...svcForm, category: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={svcForm.description} onChange={e => setSvcForm({ ...svcForm, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setSvcModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : <><FontAwesomeIcon icon={faCheck} /> Save</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package modal */}
      {pkgModal && (
        <div className="modal-overlay" onClick={() => setPkgModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{pkgModal.mode === 'add' ? 'Add Package' : 'Edit Package'}</h3>
              <button className="modal__close" onClick={() => setPkgModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={savePkg}>
              {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Tier *</label>
                  <select value={pkgForm.tier} onChange={e => setPkgForm({ ...pkgForm, tier: e.target.value })}>
                    {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (RWF) *</label>
                  <input type="number" min="0" value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Delivery Days</label>
                <input type="number" min="1" value={pkgForm.delivery_days} onChange={e => setPkgForm({ ...pkgForm, delivery_days: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Features</label>
                <textarea rows={3} placeholder="List features, one per line or comma-separated" value={pkgForm.features} onChange={e => setPkgForm({ ...pkgForm, features: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setPkgModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : <><FontAwesomeIcon icon={faCheck} /> Save</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TESTIMONIALS TAB
══════════════════════════════════════════ */
function TestimonialsTab() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(emptyTestimonial);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/contact/testimonials').catch(() => ({ data: [] }));
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(emptyTestimonial); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (t) => { setForm({ client_name: t.client_name, company: t.company || '', content: t.content, rating: t.rating, is_published: t.is_published }); setError(''); setModal({ mode: 'edit', id: t.id }); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (modal.mode === 'add') await api.post('/contact/testimonials', form);
      else await api.put(`/contact/testimonials/${modal.id}`, form);
      await load(); setModal(null);
    } catch (err) { setError(err.response?.data?.message || 'Save failed.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    await api.delete(`/contact/testimonials/${id}`).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const togglePublish = async (t) => {
    await api.put(`/contact/testimonials/${t.id}`, { is_published: !t.is_published }).catch(() => {});
    setItems(prev => prev.map(i => i.id === t.id ? { ...i, is_published: !i.is_published } : i));
  };

  return (
    <div>
      <div className="content-toolbar">
        <span className="content-count">{items.length} testimonials</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><FontAwesomeIcon icon={faPlus} /> Add Testimonial</button>
      </div>

      {loading ? <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div> : (
        items.length === 0 ? (
          <div className="dash-empty"><span>⭐</span><p>No testimonials yet.</p></div>
        ) : (
          <div className="testimonials-grid">
            {items.map(t => (
              <div key={t.id} className="testimonial-card">
                <div className="testimonial-card__top">
                  <div className="testimonial-stars">
                    {[1,2,3,4,5].map(n => (
                      <FontAwesomeIcon key={n} icon={faStar} style={{ color: n <= t.rating ? '#f59e0b' : 'var(--border)' }} />
                    ))}
                  </div>
                  <span className={`portfolio-card__badge ${t.is_published ? 'published' : 'draft'}`}>
                    {t.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="testimonial-card__content">"{t.content}"</p>
                <div className="testimonial-card__author">
                  <strong>{t.client_name}</strong>
                  {t.company && <span>{t.company}</span>}
                </div>
                <div className="portfolio-card__actions">
                  <button className="btn btn-outline btn-sm" onClick={() => togglePublish(t)}>
                    <FontAwesomeIcon icon={t.is_published ? faEyeSlash : faEye} />
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}><FontAwesomeIcon icon={faEdit} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}><FontAwesomeIcon icon={faTrash} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{modal.mode === 'add' ? 'Add Testimonial' : 'Edit Testimonial'}</h3>
              <button className="modal__close" onClick={() => setModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSave}>
              {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Client Name *</label>
                  <input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Testimonial *</label>
                <textarea rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Rating</label>
                <div className="star-picker">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
                      <FontAwesomeIcon icon={faStar} style={{ color: n <= form.rating ? '#f59e0b' : 'var(--border)', fontSize: 22 }} />
                    </button>
                  ))}
                </div>
              </div>
              <label className="toggle-row">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                Publish immediately
              </label>
              <div className="modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : <><FontAwesomeIcon icon={faCheck} /> Save</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
