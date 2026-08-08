import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import api from '../../api';
import './Testimonials.css';

const FALLBACK = [
  { client_name: 'Jean-Pierre Habimana', company: 'Kigali Bakery', content: 'Our Facebook page went from 200 to 5,000 followers in 3 months. The team is professional and truly understands the local market.', rating: 5 },
  { client_name: 'Amina Uwase', company: 'Umutima Finance', content: 'The branding package transformed our image completely. Clients now recognize us immediately. Worth every franc.', rating: 5 },
  { client_name: 'Eric Nkurunziza', company: 'TechHub Kigali', content: 'Google Ads campaign brought us 3x more leads in the first month. Transparent reporting and great communication throughout.', rating: 5 },
];

export default function Testimonials() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/contact/testimonials').then(({ data }) => setItems(data)).catch(() => {});
  }, []);

  const display = items.length > 0 ? items : FALLBACK;

  return (
    <section className="section testimonials">
      <div className="container">
        <div className="text-center" style={{ marginBottom: '56px' }}>
          <span className="section-label">Client Stories</span>
          <h2 className="section-title">What Our Clients Say</h2>
          <p className="section-subtitle">Don't take our word for it — hear from businesses we've helped grow.</p>
        </div>

        <div className="testimonials__grid">
          {display.map((t, i) => (
            <div key={i} className="testimonial card">
              <div className="testimonial__stars">
                {[...Array(t.rating || 5)].map((_, j) => <FontAwesomeIcon key={j} icon={faStar} style={{ color: '#f59e0b', fontSize: 14 }} />)}
              </div>
              <p className="testimonial__content">"{t.content}"</p>
              <div className="testimonial__author">
                <div className="testimonial__avatar">
                  {t.client_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <strong>{t.client_name}</strong>
                  {t.company && <span>{t.company}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
