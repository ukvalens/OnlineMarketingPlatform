import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faEye, faHeart, faTrophy, faUsers, faChartLine } from '@fortawesome/free-solid-svg-icons';
import Layout from '../../components/layout/Layout';
import usePageView from '../../hooks/usePageView';
import './About.css';

const TEAM = [
  { name: 'Jean-Claude Niyonzima', role: 'CEO & Founder', emoji: '👨‍💼', bio: '10+ years in digital marketing across East Africa.' },
  { name: 'Amina Uwimana', role: 'Creative Director', emoji: '👩‍🎨', bio: 'Award-winning designer with a passion for Rwandan brands.' },
  { name: 'Eric Habimana', role: 'Head of Digital Ads', emoji: '👨‍💻', bio: 'Google & Meta certified ads specialist.' },
  { name: 'Grace Mukamana', role: 'Social Media Manager', emoji: '👩‍💼', bio: 'Grew 50+ brand accounts to 10K+ followers.' },
];

const VALUES = [
  { icon: <FontAwesomeIcon icon={faBullseye} />, title: 'Results First', desc: 'Every strategy is tied to measurable outcomes — reach, leads, and revenue.' },
  { icon: <FontAwesomeIcon icon={faHeart} />, title: 'Client-Centered', desc: 'We treat every client\'s business like our own, with full dedication.' },
  { icon: <FontAwesomeIcon icon={faTrophy} />, title: 'Excellence', desc: 'We hold ourselves to the highest standards in everything we deliver.' },
  { icon: <FontAwesomeIcon icon={faUsers} />, title: 'Community', desc: 'We believe in growing Rwanda\'s digital economy together.' },
];

export default function AboutPage() {
  usePageView();
  return (
    <Layout>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <span className="section-label">Who We Are</span>
          <h1 className="section-title">About DigitalMarkRW</h1>
          <p className="section-subtitle">Rwanda's dedicated digital marketing partner — helping businesses grow online since 2019.</p>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="section">
        <div className="container">
          <div className="about__mv-grid">
            <div className="about__mv-card about__mv-card--mission">
              <div className="about__mv-icon"><FontAwesomeIcon icon={faBullseye} /></div>
              <h3>Our Mission</h3>
              <p>To empower every Rwandan business — from street-side shops to growing startups — with affordable, effective digital marketing that drives real growth.</p>
            </div>
            <div className="about__mv-card about__mv-card--vision">
              <div className="about__mv-icon"><FontAwesomeIcon icon={faEye} /></div>
              <h3>Our Vision</h3>
              <p>To be the most trusted digital marketing platform in East Africa, connecting businesses with their customers through creativity and technology.</p>
            </div>
            <div className="about__mv-card about__mv-card--impact">
              <div className="about__mv-icon"><FontAwesomeIcon icon={faChartLine} /></div>
              <h3>Our Impact</h3>
              <p>200+ businesses served, 50+ campaigns launched, and millions of Rwandans reached through our clients' brands.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="section about__story-section">
        <div className="container">
          <div className="about__story">
            <div>
              <span className="section-label">Our Story</span>
              <h2 className="section-title">Built in Rwanda, for Rwanda</h2>
              <p>DigitalMarkRW was founded in Kigali in 2019 with a simple belief: every business deserves access to world-class digital marketing, regardless of size or budget.</p>
              <p style={{ marginTop: 16 }}>We started by helping local restaurants and shops build their Facebook presence. Today, we serve startups, NGOs, financial institutions, and e-commerce brands across Rwanda — offering everything from social media management to full brand identity creation.</p>
              <p style={{ marginTop: 16 }}>We are proud to be a 100% Rwandan team, deeply rooted in the local market and committed to Rwanda's Vision 2050 digital transformation goals.</p>
              <Link to="/contact" className="btn btn-primary" style={{ marginTop: 28 }}>Work With Us</Link>
            </div>
            <div className="about__story-visual">
              <div className="about__stat-card"><strong>200+</strong><span>Clients Served</span></div>
              <div className="about__stat-card"><strong>50+</strong><span>Campaigns</span></div>
              <div className="about__stat-card"><strong>5+</strong><span>Years Experience</span></div>
              <div className="about__stat-card"><strong>98%</strong><span>Satisfaction Rate</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-label">What Drives Us</span>
            <h2 className="section-title">Our Core Values</h2>
          </div>
          <div className="grid-4">
            {VALUES.map(({ icon, title, desc }) => (
              <div key={title} className="about__value card" style={{ padding: 28 }}>
                <div className="about__value-icon">{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section about__team-section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: 48 }}>
            <span className="section-label">The People Behind the Work</span>
            <h2 className="section-title">Meet Our Team</h2>
          </div>
          <div className="about__team-grid">
            {TEAM.map(({ name, role, emoji, bio }) => (
              <div key={name} className="about__team-card card" style={{ padding: 28, textAlign: 'center' }}>
                <div className="about__team-avatar">{emoji}</div>
                <h4>{name}</h4>
                <span className="about__team-role">{role}</span>
                <p>{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="services-page__cta">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title" style={{ color: 'white' }}>Ready to grow your business?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>Let's have a conversation about your goals.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-accent btn-lg">Get a Free Quote</Link>
            <Link to="/services" className="btn btn-outline-white btn-lg">View Services</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
