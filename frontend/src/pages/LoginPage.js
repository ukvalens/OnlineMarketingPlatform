/**
 * frontend/src/pages/LoginPage.js
 *
 * Changes:
 * - After correct credentials, if server returns { requiresOtp: true }, renders
 *   an inline 6-box OTP screen instead of logging in immediately.
 * - OTP screen: handles digit input, backspace navigation, paste, resend, and
 *   a Back button to return to credentials.
 * - Resend re-posts the login form to trigger a new OTP email.
 * - Unverified client email shows a "Resend verification code" button.
 * - Demo buttons updated to use real seeded accounts (admin, staff, finance).
 */
import { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getDashboardPath } from '../components/ProtectedRoute';
import api from '../api';
import './auth.css';

const DEMO_ROLES = [
  { role: 'admin',   email: 'ukwitegetsev9@gmail.com',       label: 'Admin' },
  { role: 'staff',   email: 'ukwitegetsevalens78@gmail.com', label: 'Staff' },
  { role: 'finance', email: 'niyigaba202@gmail.com',         label: 'Finance' },
  { role: 'client',  email: 'client@demo.rw',                label: 'Client' },
  { role: 'editor',  email: 'aaronhagenimana6@gmail.com',    label: 'Editor' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // OTP step state
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const otpRefs = useRef([]);

  const from = location.state?.from?.pathname;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setUnverifiedEmail('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.requiresOtp) {
        setOtpEmail(data.email);
      } else {
        login(data.token, data.user);
        navigate(from || getDashboardPath(data.user.role), { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      if (err.response?.status === 403 && msg.toLowerCase().includes('verify')) {
        setUnverifiedEmail(form.email);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // OTP handlers
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
      const { data } = await api.post('/auth/login-otp', { email: otpEmail, otp: code });
      login(data.token, data.user);
      navigate(from || getDashboardPath(data.user.role), { replace: true });
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
      await api.post('/auth/login', form); // re-triggers OTP send
      setResendMsg('A new code was sent to your email.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch {
      setResendMsg('Could not resend. Please try again.');
    }
  };

  // ── OTP screen ──────────────────────────────────────────────
  if (otpEmail) {
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
            <p>We sent a 6-digit login code to <strong>{otpEmail}</strong>.</p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Enter it below to complete sign-in.</p>
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
                : 'Confirm & Sign In'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
              Didn't receive it?{' '}
              <button type="button" className="btn btn-link" style={{ padding: 0, fontSize: 13 }} onClick={handleResend}>
                Resend code
              </button>
              {' · '}
              <button type="button" className="btn btn-link" style={{ padding: 0, fontSize: 13 }} onClick={() => setOtpEmail('')}>
                Back
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── Credentials screen ───────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link to="/" className="auth-topbar__logo">
          <div className="auth-brand__icon">DM</div>
          <span>DigitalMark<span>RW</span></span>
        </Link>
        <Link to="/" className="btn btn-outline btn-sm">{t('login_back')}</Link>
      </div>

      <div className="auth-page__right">
        <div className="auth-form__header">
          <h1>{t('login_title')}</h1>
          <p>{t('login_subtitle')} <Link to="/register">{t('login_create')}</Link></p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-form__alert auth-form__alert--error">
              {error}
              {unverifiedEmail && (
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: 13 }}
                    onClick={async () => {
                      try {
                        await api.post('/auth/resend-otp', { email: unverifiedEmail });
                        navigate('/register', { state: { pendingEmail: unverifiedEmail } });
                      } catch {}
                    }}
                  >
                    Resend verification code
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('login_email')}</label>
            <input
              id="email" name="email" type="email"
              placeholder="you@example.com"
              value={form.email} onChange={handleChange}
              required autoComplete="email"
              className={error ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login_password')}</label>
            <div className="password-wrapper">
              <input
                id="password" name="password"
                type={showPass ? 'text' : 'password'}
                placeholder={t('login_password')}
                value={form.password} onChange={handleChange}
                required autoComplete="current-password"
                className={error ? 'error' : ''}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
              {t('login_forgot')}
            </Link>
          </div>

          <div className="auth-divider">{t('login_demo')}</div>
          <div className="demo-roles">
            {DEMO_ROLES.map(({ role, email, label }) => (
              <button
                key={role} type="button"
                className={`demo-role-btn demo-role-btn--${role}`}
                onClick={() => { setForm({ email, password: 'Demo@1234' }); setError(''); }}
              >
                {label}
              </button>
            ))}
          </div>

          <button type="submit" className="btn btn-primary auth-form__submit" disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> {t('login_signing')}</>
              : <><FontAwesomeIcon icon={faRightToBracket} /> {t('login_submit')}</>}
          </button>

          <div className="auth-form__footer">
            {t('login_terms_pre')}{' '}
            <Link to="/terms">{t('login_terms')}</Link> {t('login_and')}{' '}
            <Link to="/privacy">{t('login_privacy')}</Link>.
          </div>
        </form>
      </div>
    </div>
  );
}
