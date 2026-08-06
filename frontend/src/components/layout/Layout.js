/**
 * frontend/src/components/layout/Layout.js
 *
 * Changes:
 * - Footer is now only rendered when no user is logged in (!user).
 *   Logged-in users on public pages see no footer.
 */
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '70px' }}>{children}</main>
      {!user && <Footer />}
    </>
  );
}
