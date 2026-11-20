import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotificaciones, useSesion } from '../store.js';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const usuario = useSesion((state) => state.usuario);
  const salir = useSesion((state) => state.salir);
  const notificar = useNotificaciones((state) => state.notificar);
  const navigate = useNavigate();

  const cerrarSesion = () => {
    salir();
    notificar({ tipo: 'info', titulo: 'Sesión cerrada', mensaje: 'Cerraste sesión correctamente.' });
    setMenuAbierto(false);
    navigate('/');
  };

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-3">
      <div className="container-fluid p-0">
        <Link className="navbar-brand" to="/" onClick={cerrarMenu}>
          <span className="navbar-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13.2c1.7-4.1 6.2-6.7 12.8-6.4 1.4 5.9-1 10.1-5.3 11.6-3.2 1.1-6.7-.1-8-2.7-.4-.8-.2-1.6.5-2.5Z" />
              <path d="M13.5 7.2c1.3-2.6 3.6-3.5 6-3.2-.3 2.6-2 4.1-5.3 4.3M7 15c2.4-.7 5.4-2.1 7.8-4.6" />
            </svg>
          </span>
          <span className="navbar-brand-copy">
            <span>ActiviTuc</span>
            <small>San Miguel de Tucumán</small>
          </span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navegacion-principal"
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse${menuAbierto ? ' show' : ''}`} id="navegacion-principal">
          <div className="navbar-nav ms-lg-auto align-items-lg-center gap-2">
            <Link className="nav-link" to="/" onClick={cerrarMenu}>Actividades</Link>
            {(usuario?.rol === 'organizador' || usuario?.rol === 'admin') && (
              <Link className="nav-link" to="/organizador" onClick={cerrarMenu}>Mis actividades</Link>
            )}
            {usuario?.rol === 'admin' && <Link className="nav-link" to="/admin" onClick={cerrarMenu}>Administración</Link>}
            {usuario && <Link className="nav-link navbar-user-link" to="/mi-cuenta" onClick={cerrarMenu}>{usuario.nombre}</Link>}
            {!usuario && <Link className="nav-link" to="/login" onClick={cerrarMenu}>Ingresar</Link>}
            {!usuario && <Link className="nav-link" to="/registro" onClick={cerrarMenu}>Registrarse</Link>}
            {usuario && <button type="button" className="btn btn-outline-light btn-sm" onClick={cerrarSesion}>Salir</button>}
          </div>
        </div>
      </div>
    </nav>
  );
}
