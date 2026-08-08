import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import ClientOrdersPage from './pages/dashboard/ClientOrdersPage';
import ClientInvoicesPage from './pages/dashboard/ClientInvoicesPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AdminPortfolioPage from './pages/dashboard/AdminPortfolioPage';
import AdminOrdersPage from './pages/dashboard/AdminOrdersPage';
import AdminUsersPage from './pages/dashboard/AdminUsersPage';
import AdminClientsPage from './pages/dashboard/AdminClientsPage';
import AdminInvoicesPage from './pages/dashboard/AdminInvoicesPage';
import AdminPaymentsPage from './pages/dashboard/AdminPaymentsPage';
import AdminAnalyticsPage from './pages/dashboard/AdminAnalyticsPage';
import AdminSettingsPage from './pages/dashboard/AdminSettingsPage';
import DashboardServicesPage from './pages/dashboard/DashboardServicesPage';
import TransactionsPage from './pages/dashboard/TransactionsPage';
import EditorBlogPage from './pages/dashboard/EditorBlogPage';
import ClientMessagesPage from './pages/dashboard/ClientMessagesPage';
import AdminMessagesPage from './pages/dashboard/AdminMessagesPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import ServicesPage from './pages/public/ServicesPage';
import PortfolioPage from './pages/public/PortfolioPage';
import BlogPage from './pages/public/BlogPage';
import BlogPostPage from './pages/public/BlogPostPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import { PrivacyPage, TermsPage } from './pages/public/LegalPages';
import VerifyReceiptPage from './pages/public/VerifyReceiptPage';

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
    <SiteSettingsProvider>
    <LangProvider>
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
          <Route path="/verify/receipt/:id" element={<VerifyReceiptPage />} />

          {/* Guest only (redirect if logged in) */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

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
            <ProtectedRoute roles={['client']}><ClientMessagesPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/client/invoices" element={
            <ProtectedRoute roles={['client']}><ClientInvoicesPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/client/profile" element={
            <ProtectedRoute roles={['client']}><ProfilePage /></ProtectedRoute>
          } />

          {/* Profile — role-based dashboard routes */}
          <Route path="/profile" element={
            <ProtectedRoute roles={['client','staff','editor','finance','admin']}><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/dashboard/staff/profile" element={
            <ProtectedRoute roles={['staff']}><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/dashboard/editor/profile" element={
            <ProtectedRoute roles={['editor']}><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/dashboard/finance/profile" element={
            <ProtectedRoute roles={['finance']}><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/profile" element={
            <ProtectedRoute roles={['admin']}><ProfilePage /></ProtectedRoute>
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
            <ProtectedRoute roles={['admin', 'staff']}><AdminClientsPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/messages" element={
            <ProtectedRoute roles={STAFF_ROLES}><AdminMessagesPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/invoices" element={
            <ProtectedRoute roles={['admin', 'finance']}><AdminInvoicesPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/payments" element={
            <ProtectedRoute roles={['admin', 'finance']}><AdminPaymentsPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/blog" element={
            <ProtectedRoute roles={['admin', 'editor']}><EditorBlogPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/portfolio" element={
            <ProtectedRoute roles={['admin', 'editor']}><AdminPortfolioPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/analytics" element={
            <ProtectedRoute roles={['admin']}><AdminAnalyticsPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/users" element={
            <ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/admin/settings" element={
            <ProtectedRoute roles={['admin']}><AdminSettingsPage /></ProtectedRoute>
          } />

          {/* Services — accessible to all authenticated roles */}
          <Route path="/dashboard/services" element={
            <ProtectedRoute roles={['client','staff','editor','finance','admin']}>
              <DashboardServicesPage />
            </ProtectedRoute>
          } />

          {/* Blog — dashboard-wrapped */}
          <Route path="/dashboard/blog" element={
            <ProtectedRoute roles={['client','staff','editor','finance','admin']}>
              <BlogPage inDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/blog/:slug" element={
            <ProtectedRoute roles={['client','staff','editor','finance','admin']}>
              <BlogPostPage inDashboard />
            </ProtectedRoute>
          } />

          {/* Portfolio — dashboard-wrapped */}
          <Route path="/dashboard/portfolio" element={
            <ProtectedRoute roles={['client','staff','editor','finance','admin']}>
              <PortfolioPage inDashboard />
            </ProtectedRoute>
          } />

          {/* Transactions */}
          <Route path="/dashboard/transactions" element={
            <ProtectedRoute roles={['client','staff','finance','admin']}>
              <TransactionsPage />
            </ProtectedRoute>
          } />

          {/* Legacy /dashboard redirect → role-based */}
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />

          <Route path="*" element={<Soon title="404 — Page Not Found" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LangProvider>
    </SiteSettingsProvider>
  );
}
