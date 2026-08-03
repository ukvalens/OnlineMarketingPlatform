import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faArrowRight, faBolt } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import api from '../../api';
import './Services.css';

const ICONS = {
  'Social Media': '📱', 'Advertising': '🎯', 'SEO': '🔍',
  'Design': '🎨', 'Branding': '✨', 'Consulting': '💼', 'E-commerce': '🛒',
};

const TIER_ORDER = ['basic', 'standard', 'premium'];

const STATS = [
  { value: '200+', label: 'Businesses Served' },
  { value: '50+', label: 'Campaigns Launched' },
  { value: '48h', label: 'Average Launch Time' },
  { value: '98%', label: 'Satisfaction Rate' },
];

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/services', { signal: controller.signal })
      .then(({ data }) => setServices(data))
      .catch(err => { if (err.name !== 'CanceledError') {} })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const selected = services.find(s => s.id === active);
  const packages = selected?.packages
    ?.filter(p => p?.tier)
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)) || [];

  const handleSelect = (id) => setActive(prev => prev === id ? null : id);

  return (
    <Layout>
      {/* Hero */}
      <div className="svc-hero">
        <div className="container">
          <div className="svc-hero__content">
            <span className="section-label">What We Offer</span>
            <h1 className="section-title">Grow Your Business<br />with the Right Service</h1>
            <p className="section-subtitle">Everything your business needs to succeed online — social media, ads, branding, and more. All in one place, priced in RWF.</p>
            <div className="svc-hero__actions">
              <Link to="/contact" className="btn btn-accent btn-lg">Get a Free Quote</Link>
              <a href="#services" className="btn btn-outline-white btn-lg">Browse Services</a>
            </div>
          </div>
          <div className="svc-hero__stats">
            {STATS.map(({ value, label }) => (
              <div key={label} className="svc-hero__stat">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services grid */}
      <section className="section" id="services">
        <div className="container">
          <div className="svc-section-head text-center">
            <span className="section-label">Our Services</span>
            <h2 className="section-title">Choose a Service to Get Started</h2>
            <p className="section-subtitle">Click any service to see available packages and pricing.</p>
          </div>

          {loading ? (
            <div className="svc-grid">
              {[...Array(7)].map((_, i) => <div key={i} className="svc-skeleton" />)}
            </div>
          ) : (
            <>
              <div className="svc-grid">
                {services.map(s => (
                  <button
                    key={s.id}
                    className={`svc-card${active === s.id ? ' svc-card--active' : ''}`}
                    onClick={() => handleSelect(s.id)}
                  >
                    <div className="svc-card__icon">{ICONS[s.category] || '🚀'}</div>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                    <span className="svc-card__cta">
                      {active === s.id ? 'Hide packages' : 'View packages'} <FontAwesomeIcon icon={faArrowRight} />
                    </span>
                  </button>
                ))}
              </div>

              {/* Expanded packages panel */}
              {selected && (
                <div className="svc-panel">
                  <div className="svc-panel__header">
                    <div className="svc-panel__icon">{ICONS[selected.category] || '🚀'}</div>
                    <div>
                      <h2>{selected.name}</h2>
                      <p>{selected.description}</p>
                    </div>
                  </div>

                  {packages.length > 0 ? (
                    <div className="svc-packages">
                      {packages.map(pkg => (
                        <div key={pkg.id} className={`svc-package svc-package--${pkg.tier}`}>
                          {pkg.tier === 'standard' && (
                            <div className="svc-package__badge"><FontAwesomeIcon icon={faBolt} /> Most Popular</div>
                          )}
                          <div className="svc-package__tier">{pkg.tier.charAt(0).toUpperCase() + pkg.tier.slice(1)}</div>
                          <div className="svc-package__price">
                            <strong>RWF {Number(pkg.price).toLocaleString()}</strong>
                            <span>/ project</span>
                          </div>
                          {pkg.delivery_days && (
                            <div className="svc-package__delivery">⏱ {pkg.delivery_days} days delivery</div>
                          )}
                          {pkg.features && (
                            <ul className="svc-package__features">
                              {pkg.features.split(',').map(f => (
                                <li key={f}><FontAwesomeIcon icon={faCheck} />{f.trim()}</li>
                              ))}
                            </ul>
                          )}
                          <Link
                            to={`/contact?service=${encodeURIComponent(selected.name)}&tier=${pkg.tier}`}
                            className={`btn svc-package__cta ${pkg.tier === 'standard' ? 'btn-primary' : 'btn-outline'}`}
                          >
                            Get Started
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="svc-no-packages">
                      <p>Custom pricing available for this service.</p>
                      <Link to="/contact" className="btn btn-primary">Request a Quote</Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <div className="svc-cta">
        <div className="container">
          <div className="svc-cta__inner">
            <div>
              <h2 className="section-title" style={{ color: 'white' }}>Not sure which package fits?</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)' }}>Talk to us — we'll recommend the right plan for your budget and goals.</p>
            </div>
            <div className="svc-cta__actions">
              <Link to="/contact" className="btn btn-accent btn-lg">Get a Free Consultation</Link>
              <Link to="/about" className="btn btn-outline-white btn-lg">Learn About Us</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
