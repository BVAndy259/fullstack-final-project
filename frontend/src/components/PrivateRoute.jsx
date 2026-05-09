import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && (user.role ?? user.rol) !== 'admin') return <Navigate to="/ventas/nueva" replace />;

  return children;
};

export default PrivateRoute;
