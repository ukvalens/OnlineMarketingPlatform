import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiSend } from 'react-icons/fi';
import api from '../api';
import './auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Forgot password?</h1>
          <p>Remembered it? <Link to="/login">Sign in</Link></p>
        </div>

        {!submitted ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-form__alert auth-form__alert--error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn btn-primary auth-form__submit" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending...</>
                : <><FiSend /> Send reset link</>}
            </button>

            <div className="auth-form__footer">
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="auth-form" style={{ gap: 16 }}>
            <div className="auth-form__alert auth-form__alert--success">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                <FiMail size={16} /> Check your inbox
              </div>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your spam folder too.
            </div>
            <Link to="/login" className="btn btn-outline auth-form__submit">
              Return to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
