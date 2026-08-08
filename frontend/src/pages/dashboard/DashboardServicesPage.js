import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faArrowRight, faBolt } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from './DashboardLayout';
import OrderModal from './OrderModal';
import api, { getImageUrl } from '../../api';
import '../public/Services.css';

const ICONS = {
  'Social Media': '📱', 'Advertising': '🎯', 'SEO': '🔍',
  'Design': '🎨', 'Branding': '✨', 'Consulting': '💼', 'E-commerce': '🛒',
};

const TIER_ORDER = ['basic', 'standard', 'premium'];

export default function DashboardServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [modal, setModal] = useState(null); // { service_id, package_id }
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/services')
      .then(({ data }) => setServices(data))
      .finally(() => setLoading(false));
  }, []);

  const selected = services.find(s => s.id === active);
  const packages = selected?.packages
    ?.filter(p => p?.tier)
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)) || [];

  const handleSuccess = () => {
    setModal(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <DashboardLayout pageTitle="Services" pageSubtitle="Browse available services and packages">

      {success && (
        <div className="auth-form__alert auth-form__alert--success" style={{ marginBottom: 20 }}>
          ✅ Order submitted! Our team will review it and get back to you shortly.
        </div>
      )}

      <section id="services">
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
                  onClick={() => setActive(prev => prev === s.id ? null : s.id)}
                >
                  <div className="svc-card__icon">
                    {s.image_url
                      ? <img src={getImageUrl(s.image_url)} alt={s.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                      : ICONS[s.category] || '🚀'
                    }
                  </div>
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <span className="svc-card__cta">
                    {active === s.id ? 'Hide packages' : 'View packages'} <FontAwesomeIcon icon={faArrowRight} />
                  </span>
                </button>
              ))}
            </div>

            {selected && (
              <div className="svc-panel">
                <div className="svc-panel__header">
                  <div className="svc-panel__icon">
                    {selected.image_url
                      ? <img src={getImageUrl(selected.image_url)} alt={selected.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                      : ICONS[selected.category] || '🚀'
                    }
                  </div>
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
                        <button
                          className={`btn svc-package__cta ${pkg.tier === 'standard' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setModal({ service_id: selected.id, package_id: pkg.id })}
                        >
                          Order Now
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="svc-no-packages">
                    <p>Custom pricing available for this service.</p>
                    <button className="btn btn-primary" onClick={() => setModal({ service_id: selected.id, package_id: '' })}>
                      Request a Quote
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {modal && (
        <OrderModal
          services={services}
          preServiceId={modal.service_id}
          prePackageId={modal.package_id}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

    </DashboardLayout>
  );
}
