/**
 * frontend/src/pages/RegisterPage.js
 *
 * Changes:
 * - Added confirmPassword field with show/hide toggle and a match indicator.
 * - After form submit, shows an inline 6-box OTP screen (no redirect).
 * - OTP screen: handles digit input, backspace navigation, paste, and resend.
 * - Calls POST /auth/verify-otp on submit; POST /auth/resend-otp on resend.
 * - Accepts pendingEmail from location state to skip straight to OTP screen
 *   (used when redirected from LoginPage unverified-email flow).
 */
import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const pendingEmail = location.state?.pendingEmail || '';

  const [form, setForm] = useState({
    name: '', email: pendingEmail, phone: '', password: '', confirmPassword: '',
    company_name: '', industry: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(!!pendingEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const otpRefs = useRef([]);

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
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setRegistered(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setOtpError('');
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Enter the 6-digit code from your email.'); return; }
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email: form.email, otp: code });
      login(data.token, data.user);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    try {
      await api.post('/auth/resend-otp', { email: form.email });
      setResendMsg('A new code was sent to your email.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Could not resend. Try again.');
    }
  };

  if (registered) {
    return (
      <div className="auth-page">
        <div className="auth-topbar">
          <Link to="/" className="auth-topbar__logo">
            <div className="auth-brand__icon">DM</div>
            <span>DigitalMark<span>RW</span></span>
          </Link>
        </div>
        <div className="auth-page__right">
          <div className="auth-form__header">
            <h1>Check your email ✉️</h1>
            <p>We sent a 6-digit code to <strong>{form.email}</strong>.</p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Enter it below to activate your account.</p>
          </div>
          <form className="auth-form" onSubmit={handleOtpSubmit} style={{ maxWidth: 360 }}>
            {otpError && <div className="auth-form__alert auth-form__alert--error">{otpError}</div>}
            {resendMsg && <div className="auth-form__alert auth-form__alert--success">{resendMsg}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0' }} onPaste={handleOtpPaste}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center', fontSize: 24,
                    fontWeight: 700, border: '2px solid #d1d5db', borderRadius: 8,
                    outline: 'none', transition: 'border-color .2s',
                    borderColor: d ? '#2563eb' : '#d1d5db',
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button type="submit" className="btn btn-primary auth-form__submit" disabled={otpLoading}>
              {otpLoading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying…</>
                : 'Confirm & Continue'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
              Didn't receive it?{' '}
              <button type="button" className="btn btn-link" style={{ padding: 0, fontSize: 13 }} onClick={handleResend}>
                Resend code
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

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

          <div className="form-row-2">
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
            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="password-wrapper">
                <input
                  name="confirmPassword"
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  autoComplete="new-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPass(!showConfirmPass)} tabIndex={-1}>
                  {showConfirmPass ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              {form.confirmPassword && form.confirmPassword === form.password && (
                <span className="password-rule password-rule--ok" style={{ marginTop: 6, display: 'inline-flex' }}>
                  <FontAwesomeIcon icon={faCheck} /> Passwords match
                </span>
              )}
            </div>
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
