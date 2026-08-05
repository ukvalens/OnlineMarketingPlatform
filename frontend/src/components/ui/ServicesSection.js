import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import api, { getImageUrl } from '../../api';
import { useLang } from '../../context/LangContext';
import './ServicesSection.css';

const ICONS = {
  'Social Media': '📱',
  'Advertising':  '🎯',
  'SEO':          '🔍',
  'Design':       '🎨',
  'Branding':     '✨',
  'Consulting':   '💼',
  'E-commerce':   '🛒',
};

export default function ServicesSection() {
  const { t } = useLang();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services')
      .then(({ data }) => setServices(data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section services-section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: '56px' }}>
          <span className="section-label">{t('services_label')}</span>
          <h2 className="section-title">{t('services_title')}</h2>
          <p className="section-subtitle">{t('services_subtitle')}</p>
        </div>

        {loading ? (
          <div className="services-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="service-card service-card--skeleton" />)}
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service) => (
              <div key={service.id} className="service-card card">
                <div className="service-card__icon">
                  {service.image_url
                    ? <img src={getImageUrl(service.image_url)} alt={service.name} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} />
                    : ICONS[service.category] || '🚀'
                  }
                </div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>

                {service.packages?.filter(p => p?.tier).length > 0 && (
                  <div className="service-card__tiers">
                    {service.packages.filter(p => p?.tier).map((pkg) => (
                      <div key={pkg.id} className={`tier-badge tier-badge--${pkg.tier}`}>
                        <FontAwesomeIcon icon={faCheck} style={{ fontSize: 11 }} />
                        {pkg.tier.charAt(0).toUpperCase() + pkg.tier.slice(1)}
                      </div>
                    ))}
                  </div>
                )}

                {service.packages?.filter(p => p?.tier).length > 0 && (
                  <div className="service-card__price">
                    {t('services_from')} <strong>RWF {Number(service.packages.filter(p => p?.tier)[0]?.price).toLocaleString()}</strong>
                  </div>
                )}

                <Link to="/services" className="service-card__link">
                  {t('services_learn')} <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 14 }} />
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="text-center" style={{ marginTop: '48px' }}>
          <Link to="/services" className="btn btn-outline">
            {t('services_view_all')} <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </div>
    </section>
  );
}
