import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { getDashboardPath } from '../components/ProtectedRoute';
import api from '../api';
import './auth.css';

const DEMO_ROLES = [
  { role: 'admin',   email: 'admin@demo.rw',   label: 'Admin' },
  { role: 'client',  email: 'client@demo.rw',  label: 'Client' },
  { role: 'staff',   email: 'staff@demo.rw',   label: 'Staff' },
  { role: 'editor',  email: 'editor@demo.rw',  label: 'Editor' },
  { role: 'finance', email: 'finance@demo.rw', label: 'Finance' },
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

  const from = location.state?.from?.pathname;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      // Redirect to where they came from, or role-based dashboard
      navigate(from || getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
        <Link to="/" className="btn btn-outline btn-sm">{t('login_back')}</Link>
      </div>

      <div className="auth-page__right">
        <div className="auth-form__header">
          <h1>{t('login_title')}</h1>
          <p>{t('login_subtitle')} <Link to="/register">{t('login_create')}</Link></p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}

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
