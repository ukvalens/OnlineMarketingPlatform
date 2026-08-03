import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faUser, faMagnifyingGlass, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import api from '../../api';
import './Blog.css';

const GRADIENTS = ['linear-gradient(135deg,#0057B8,#60a5fa)','linear-gradient(135deg,#00A86B,#4ade80)','linear-gradient(135deg,#7c3aed,#a78bfa)','linear-gradient(135deg,#f59e0b,#fcd34d)','linear-gradient(135deg,#ef4444,#f87171)','linear-gradient(135deg,#0891b2,#67e8f9)'];
const EMOJIS = ['📊','📱','💡','🎯','🚀','✨'];

const PLACEHOLDERS = [
  { slug:'trends-2025', title:'5 Digital Marketing Trends Shaping Rwanda in 2025', excerpt:'From mobile-first strategies to influencer marketing — here\'s what\'s working right now for Rwandan businesses.', author:'Admin', published_at:'2025-06-01' },
  { slug:'facebook-growth', title:'How to Grow Your Business on Facebook in Rwanda', excerpt:'A practical guide to building an engaged audience and converting followers into paying customers.', author:'Admin', published_at:'2025-05-20' },
  { slug:'digital-presence', title:'Why Every Rwandan Business Needs a Digital Presence', excerpt:'The internet economy is growing fast. Here\'s how to position your brand for success online.', author:'Admin', published_at:'2025-05-10' },
  { slug:'seo-basics', title:'SEO Basics for Small Businesses in Rwanda', excerpt:'Simple steps to get your website found on Google without spending a fortune on ads.', author:'Admin', published_at:'2025-04-28' },
  { slug:'momo-payments', title:'Accepting Mobile Money Payments Online in Rwanda', excerpt:'How to integrate MTN MoMo and Airtel Money into your e-commerce store.', author:'Admin', published_at:'2025-04-15' },
  { slug:'branding-guide', title:'The Complete Branding Guide for Rwandan Startups', excerpt:'Everything you need to know about building a memorable brand identity from scratch.', author:'Admin', published_at:'2025-04-01' },
];

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  useEffect(() => {
    api.get('/blog?limit=50').then(({ data }) => setPosts(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const display = posts.length > 0 ? posts : PLACEHOLDERS;
  const filtered = display.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;

  return (
    <Layout>
      <div className="page-hero">
        <div className="container">
          <span className="section-label">Resources</span>
          <h1 className="section-title">Blog & Insights</h1>
          <p className="section-subtitle">Marketing tips, strategies, and news to help your business grow online in Rwanda.</p>
          <div className="blog-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input placeholder="Search articles..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="blog-page__grid">
              {[...Array(6)].map((_, i) => <div key={i} className="blog-skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 0', color:'var(--text-muted)' }}>
              <p style={{ fontSize:18 }}>No articles found for "{search}"</p>
            </div>
          ) : (
            <>
              <div className="blog-page__grid">
                {paginated.map((post, i) => (
                  <Link to={`/blog/${post.slug}`} key={post.slug + i} className="blog-page__card card">
                    <div className="blog-page__card-img" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                      {post.cover_image
                        ? <img src={`http://localhost:5000${post.cover_image}`} alt={post.title} />
                        : <span>{EMOJIS[i % EMOJIS.length]}</span>
                      }
                    </div>
                    <div className="blog-page__card-body">
                      <div className="blog-page__meta">
                        <span><FontAwesomeIcon icon={faCalendar} />{new Date(post.published_at).toLocaleDateString('en-RW',{month:'short',day:'numeric',year:'numeric'})}</span>
                        <span><FontAwesomeIcon icon={faUser} />{post.author}</span>
                      </div>
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      <span className="blog-page__read">Read article <FontAwesomeIcon icon={faArrowRight} /></span>
                    </div>
                  </Link>
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign:'center', marginTop:40 }}>
                  <button className="btn btn-outline" onClick={() => setPage(p => p + 1)}>Load More Articles</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
