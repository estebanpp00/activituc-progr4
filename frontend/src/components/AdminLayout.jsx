import { NavLink, Outlet } from 'react-router-dom';
import { recursos } from '../crudConfig.js';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading">
          <span>ACTIVITUC</span>
          <h2>Administración</h2>
        </div>
        <nav className="admin-sidebar-nav admin-sidebar-tabs" aria-label="Navegación administrativa">
          <NavLink
            end
            to="/admin"
            className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
          >
            Dashboard y métricas
          </NavLink>
          {Object.entries(recursos).map(([recurso, config]) => (
            <NavLink
              key={recurso}
              to={`/admin/${recurso}`}
              className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
            >
              {config.nombre}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-content flex-grow-1">
        <Outlet />
      </div>
    </div>
  );
}
