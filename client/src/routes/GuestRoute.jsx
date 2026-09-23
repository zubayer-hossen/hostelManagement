import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/ui/PageLoader.jsx';

/** Login / register pages: signed-in users are sent to their dashboard instead. */
export default function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
