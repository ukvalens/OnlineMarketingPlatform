import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faUser, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import DashboardLayout from '../dashboard/DashboardLayout';
import api, { getImageUrl } from '../../api';
import './Blog.css';

export default function BlogPostPage({ inDashboard = false }) {
  const Wrap = inDashboard
    ? ({ children }) => <DashboardLayout pageTitle="Blog Post">{children}</DashboardLayout>
    : Layout;
  const blogBase = inDashboard ? '/dashboard/blog' : '/blog';
  const contactPath = inDashboard ? '/dashboard/services' : '/contact';
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/blog/${slug}`)
      .then(({ data }) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <Wrap>
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span className="spinner" />
      </div>
    </Wrap>
  );

  if (notFound || !post) return (
    <Wrap>
      <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <p style={{ fontSize:18, color:'var(--text-muted)' }}>Article not found.</p>
        <Link to={blogBase} className="btn btn-primary">← Back to Blog</Link>
      </div>
    </Wrap>
  );

  return (
    <Wrap>
      <div className="blog-post">
        <div className="blog-post__hero" style={{ background:'linear-gradient(135deg,#003d8a,#0057B8)' }}>
          {post.cover_image && <img src={getImageUrl(post.cover_image)} alt={post.title} className="blog-post__hero-img" />}
          <div className="container blog-post__hero-content">
            <Link to={blogBase} className="blog-post__back"><FontAwesomeIcon icon={faArrowLeft} /> Back to Blog</Link>
            <h1>{post.title}</h1>
            <div className="blog-post__meta">
              <span><FontAwesomeIcon icon={faCalendar} />{new Date(post.published_at).toLocaleDateString('en-RW',{month:'long',day:'numeric',year:'numeric'})}</span>
              <span><FontAwesomeIcon icon={faUser} />{post.author}</span>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="blog-post__body">
            {post.excerpt && <p className="blog-post__excerpt">{post.excerpt}</p>}
            <div className="blog-post__content" dangerouslySetInnerHTML={{ __html: post.body.replace(/\n/g, '<br/>') }} />
          </div>
          <div className="blog-post__footer">
            <Link to={blogBase} className="btn btn-outline"><FontAwesomeIcon icon={faArrowLeft} /> All Articles</Link>
            <Link to={contactPath} className="btn btn-primary">Get a Free Quote →</Link>
          </div>
        </div>
      </div>
    </Wrap>
  );
}
