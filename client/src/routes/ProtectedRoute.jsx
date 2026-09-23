import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/ui/PageLoader.jsx';
import Forbidden from '../pages/Forbidden.jsx';

/** UX guard only. Every API call is authorized again on the server. */
export default function ProtectedRoute({ roles, permissions }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Forbidden />;
  if (permissions && !permissions.every(hasPermission)) return <Forbidden />;
  return <Outlet />;
}
