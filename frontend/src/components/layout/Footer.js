import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { useLang } from '../../context/LangContext';
import './Footer.css';

const SERVICES = [
  'Social Media Marketing', 'Digital Advertising', 'Website Promotion',
  'Graphic Design', 'Branding Services', 'Business Consulting',
];

export default function Footer() {
  const { t } = useLang();

  const COMPANY = [
    { labelKey: 'footer_about',   to: '/about' },
    { labelKey: 'nav_portfolio',  to: '/portfolio' },
    { labelKey: 'nav_blog',       to: '/blog' },
    { labelKey: 'footer_contact', to: '/contact' },
    { labelKey: 'footer_privacy', to: '/privacy' },
    { labelKey: 'footer_terms',   to: '/terms' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="logo-icon">DM</span>
              <span>DigitalMark<span>RW</span></span>
            </div>
            <p>{t('footer_tagline')}</p>
            <div className="footer__social">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FontAwesomeIcon icon={faFacebook} /></a>
              <a href="https://twitter.com"  target="_blank" rel="noreferrer" aria-label="Twitter"><FontAwesomeIcon icon={faTwitter} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FontAwesomeIcon icon={faLinkedin} /></a>
            </div>
          </div>

          {/* Services */}
          <div className="footer__col">
            <h4>{t('footer_services')}</h4>
            <ul>
              {SERVICES.map((s) => (
                <li key={s}><Link to="/services">{s}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="footer__col">
            <h4>{t('footer_company')}</h4>
            <ul>
              {COMPANY.map(({ labelKey, to }) => (
                <li key={to}><Link to={to}>{t(labelKey)}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4>{t('footer_contact')}</h4>
            <ul className="footer__contact">
              <li><FontAwesomeIcon icon={faMapPin} /><span>KG 123 St, Kigali, Rwanda</span></li>
              <li><FontAwesomeIcon icon={faPhone} /><a href="tel:+250780000000">+250 780 000 000</a></li>
              <li><FontAwesomeIcon icon={faEnvelope} /><a href="mailto:info@digitalmarketing.rw">info@digitalmarketing.rw</a></li>
            </ul>
            <Link to="/contact" className="btn btn-accent btn-sm" style={{ marginTop: '16px' }}>
              {t('footer_quote')}
            </Link>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} DigitalMarkRW. {t('footer_rights')}</p>
          <p>{t('footer_built')}</p>
        </div>
      </div>
    </footer>
  );
}
