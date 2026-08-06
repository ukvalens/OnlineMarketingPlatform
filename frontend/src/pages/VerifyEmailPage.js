/**
 * frontend/src/pages/VerifyEmailPage.js
 *
 * Changes:
 * - OTP verification is now handled inline on RegisterPage.
 * - This page now simply redirects any old /verify-email links to /register.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// OTP verification is now handled inline on the RegisterPage.
// This page handles any old /verify-email links gracefully.
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/register', { replace: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
