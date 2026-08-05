import { useEffect, useState, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faXmark, faImage,
  faEye, faEyeSlash, faStar, faCheck,
  faCircleCheck, faCircleXmark, faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import api, { getImageUrl } from '../../api';
import './orders.css';
import './admin-content.css';

const TABS = ['Portfolio', 'Services', 'Testimonials', 'Team'];
const TIERS = ['basic', 'standard', 'premium'];
const fmt = (n) => Number(n).toLocaleString();

const emptyPortfolio  = { title: '', description: '', client_name: '', category: '', is_published: false };
const emptyService    = { name: '', description: '', category: '', image_url: '' };
const emptyPkg        = { tier: 'basic', price: '', features: '', delivery_days: '' };
const emptyTestimonial = { client_name: '', company: '', content: '', rating: 5, is_published: false };
const emptyTeam = { name: '', role: '', bio: '', sort_order: '0', is_published: true };

/* ─── Toast ─── */
let _addToast = () => {};

function ToastStack() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  _addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    timers.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timers.current[id];
    }, 3500);
  }, []);

  const icon = { success: faCircleCheck, error: faCircleXmark, info: faCircleInfo };

  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <FontAwesomeIcon icon={icon[t.type]} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

const toast = {
  success: (msg) => _addToast(msg, 'success'),
  error:   (msg) => _addToast(msg, 'error'),
  info:    (msg) => _addToast(msg, 'info'),
};

/* ─── Main page ─── */
export default function AdminPortfolioPage() {
  const [tab, setTab] = useState('Portfolio');

  return (
    <DashboardLayout pageTitle="Content Management" pageSubtitle="Portfolio · Services · Testimonials">
      <ToastStack />
      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Portfolio'    && <PortfolioTab />}
      {tab === 'Services'     && <ServicesTab />}
      {tab === 'Testimonials' && <TestimonialsTab />}
      {tab === 'Team'         && <TeamTab />}
    </DashboardLayout>
  );
}

/* ══════════════════════════════════════════
   PORTFOLIO TAB
══════════════════════════════════════════ */
function PortfolioTab() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(emptyPortfolio);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/portfolio').catch(() => ({ data: [] }));
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(emptyPortfolio); setImageFile(null); setImagePreview(null); setModal({ mode: 'add' }); };
  const openEdit = (item) => {
    setForm({ title: item.title, description: item.description || '', client_name: item.client_name || '', category: item.category || '', is_published: item.is_published });
    setImageFile(null);
    setImagePreview(item.image_url ? getImageUrl(item.image_url) : null);
    setModal({ mode: 'edit', id: item.id, current_image: item.image_url });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (modal.mode === 'add') {
        await api.post('/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Portfolio item added.');
      } else {
        await api.put(`/portfolio/${modal.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Portfolio item updated.');
      }
      await load();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this portfolio item?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await api.delete(`/portfolio/${id}`);
      toast.success('Item deleted.');
    } catch {
      await load();
      toast.error('Delete failed.');
    }
  };

  const togglePublish = async (item) => {
    const next = !item.is_published;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: next } : i));
    try {
      const fd = new FormData();
      fd.append('is_published', next);
      await api.put(`/portfolio/${item.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(next ? 'Item published.' : 'Item unpublished.');
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: item.is_published } : i));
      toast.error('Update failed.');
    }
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
                    ? <img src={getImageUrl(item.image_url)} alt={item.title} />
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
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }} />
                  {imagePreview && (
                    <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                      <img src={imagePreview} alt="Preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(modal.current_image ? getImageUrl(modal.current_image) : null); }}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
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
  const [svcImageFile, setSvcImageFile] = useState(null);
  const [svcImagePreview, setSvcImagePreview] = useState(null);
  const [pkgModal, setPkgModal] = useState(null);
  const [pkgForm, setPkgForm]   = useState(emptyPkg);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/services').catch(() => ({ data: [] }));
    setServices(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAddSvc  = () => { setSvcForm(emptyService); setSvcImageFile(null); setSvcImagePreview(null); setSvcModal({ mode: 'add' }); };
  const openEditSvc = (s) => {
    setSvcForm({ name: s.name, description: s.description || '', category: s.category || '' });
    setSvcImageFile(null);
    setSvcImagePreview(s.image_url ? getImageUrl(s.image_url) : null);
    setSvcModal({ mode: 'edit', id: s.id, current_image: s.image_url });
  };

  const saveSvc = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(svcForm).forEach(([k, v]) => fd.append(k, v));
      if (svcImageFile) fd.append('image', svcImageFile);
      if (svcModal.mode === 'add') await api.post('/services', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.put(`/services/${svcModal.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(svcModal.mode === 'add' ? 'Service added.' : 'Service updated.');
      await load(); setSvcModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const toggleActive = async (s) => {
    const next = !s.is_active;
    setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: next } : x));
    try {
      const fd = new FormData();
      fd.append('is_active', next);
      await api.put(`/services/${s.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(next ? 'Service activated.' : 'Service deactivated.');
    } catch {
      setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: s.is_active } : x));
      toast.error('Update failed.');
    }
  };

  const openAddPkg  = (serviceId) => { setPkgForm(emptyPkg); setPkgModal({ mode: 'add', serviceId }); };
  const openEditPkg = (serviceId, pkg) => { setPkgForm({ tier: pkg.tier, price: pkg.price, features: pkg.features || '', delivery_days: pkg.delivery_days || '' }); setPkgModal({ mode: 'edit', serviceId, pkgId: pkg.id }); };

  const savePkg = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (pkgModal.mode === 'edit' && pkgModal.pkgId) {
        await api.put(`/services/${pkgModal.serviceId}/packages/${pkgModal.pkgId}`, pkgForm);
      } else {
        await api.post(`/services/${pkgModal.serviceId}/packages`, pkgForm);
      }
      toast.success('Package saved.');
      await load(); setPkgModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
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
                  {svc.image_url
                    ? <img src={getImageUrl(svc.image_url)} alt={svc.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🚀</div>
                  }
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
                            <button className="btn btn-outline btn-sm" onClick={() => { setPkgForm({ ...emptyPkg, tier }); setPkgModal({ mode: 'add', serviceId: svc.id }); }}>
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

      {svcModal && (
        <div className="modal-overlay" onClick={() => setSvcModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{svcModal.mode === 'add' ? 'Add Service' : 'Edit Service'}</h3>
              <button className="modal__close" onClick={() => setSvcModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={saveSvc}>
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
                <label>Image</label>
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setSvcImageFile(file);
                  setSvcImagePreview(URL.createObjectURL(file));
                }} />
                {svcImagePreview && (
                  <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                    <img src={svcImagePreview} alt="Preview" style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                    <button type="button" onClick={() => { setSvcImageFile(null); setSvcImagePreview(svcModal.current_image ? getImageUrl(svcModal.current_image) : null); }}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                )}
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

      {pkgModal && (
        <div className="modal-overlay" onClick={() => setPkgModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{pkgModal.mode === 'add' ? 'Add Package' : 'Edit Package'}</h3>
              <button className="modal__close" onClick={() => setPkgModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={savePkg}>
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
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(emptyTestimonial);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/contact/testimonials').catch(() => ({ data: [] }));
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(emptyTestimonial); setModal({ mode: 'add' }); };
  const openEdit = (t) => { setForm({ client_name: t.client_name, company: t.company || '', content: t.content, rating: t.rating, is_published: t.is_published }); setModal({ mode: 'edit', id: t.id }); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'add') await api.post('/contact/testimonials', form);
      else await api.put(`/contact/testimonials/${modal.id}`, form);
      toast.success(modal.mode === 'add' ? 'Testimonial added.' : 'Testimonial updated.');
      await load(); setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await api.delete(`/contact/testimonials/${id}`);
      toast.success('Testimonial deleted.');
    } catch {
      await load();
      toast.error('Delete failed.');
    }
  };

  const togglePublish = async (t) => {
    const next = !t.is_published;
    setItems(prev => prev.map(i => i.id === t.id ? { ...i, is_published: next } : i));
    try {
      await api.put(`/contact/testimonials/${t.id}`, { is_published: next });
      toast.success(next ? 'Testimonial published.' : 'Testimonial unpublished.');
    } catch {
      setItems(prev => prev.map(i => i.id === t.id ? { ...i, is_published: t.is_published } : i));
      toast.error('Update failed.');
    }
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

/* ════════════════════════════════════════════
   TEAM TAB
════════════════════════════════════════════ */
function TeamTab() {
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState(emptyTeam);
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/team/all').catch(() => ({ data: [] }));
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(emptyTeam); setPhotoFile(null); setPhotoPreview(null);
    setModal({ mode: 'add' });
  };

  const openEdit = (m) => {
    setForm({ name: m.name, role: m.role, bio: m.bio || '', sort_order: String(m.sort_order ?? 0), is_published: m.is_published });
    setPhotoFile(null);
    setPhotoPreview(m.photo_url ? getImageUrl(m.photo_url) : null);
    setModal({ mode: 'edit', id: m.id, current_photo: m.photo_url });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('photo', photoFile);
      if (modal.mode === 'add') await api.post('/team', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.put(`/team/${modal.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(modal.mode === 'add' ? 'Team member added.' : 'Team member updated.');
      await load(); setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team member?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await api.delete(`/team/${id}`);
      toast.success('Team member deleted.');
    } catch { await load(); toast.error('Delete failed.'); }
  };

  const togglePublish = async (m) => {
    const next = !m.is_published;
    setItems(prev => prev.map(i => i.id === m.id ? { ...i, is_published: next } : i));
    try {
      const fd = new FormData();
      fd.append('is_published', next);
      await api.put(`/team/${m.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(next ? 'Visible on About page.' : 'Hidden from About page.');
    } catch {
      setItems(prev => prev.map(i => i.id === m.id ? { ...i, is_published: m.is_published } : i));
      toast.error('Update failed.');
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <span className="content-count">{items.length} members</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><FontAwesomeIcon icon={faPlus} /> Add Member</button>
      </div>

      {loading ? <div className="dash-empty"><span className="spinner" style={{ margin: '0 auto' }} /></div> : (
        items.length === 0 ? (
          <div className="dash-empty"><span style={{ fontSize: 32 }}>👥</span><p>No team members yet.</p></div>
        ) : (
          <div className="team-admin-grid">
            {items.map(m => (
              <div key={m.id} className="team-admin-card">
                <div className="team-admin-card__photo">
                  {m.photo_url
                    ? <img src={getImageUrl(m.photo_url)} alt={m.name} />
                    : <div className="team-admin-card__initials">{m.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}</div>
                  }
                  <span className={`portfolio-card__badge ${m.is_published ? 'published' : 'draft'}`}>
                    {m.is_published ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="team-admin-card__body">
                  <strong>{m.name}</strong>
                  <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{m.role}</span>
                  {m.bio && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{m.bio}</p>}
                </div>
                <div className="portfolio-card__actions">
                  <button className="btn btn-outline btn-sm" onClick={() => togglePublish(m)} title={m.is_published ? 'Hide' : 'Show'}>
                    <FontAwesomeIcon icon={m.is_published ? faEyeSlash : faEye} />
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}><FontAwesomeIcon icon={faEdit} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}><FontAwesomeIcon icon={faTrash} /></button>
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
              <h3>{modal.mode === 'add' ? 'Add Team Member' : 'Edit Team Member'}</h3>
              <button className="modal__close" onClick={() => setModal(null)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <form className="modal__body" onSubmit={handleSave}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Job Title *</label>
                  <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required placeholder="e.g. Creative Director" />
                </div>
              </div>
              <div className="form-group">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }} />
                {photoPreview && (
                  <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                    <img src={photoPreview} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--border)', display: 'block' }} />
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(modal.current_photo ? getImageUrl(modal.current_photo) : null); }}
                      style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Short bio shown on the About page…" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group" style={{ maxWidth: 160 }}>
                <label>Display Order</label>
                <input type="number" min="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <label className="toggle-row">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                Show on About page
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