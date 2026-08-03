import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faUserPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../components/ProtectedRoute';
import api from '../api';
import './auth.css';

const INDUSTRIES = [
  'Retail & E-commerce', 'Food & Beverage', 'Technology', 'Finance & Banking',
  'Health & Wellness', 'Education', 'Tourism & Hospitality', 'Real Estate',
  'Fashion & Beauty', 'Agriculture', 'NGO / Non-profit', 'Other',
];

const passwordRules = (p) => ({
  length: p.length >= 8,
  upper: /[A-Z]/.test(p),
  number: /[0-9]/.test(p),
});

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    company_name: '', industry: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const rules = passwordRules(form.password);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (!rules.length || !rules.upper || !rules.number) e.password = 'Password does not meet requirements';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Minimal top bar */}
      <div className="auth-topbar">
        <Link to="/" className="auth-topbar__logo">
          <div className="auth-brand__icon">DM</div>
          <span>DigitalMark<span>RW</span></span>
        </Link>
        <Link to="/" className="btn btn-outline btn-sm">← Back to Site</Link>
      </div>

      <div className="auth-page__right">
        <div className="auth-form__header">
          <h1>Create your account</h1>
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
          {apiError && <div className="auth-form__alert auth-form__alert--error">{apiError}</div>}

          <div className="form-row-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input name="name" placeholder="Jean-Pierre Habimana" value={form.name} onChange={handleChange} className={errors.name ? 'error' : ''} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input name="phone" placeholder="+250 780 000 000" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input name="email" type="email" placeholder="you@company.com" value={form.email} onChange={handleChange} className={errors.email ? 'error' : ''} autoComplete="email" />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Company / Business Name</label>
              <input name="company_name" placeholder="Kigali Bakery Ltd" value={form.company_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <select name="industry" value={form.industry} onChange={handleChange}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <div className="password-wrapper">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                autoComplete="new-password"
              />
              <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}

            {/* Password strength indicators */}
            {form.password && (
              <div className="password-rules">
                {[
                  { ok: rules.length, label: 'At least 8 characters' },
                  { ok: rules.upper, label: 'One uppercase letter' },
                  { ok: rules.number, label: 'One number' },
                ].map(({ ok, label }) => (
                  <span key={label} className={`password-rule${ok ? ' password-rule--ok' : ''}`}>
                    <FontAwesomeIcon icon={faCheck} /> {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary auth-form__submit" disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</>
              : <><FontAwesomeIcon icon={faUserPlus} /> Create Account</>
            }
          </button>

          <div className="auth-form__footer">
            By registering you agree to our{' '}
            <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </div>
        </form>
      </div>
    </div>
  );
}
