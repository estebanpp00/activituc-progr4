import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSesion } from '../store.js';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const usuario = useSesion((state) => state.usuario);
  const salir = useSesion((state) => state.salir);
  const navigate = useNavigate();

  const cerrarSesion = () => {
    salir();
    setMenuAbierto(false);
    navigate('/');
  };

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-3">
      <div className="container-fluid p-0">
        <Link className="navbar-brand" to="/" onClick={cerrarMenu}>ActiviTuc</Link>
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
