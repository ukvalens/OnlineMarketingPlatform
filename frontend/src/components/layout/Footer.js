import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

const SERVICES = ['Social Media Marketing', 'Digital Advertising', 'Website Promotion', 'Graphic Design', 'Branding Services', 'Business Consulting'];
const COMPANY = [
  { label: 'About Us', to: '/about' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
];

export default function Footer() {
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
            <p>Rwanda's trusted digital marketing partner. We help businesses grow online through creative strategies and measurable results.</p>
            <div className="footer__social">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><FontAwesomeIcon icon={faFacebook} /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><FontAwesomeIcon icon={faTwitter} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FontAwesomeIcon icon={faLinkedin} /></a>
            </div>
          </div>

          {/* Services */}
          <div className="footer__col">
            <h4>Services</h4>
            <ul>
              {SERVICES.map((s) => (
                <li key={s}><Link to="/services">{s}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="footer__col">
            <h4>Company</h4>
            <ul>
              {COMPANY.map(({ label, to }) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4>Contact</h4>
            <ul className="footer__contact">
              <li><FontAwesomeIcon icon={faMapPin} /><span>KG 123 St, Kigali, Rwanda</span></li>
              <li><FontAwesomeIcon icon={faPhone} /><a href="tel:+250780000000">+250 780 000 000</a></li>
              <li><FontAwesomeIcon icon={faEnvelope} /><a href="mailto:info@digitalmarketing.rw">info@digitalmarketing.rw</a></li>
            </ul>
            <Link to="/contact" className="btn btn-accent btn-sm" style={{ marginTop: '16px' }}>Get a Free Quote</Link>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} DigitalMarkRW. All rights reserved.</p>
          <p>Built for Rwanda's growing digital economy.</p>
        </div>
      </div>
    </footer>
  );
}
