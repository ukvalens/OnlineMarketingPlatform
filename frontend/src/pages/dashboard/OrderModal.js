import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faArrowRight, faArrowLeft, faPaperPlane, faBolt } from '@fortawesome/free-solid-svg-icons';
import api from '../../api';
import './orders.css';
import './order-modal.css';

const TIER_ORDER = ['basic', 'standard', 'premium'];

const GOALS = ['Brand Awareness', 'Lead Generation', 'Sales / Conversions', 'Community Growth', 'Website Traffic', 'Product Launch'];
const PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'Twitter / X', 'LinkedIn', 'Google Ads', 'Website'];

const STEPS = ['Service & Package', 'Project Details', 'Review & Submit'];

const empty = () => ({
  service_id: '', package_id: '',
  business_name: '', industry: '', website: '',
  goals: [], platforms: [], target_audience: '',
  budget: '', deadline: '', content_ready: '', notes: '',
});

export default function OrderModal({ services = [], preServiceId = '', prePackageId = '', onClose, onSuccess }) {
  const [step, setStep] = useState(() => preServiceId ? 1 : 0);
  const [form, setForm] = useState(() => ({ ...empty(), service_id: preServiceId, package_id: prePackageId }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));

  const selectedService = services.find(s => s.id === form.service_id);
  const packages = selectedService?.packages
    ?.filter(p => p?.tier)
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)) || [];
  const selectedPkg = packages.find(p => p.id === form.package_id);

  const canNext = () => {
    if (step === 0) return !!form.service_id;
    if (step === 1) return !!form.business_name.trim();
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const notes = [
        `Business: ${form.business_name}`,
        form.industry        && `Industry: ${form.industry}`,
        form.website         && `Website/Social: ${form.website}`,
        form.goals.length    && `Goals: ${form.goals.join(', ')}`,
        form.platforms.length && `Platforms: ${form.platforms.join(', ')}`,
        form.target_audience && `Target Audience: ${form.target_audience}`,
        form.budget          && `Budget Range: ${form.budget}`,
        form.deadline        && `Deadline: ${form.deadline}`,
        form.content_ready   && `Content Ready: ${form.content_ready}`,
        form.notes           && `Additional Notes: ${form.notes}`,
      ].filter(Boolean).join('\n');

      await api.post('/orders', {
        service_id: form.service_id,
        package_id: form.package_id || undefined,
        notes,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal om" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal__header">
          <div className="om__header-left">
            <h3>Request a Service</h3>
            <div className="om__steps">
              {STEPS.map((s, i) => (
                <div key={s} className={`om__step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                  <span className="om__step-dot">{i < step ? '✓' : i + 1}</span>
                  <span className="om__step-label">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="modal__close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        </div>

        <div className="modal__body om__body">

          {/* ── Step 0: Service & Package ── */}
          {step === 0 && (
            <div className="om__section">
              <div className="form-group">
                <label>Service *</label>
                <div className="om__service-grid">
                  {services.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`om__service-card${form.service_id === s.id ? ' selected' : ''}`}
                      onClick={() => set('service_id', s.id) || set('package_id', '')}
                    >
                      <strong>{s.name}</strong>
                      <span>{s.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {packages.length > 0 && (
                <div className="form-group">
                  <label>Package <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — skip to request custom quote)</span></label>
                  <div className="om__pkg-grid">
                    {packages.map(p => (
                      <div
                        key={p.id}
                        className={`om__pkg-card om__pkg-card--${p.tier}${form.package_id === p.id ? ' selected' : ''}`}
                        onClick={() => set('package_id', form.package_id === p.id ? '' : p.id)}
                      >
                        {p.tier === 'standard' && <div className="om__pkg-badge"><FontAwesomeIcon icon={faBolt} /> Popular</div>}
                        <div className="om__pkg-tier">{p.tier.charAt(0).toUpperCase() + p.tier.slice(1)}</div>
                        <div className="om__pkg-price">RWF {Number(p.price).toLocaleString()}</div>
                        {p.delivery_days && <div className="om__pkg-days">⏱ {p.delivery_days} days</div>}
                        {p.features && (
                          <ul className="om__pkg-features">
                            {p.features.split(',').slice(0, 4).map(f => <li key={f}>✓ {f.trim()}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Project Details ── */}
          {step === 1 && (
            <div className="om__section">
              <div className="form-row">
                <div className="form-group">
                  <label>Business / Brand Name *</label>
                  <input type="text" placeholder="e.g. Kigali Fresh Market"
                    value={form.business_name} onChange={e => set('business_name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <select value={form.industry} onChange={e => set('industry', e.target.value)}>
                    <option value="">Select industry…</option>
                    {['Retail & E-commerce','Food & Beverage','Health & Wellness','Education','Real Estate',
                      'Finance & Banking','Technology','Agriculture','Tourism & Hospitality','NGO / Non-profit','Other'].map(i =>
                      <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Website / Social Media URL</label>
                <input type="url" placeholder="https://" value={form.website} onChange={e => set('website', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Campaign Goals <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(select all that apply)</span></label>
                <div className="om__chip-grid">
                  {GOALS.map(g => (
                    <button key={g} type="button"
                      className={`om__chip${form.goals.includes(g) ? ' selected' : ''}`}
                      onClick={() => toggle('goals', g)}>{g}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Preferred Platforms</label>
                <div className="om__chip-grid">
                  {PLATFORMS.map(p => (
                    <button key={p} type="button"
                      className={`om__chip${form.platforms.includes(p) ? ' selected' : ''}`}
                      onClick={() => toggle('platforms', p)}>{p}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Target Audience</label>
                <input type="text" placeholder="e.g. Young professionals in Kigali aged 18–35"
                  value={form.target_audience} onChange={e => set('target_audience', e.target.value)} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget Range (RWF)</label>
                  <select value={form.budget} onChange={e => set('budget', e.target.value)}>
                    <option value="">Select range…</option>
                    {['Under 50,000','50,000 – 150,000','150,000 – 500,000','500,000 – 1,000,000','Above 1,000,000'].map(b =>
                      <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Expected Start / Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Do you have content ready? (logos, photos, copy)</label>
                <div className="om__radio-group">
                  {['Yes, fully ready', 'Partially ready', 'No — need help creating it'].map(opt => (
                    <label key={opt} className="om__radio">
                      <input type="radio" name="content_ready" value={opt}
                        checked={form.content_ready === opt} onChange={() => set('content_ready', opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea rows={3} placeholder="Any specific goals, competitors, brand guidelines, or other details…"
                  value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === 2 && (
            <div className="om__section om__review">
              {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}

              <div className="om__review-block">
                <div className="om__review-label">Service</div>
                <div className="om__review-value">{selectedService?.name || '—'}</div>
              </div>
              <div className="om__review-block">
                <div className="om__review-label">Package</div>
                <div className="om__review-value">
                  {selectedPkg
                    ? <>{selectedPkg.tier.charAt(0).toUpperCase() + selectedPkg.tier.slice(1)} — <strong>RWF {Number(selectedPkg.price).toLocaleString()}</strong> · {selectedPkg.delivery_days} days</>
                    : 'Custom quote requested'}
                </div>
              </div>
              {form.business_name && <div className="om__review-block"><div className="om__review-label">Business</div><div className="om__review-value">{form.business_name}{form.industry ? ` · ${form.industry}` : ''}</div></div>}
              {form.website      && <div className="om__review-block"><div className="om__review-label">Website / Social</div><div className="om__review-value">{form.website}</div></div>}
              {form.goals.length > 0 && <div className="om__review-block"><div className="om__review-label">Goals</div><div className="om__review-value">{form.goals.join(', ')}</div></div>}
              {form.platforms.length > 0 && <div className="om__review-block"><div className="om__review-label">Platforms</div><div className="om__review-value">{form.platforms.join(', ')}</div></div>}
              {form.target_audience && <div className="om__review-block"><div className="om__review-label">Target Audience</div><div className="om__review-value">{form.target_audience}</div></div>}
              {form.budget       && <div className="om__review-block"><div className="om__review-label">Budget</div><div className="om__review-value">{form.budget}</div></div>}
              {form.deadline     && <div className="om__review-block"><div className="om__review-label">Deadline</div><div className="om__review-value">{form.deadline}</div></div>}
              {form.content_ready && <div className="om__review-block"><div className="om__review-label">Content Ready</div><div className="om__review-value">{form.content_ready}</div></div>}
              {form.notes        && <div className="om__review-block"><div className="om__review-label">Notes</div><div className="om__review-value">{form.notes}</div></div>}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="om__footer">
          {step > 0
            ? <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}><FontAwesomeIcon icon={faArrowLeft} /> Back</button>
            : <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          }
          {step < 2
            ? <button className="btn btn-primary" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
                Next <FontAwesomeIcon icon={faArrowRight} />
              </button>
            : <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting…' : <><FontAwesomeIcon icon={faPaperPlane} /> Submit Request</>}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
