import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faPlay } from '@fortawesome/free-solid-svg-icons';
import './Hero.css';

const STATS = [
  { value: '200+', label: 'Clients Served' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '5+', label: 'Years Experience' },
  { value: '50+', label: 'Campaigns Launched' },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <div className="hero__badge">
            <span className="badge badge-accent">🇷🇼 Rwanda's #1 Digital Agency</span>
          </div>

          <h1 className="hero__title">
            Grow Your Business<br />
            <span>Online in Rwanda</span>
          </h1>

          <p className="hero__subtitle">
            We help small businesses, startups, and entrepreneurs reach more customers through
            social media marketing, digital advertising, branding, and web promotion.
          </p>

          <div className="hero__cta">
            <Link to="/contact" className="btn btn-primary btn-lg">
              Get a Free Quote <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <Link to="/portfolio" className="btn btn-outline-white btn-lg hero__play">
              <span className="play-icon"><FontAwesomeIcon icon={faPlay} style={{ fontSize: 12 }} /></span>
              View Our Work
            </Link>
          </div>

          <div className="hero__trust">
            <div className="hero__avatars">
              {['A','B','C','D'].map((l) => (
                <div key={l} className="hero__avatar">{l}</div>
              ))}
            </div>
            <p><strong>200+ businesses</strong> trust us to grow their brand</p>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__card hero__card--main">
            <div className="hcard__header">
              <div className="hcard__dot green" />
              <span>Campaign Performance</span>
            </div>
            <div className="hcard__chart">
              {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                <div key={i} className="hcard__bar" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <p className="hcard__label">↑ 42% reach increase this month</p>
          </div>

          <div className="hero__card hero__card--sm hero__card--top">
            <div className="hcard__icon">📱</div>
            <div>
              <strong>Social Media</strong>
              <p>+1.2K followers</p>
            </div>
          </div>

          <div className="hero__card hero__card--sm hero__card--bottom">
            <div className="hcard__icon">🎯</div>
            <div>
              <strong>Ad Campaigns</strong>
              <p>3.8x ROI average</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__stats">
        <div className="container">
          <div className="hero__stats-grid">
            {STATS.map(({ value, label }) => (
              <div key={label} className="hero__stat">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
