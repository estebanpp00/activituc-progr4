import { NavLink, Outlet } from 'react-router-dom';
import { recursos } from '../crudConfig.js';

const iconos = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  usuarios: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20" /></>,
  etiquetas: <><path d="M20.6 13.4 13 21l-10-10V3h8l9.6 9.6a.6.6 0 0 1 0 .8Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  actividades: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  inscripciones: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
  resenas: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></>
};

function Icono({ nombre }) {
  return (
    <svg className="admin-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconos[nombre]}
    </svg>
  );
}

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading">
          <span>ACTIVITUC · PANEL</span>
          <h2>Administración</h2>
        </div>
        <nav className="admin-sidebar-nav admin-sidebar-tabs" aria-label="Navegación administrativa">
          <NavLink
            end
            to="/admin"
            className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icono nombre="dashboard" />
            <span>Dashboard y métricas</span>
          </NavLink>
          {Object.entries(recursos).map(([recurso, config]) => (
            <NavLink
              key={recurso}
              to={`/admin/${recurso}`}
              className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icono nombre={recurso} />
              <span>{config.nombre}</span>
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
