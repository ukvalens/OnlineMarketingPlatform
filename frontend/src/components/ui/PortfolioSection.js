import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import api from '../../api';
import './PortfolioSection.css';

export default function PortfolioSection() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/portfolio').then(({ data }) => setItems(data.slice(0, 6))).catch(() => {});
  }, []);

  // Fallback placeholder items when API has no data yet
  const display = items.length > 0 ? items : PLACEHOLDERS;

  return (
    <section className="section portfolio-section">
      <div className="container">
        <div className="portfolio-section__header">
          <div>
            <span className="section-label">Our Work</span>
            <h2 className="section-title">Campaigns That Delivered</h2>
            <p className="section-subtitle">Real results for real businesses across Rwanda.</p>
          </div>
          <Link to="/portfolio" className="btn btn-outline">
            View All <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>

        <div className="portfolio-grid">
          {display.map((item, i) => (
            <div key={item.id || i} className={`portfolio-item${i === 0 ? ' portfolio-item--featured' : ''}`}>
              <div className="portfolio-item__img" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                {item.image_url
                  ? <img src={`http://localhost:5000${item.image_url}`} alt={item.title} />
                  : <span className="portfolio-item__emoji">{EMOJIS[i % EMOJIS.length]}</span>
                }
                <div className="portfolio-item__overlay">
                  <Link to="/portfolio" className="portfolio-item__btn"><FontAwesomeIcon icon={faUpRightFromSquare} /></Link>
                </div>
              </div>
              <div className="portfolio-item__info">
                {item.category && <span className="badge badge-primary">{item.category}</span>}
                <h4>{item.title}</h4>
                {item.client_name && <p>{item.client_name}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const GRADIENTS = [
  'linear-gradient(135deg,#0057B8,#60a5fa)',
  'linear-gradient(135deg,#00A86B,#4ade80)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#f59e0b,#fcd34d)',
  'linear-gradient(135deg,#ef4444,#f87171)',
  'linear-gradient(135deg,#0891b2,#67e8f9)',
];

const EMOJIS = ['📱','🎯','🎨','✨','💼','🛒'];

const PLACEHOLDERS = [
  { title: 'Kigali Restaurant Social Media Campaign', category: 'Social Media', client_name: 'Nyamirambo Café' },
  { title: 'E-commerce Brand Launch', category: 'Branding', client_name: 'RwandaShop' },
  { title: 'Google Ads for Tech Startup', category: 'Advertising', client_name: 'TechHub Kigali' },
  { title: 'Logo & Identity Design', category: 'Design', client_name: 'Umutima Finance' },
  { title: 'Instagram Growth Strategy', category: 'Social Media', client_name: 'Kigali Fashion' },
  { title: 'SEO & Website Promotion', category: 'SEO', client_name: 'Safari Tours RW' },
];
