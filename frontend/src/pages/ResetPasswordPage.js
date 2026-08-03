import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import api from '../api';
import './auth.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-topbar">
          <Link to="/" className="auth-topbar__logo">
            <div className="auth-brand__icon">DM</div>
            <span>DigitalMark<span>RW</span></span>
          </Link>
        </div>
        <div className="auth-page__right">
          <div className="auth-form__alert auth-form__alert--error">
            Invalid reset link. <Link to="/forgot-password">Request a new one</Link>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link to="/" className="auth-topbar__logo">
          <div className="auth-brand__icon">DM</div>
          <span>DigitalMark<span>RW</span></span>
        </Link>
        <Link to="/" className="btn btn-outline btn-sm">← Back to Site</Link>
      </div>

      <div className="auth-page__right">
        <div className="auth-form__header">
          <h1>Set new password</h1>
          <p>Enter a new password for your account.</p>
        </div>

        {success ? (
          <div className="auth-form" style={{ gap: 16 }}>
            <div className="auth-form__alert auth-form__alert--success">
              Password updated! Redirecting you to sign in…
            </div>
            <Link to="/login" className="btn btn-outline auth-form__submit">Go to sign in</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                name="confirm"
                type={showPass ? 'text' : 'password'}
                placeholder="Repeat new password"
                value={form.confirm}
                onChange={(e) => { setForm({ ...form, confirm: e.target.value }); setError(''); }}
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary auth-form__submit" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving...</>
                : <><FiLock /> Reset password</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
