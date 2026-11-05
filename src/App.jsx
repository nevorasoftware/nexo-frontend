import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Audit from './pages/Audit';
import Team from './pages/Team';
import Profile from './pages/Profile';

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner className="min-h-screen" />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/registro" element={<PublicOnly><Register /></PublicOnly>} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="ventas" element={<Protected roles={['OWNER', 'EMPLOYEE']}><Sales /></Protected>} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="historial" element={<Protected roles={['OWNER']}><Audit /></Protected>} />
        <Route path="equipo" element={<Protected roles={['OWNER']}><Team /></Protected>} />
        <Route path="perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
