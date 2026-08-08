import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useLang } from '../../context/LangContext';
import './Hero.css';

export default function Hero() {
  const { t } = useLang();

  const STATS = [
    { value: '200+', labelKey: 'hero_stat_clients' },
    { value: '98%',  labelKey: 'hero_stat_satisfaction' },
    { value: '5+',   labelKey: 'hero_stat_years' },
    { value: '50+',  labelKey: 'hero_stat_campaigns' },
  ];

  return (
    <section className="hero">
      <div className="hero__bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <h1 className="hero__title">
            {t('hero_title_1')}<br />
            <span>{t('hero_title_2')}</span>
          </h1>

          <p className="hero__subtitle">{t('hero_subtitle')}</p>

          <div className="hero__cta">
            <Link to="/contact" className="btn btn-primary btn-lg">
              {t('hero_cta_quote')} <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <Link to="/portfolio" className="btn btn-outline-white btn-lg hero__play">
              <span className="play-icon"><FontAwesomeIcon icon={faPlay} style={{ fontSize: 12 }} /></span>
              {t('hero_cta_work')}
            </Link>
          </div>

          <div className="hero__trust">
            <div className="hero__avatars">
              {['A', 'B', 'C', 'D'].map((l) => (
                <div key={l} className="hero__avatar">{l}</div>
              ))}
            </div>
            <p><strong>200+</strong> {t('hero_trust')}</p>
          </div>
        </div>


      </div>

      <div className="hero__stats">
        <div className="container">
          <div className="hero__stats-grid">
            {STATS.map(({ value, labelKey }) => (
              <div key={labelKey} className="hero__stat">
                <strong>{value}</strong>
                <span>{t(labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
