import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import usePageView from '../../hooks/usePageView';
import api, { getImageUrl } from '../../api';
import './Portfolio.css';

const GRADIENTS = [
  'linear-gradient(135deg,#0057B8,#60a5fa)',
  'linear-gradient(135deg,#00A86B,#4ade80)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#f59e0b,#fcd34d)',
  'linear-gradient(135deg,#ef4444,#f87171)',
  'linear-gradient(135deg,#0891b2,#67e8f9)',
];
const EMOJIS = ['📱','🎯','🎨','✨','💼','🛒','📊','🚀'];

const PLACEHOLDERS = [
  { id:1, title:'Kigali Restaurant Social Media Campaign', category:'Social Media', client_name:'Nyamirambo Café', description:'Grew Facebook page from 200 to 5,000 followers in 3 months.' },
  { id:2, title:'E-commerce Brand Launch', category:'Branding', client_name:'RwandaShop', description:'Full brand identity including logo, colors, and packaging design.' },
  { id:3, title:'Google Ads for Tech Startup', category:'Advertising', client_name:'TechHub Kigali', description:'3x more leads in the first month with targeted Google Ads.' },
  { id:4, title:'Logo & Identity Design', category:'Design', client_name:'Umutima Finance', description:'Professional logo and brand guidelines for a financial services firm.' },
  { id:5, title:'Instagram Growth Strategy', category:'Social Media', client_name:'Kigali Fashion', description:'10K followers gained in 60 days through organic content strategy.' },
  { id:6, title:'SEO & Website Promotion', category:'SEO', client_name:'Safari Tours RW', description:'First page Google rankings for 15 target keywords within 90 days.' },
  { id:7, title:'Product Launch Campaign', category:'Advertising', client_name:'Inzozi Foods', description:'Successful product launch reaching 50,000 people across Rwanda.' },
  { id:8, title:'Corporate Branding Package', category:'Branding', client_name:'Kigali Logistics', description:'Complete rebrand including logo, stationery, and digital assets.' },
];

export default function PortfolioPage() {
  usePageView();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    api.get('/portfolio').then(({ data }) => setItems(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const display = items.length > 0 ? items : PLACEHOLDERS;
  const categories = ['All', ...new Set(display.map(i => i.category).filter(Boolean))];
  const filtered = filter === 'All' ? display : display.filter(i => i.category === filter);
  const visible = filtered.slice(0, visibleCount);

  return (
    <Layout>
      <div className="page-hero">
        <div className="container">
          <span className="section-label">Our Work</span>
          <h1 className="section-title">Portfolio</h1>
          <p className="section-subtitle">Real campaigns. Real results. See what we've built for businesses across Rwanda.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Category filter */}
          <div className="portfolio-filters">
            {categories.map(cat => (
              <button key={cat} className={`filter-btn${filter === cat ? ' filter-btn--active' : ''}`} onClick={() => { setFilter(cat); setVisibleCount(3); }}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="portfolio-page__grid">
              {[...Array(6)].map((_, i) => <div key={i} className="portfolio-skeleton" />)}
            </div>
          ) : (
            <div className="portfolio-page__grid">
              {visible.map((item, i) => (
                <div key={item.id} className="portfolio-card">
                  <div className="portfolio-card__img" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                    {item.image_url
                      ? <img src={getImageUrl(item.image_url)} alt={item.title} />
                      : <span>{EMOJIS[i % EMOJIS.length]}</span>
                    }
                    <div className="portfolio-card__overlay">
                      <div className="portfolio-card__overlay-icon"><FontAwesomeIcon icon={faUpRightFromSquare} /></div>
                    </div>
                  </div>
                  <div className="portfolio-card__body">
                    {item.category && <span className="badge badge-primary">{item.category}</span>}
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                    {item.client_name && <span className="portfolio-card__client">Client: {item.client_name}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && visibleCount < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button className="btn btn-outline" onClick={() => setVisibleCount(v => v + 3)}>
                View More
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
