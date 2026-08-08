import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faPhone, faEnvelope, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import api from '../../api';
import './CTASection.css';

export default function CTASection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', { ...form, subject: 'Homepage Inquiry' });
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-section__grid">
          <div className="cta-section__left">
            <span className="section-label" style={{ color: '#4ade80' }}>Ready to Grow?</span>
            <h2 className="section-title" style={{ color: 'white' }}>
              Let's Build Your<br />Digital Presence Today
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
              Get a free consultation and custom quote. No commitment required — just a conversation about your goals.
            </p>

            <div className="cta-section__contacts">
              <a href="tel:+250780000000"><FontAwesomeIcon icon={faPhone} style={{ fontSize: 18 }} /><span>+250 780 000 000</span></a>
              <a href="mailto:info@digitalmarketing.rw"><FontAwesomeIcon icon={faEnvelope} style={{ fontSize: 18 }} /><span>info@digitalmarketing.rw</span></a>
            </div>
          </div>

          <div className="cta-section__form">
            <h3>Get a Free Quote</h3>
            {status === 'success' ? (
              <div className="cta-success">
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 40, color: '#16a34a', marginBottom: 8 }} />
                <p>Message sent! We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <input name="name" placeholder="Your Name" value={form.name} onChange={handleChange} required />
                  <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} required />
                </div>
                <input name="phone" placeholder="Phone Number (optional)" value={form.phone} onChange={handleChange} />
                <textarea name="message" placeholder="Tell us about your business and goals..." rows={4} value={form.message} onChange={handleChange} required />
                {status === 'error' && <p className="form-error">Something went wrong. Please try again.</p>}
                <button type="submit" className="btn btn-accent btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Sending...' : <><FontAwesomeIcon icon={faPaperPlane} /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
