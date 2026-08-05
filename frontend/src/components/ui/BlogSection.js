import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCalendar, faUser } from '@fortawesome/free-solid-svg-icons';
import api, { getImageUrl } from '../../api';
import './BlogSection.css';

const FALLBACK = [
  { slug: '#', title: '5 Digital Marketing Trends Shaping Rwanda in 2025', excerpt: 'From mobile-first strategies to influencer marketing — here\'s what\'s working right now.', author: 'Admin', published_at: '2025-06-01', category: 'Trends' },
  { slug: '#', title: 'How to Grow Your Business on Facebook in Rwanda', excerpt: 'A practical guide to building an engaged audience and converting followers into customers.', author: 'Admin', published_at: '2025-05-20', category: 'Social Media' },
  { slug: '#', title: 'Why Every Rwandan Business Needs a Digital Presence', excerpt: 'The internet economy is growing fast. Here\'s how to position your brand for success.', author: 'Admin', published_at: '2025-05-10', category: 'Strategy' },
];

export default function BlogSection() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get('/blog?limit=3').then(({ data }) => setPosts(data)).catch(() => {});
  }, []);

  const display = posts.length > 0 ? posts : FALLBACK;

  return (
    <section className="section blog-section">
      <div className="container">
        <div className="blog-section__header">
          <div>
            <span className="section-label">Resources</span>
            <h2 className="section-title">Marketing Tips & Insights</h2>
            <p className="section-subtitle">Free knowledge to help your business grow online.</p>
          </div>
          <Link to="/blog" className="btn btn-outline">All Articles <FontAwesomeIcon icon={faArrowRight} /></Link>
        </div>

        <div className="blog-grid">
          {display.map((post, i) => (
            <Link to={`/blog/${post.slug}`} key={post.slug + i} className="blog-card card">
              <div className="blog-card__img" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                {post.cover_image
                  ? <img src={getImageUrl(post.cover_image)} alt={post.title} />
                  : <span className="blog-card__emoji">{EMOJIS[i % EMOJIS.length]}</span>
                }
              </div>
              <div className="blog-card__body">
                <div className="blog-card__meta">
                  <span><FontAwesomeIcon icon={faCalendar} style={{ fontSize: 12 }} />{new Date(post.published_at).toLocaleDateString('en-RW', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span><FontAwesomeIcon icon={faUser} style={{ fontSize: 12 }} />{post.author}</span>
                </div>
                <h4>{post.title}</h4>
                <p>{post.excerpt}</p>
                <span className="blog-card__read">Read more <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 13 }} /></span>
              </div>
            </Link>
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
];
const EMOJIS = ['📊','📱','💡'];
