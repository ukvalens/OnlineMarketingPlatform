import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Roles that get the admin/staff dashboard
const STAFF_ROLES = ['admin', 'staff', 'editor', 'finance'];

export const getDashboardPath = (role) =>
  STAFF_ROLES.includes(role) ? '/dashboard/admin' :
  role === 'client' ? '/dashboard/client' : '/login';

// Blocks unauthenticated users
export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loader"><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={getDashboardPath(user.role)} replace />;

  return children;
}

// Redirects already-logged-in users away from /login and /register
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><span className="spinner" /></div>;
  if (user) return <Navigate to={getDashboardPath(user.role)} replace />;

  return children;
}
