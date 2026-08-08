import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faPhone, faEnvelope, faMapPin, faClock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import Layout from '../../components/layout/Layout';
import usePageView from '../../hooks/usePageView';
import api from '../../api';
import './Contact.css';

const SERVICES = ['Social Media Marketing','Digital Advertising','Website Promotion','Graphic Design','Branding Services','Business Consulting','Online Product Marketing','Other'];

export default function ContactPage() {
  usePageView();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    subject: searchParams.get('service') ? `Inquiry: ${searchParams.get('service')} (${searchParams.get('tier') || ''})` : '',
    message: '',
    service: searchParams.get('service') || '',
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-hero">
        <div className="container">
          <span className="section-label">Get In Touch</span>
          <h1 className="section-title">Contact Us</h1>
          <p className="section-subtitle">Have a project in mind? We'd love to hear about it. Send us a message and we'll get back to you within 24 hours.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="contact__grid">
            {/* Form */}
            <div className="contact__form-wrap">
              <h2>Send Us a Message</h2>
              {status === 'success' ? (
                <div className="contact__success">
                  <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 48, color: '#16a34a', marginBottom: 12 }} />
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                  <button className="btn btn-primary" onClick={() => setStatus(null)}>Send Another Message</button>
                </div>
              ) : (
                <form className="contact__form" onSubmit={handleSubmit}>
                  {status === 'error' && <div className="auth-form__alert auth-form__alert--error">Something went wrong. Please try again.</div>}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input name="phone" placeholder="+250 780 000 000" value={form.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Service Interested In</label>
                      <select name="service" value={form.service} onChange={handleChange}>
                        <option value="">Select a service</option>
                        {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Subject</label>
                    <input name="subject" placeholder="What is this about?" value={form.subject} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Message *</label>
                    <textarea name="message" rows={5} placeholder="Tell us about your business and what you need..." value={form.message} onChange={handleChange} required style={{ resize:'vertical' }} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width:'100%', justifyContent:'center' }}>
                    {loading ? 'Sending...' : <><FontAwesomeIcon icon={faPaperPlane} /> Send Message</>}
                  </button>
                </form>
              )}
            </div>

            {/* Info */}
            <div className="contact__info">
              <div className="contact__info-card">
                <h3>Contact Information</h3>
                <div className="contact__info-items">
                  <div className="contact__info-item">
                    <div className="contact__info-icon"><FontAwesomeIcon icon={faMapPin} /></div>
                    <div><strong>Address</strong><span>KG 123 St, Kigali, Rwanda</span></div>
                  </div>
                  <div className="contact__info-item">
                    <div className="contact__info-icon"><FontAwesomeIcon icon={faPhone} /></div>
                    <div><strong>Phone</strong><a href="tel:+250780000000">+250 780 000 000</a></div>
                  </div>
                  <div className="contact__info-item">
                    <div className="contact__info-icon"><FontAwesomeIcon icon={faEnvelope} /></div>
                    <div><strong>Email</strong><a href="mailto:info@digitalmarketing.rw">info@digitalmarketing.rw</a></div>
                  </div>
                  <div className="contact__info-item">
                    <div className="contact__info-icon"><FontAwesomeIcon icon={faClock} /></div>
                    <div><strong>Working Hours</strong><span>Mon – Fri: 8:00 AM – 6:00 PM</span></div>
                  </div>
                </div>
                <div className="contact__social">
                  <a href="https://facebook.com" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faFacebook} /></a>
                  <a href="https://twitter.com" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faTwitter} /></a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faInstagram} /></a>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faLinkedin} /></a>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="contact__map">
                <iframe
                  title="Kigali Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63799.41051580427!2d30.0187!3d-1.9441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4258ed8e797%3A0xe4f0b9c5e1a8e0d!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2srw!4v1620000000000"
                  width="100%" height="220" style={{ border: 0, borderRadius: 'var(--radius-lg)' }}
                  allowFullScreen loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
