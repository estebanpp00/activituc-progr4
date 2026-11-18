import { Navigate, Outlet } from 'react-router-dom';
import { useSesion } from '../store.js';

export default function RutaPrivada({ rol, roles }) {
  const usuario = useSesion((state) => state.usuario);
  const rolesPermitidos = Array.isArray(roles) ? roles : rol ? [rol] : [];

  if (!usuario) return <Navigate to="/login" replace />;
  if (rolesPermitidos.length && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
