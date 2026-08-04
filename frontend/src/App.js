import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import ClientOrdersPage from './pages/dashboard/ClientOrdersPage';
import ClientInvoicesPage from './pages/dashboard/ClientInvoicesPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AdminPortfolioPage from './pages/dashboard/AdminPortfolioPage';
import AdminOrdersPage from './pages/dashboard/AdminOrdersPage';
import AdminUsersPage from './pages/dashboard/AdminUsersPage';
import AdminInvoicesPage from './pages/dashboard/AdminInvoicesPage';
import AdminPaymentsPage from './pages/dashboard/AdminPaymentsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import ServicesPage from './pages/public/ServicesPage';
import PortfolioPage from './pages/public/PortfolioPage';
import BlogPage from './pages/public/BlogPage';
import BlogPostPage from './pages/public/BlogPostPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import { PrivacyPage, TermsPage } from './pages/public/LegalPages';

const STAFF_ROLES = ['admin', 'staff', 'editor', 'finance'];

const Soon = ({ title }) => (
  <Layout>
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#6B7280' }}>
      🚧 {title} — Coming Soon
    </div>
  </Layout>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Guest only (redirect if logged in) */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

          {/* Client dashboard */}
          <Route path="/dashboard/client" element={
            <ProtectedRoute roles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/client/orders" element={
            <ProtectedRoute roles={['client']}><ClientOrdersPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/client/messages" element={
            <ProtectedRoute roles={['client']}><Soon title="Messages" /></ProtectedRoute>
          } />
          <Route path="/dashboard/client/invoices" element={
            <ProtectedRoute roles={['client']}><ClientInvoicesPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/client/profile" element={
            <ProtectedRoute roles={['client']}><ProfilePage /></ProtectedRoute>
          } />

          {/* Shared profile for all roles */}
          <Route path="/profile" element={
            <ProtectedRoute roles={['client','staff','editor','finance','admin']}><ProfilePage /></ProtectedRoute>
          } />

          {/* Admin / Staff dashboard */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute roles={STAFF_ROLES}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/orders" element={
            <ProtectedRoute roles={STAFF_ROLES}><AdminOrdersPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/clients" element={
            <ProtectedRoute roles={['admin', 'staff']}><Soon title="Clients" /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/messages" element={
            <ProtectedRoute roles={STAFF_ROLES}><Soon title="Messages" /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/invoices" element={
            <ProtectedRoute roles={['admin', 'finance']}><AdminInvoicesPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/payments" element={
            <ProtectedRoute roles={['admin', 'finance']}><AdminPaymentsPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/blog" element={
            <ProtectedRoute roles={['admin', 'editor']}><Soon title="Blog Management" /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/portfolio" element={
            <ProtectedRoute roles={['admin', 'editor']}><AdminPortfolioPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/analytics" element={
            <ProtectedRoute roles={['admin']}><Soon title="Analytics" /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/users" element={
            <ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/settings" element={
            <ProtectedRoute roles={['admin']}><Soon title="Settings" /></ProtectedRoute>
          } />

          {/* Legacy /dashboard redirect → role-based */}
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />

          <Route path="*" element={<Soon title="404 — Page Not Found" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
