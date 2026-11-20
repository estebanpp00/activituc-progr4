import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSesion } from './store.js';
import Navbar from './components/Navbar.jsx';
import ContenedorAlertas from './components/ContenedorAlertas.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import RutaPrivada from './components/RutaPrivada.jsx';
import CrudPage from './pages/CrudPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import MiCuenta from './pages/MiCuenta.jsx';
import PanelOrganizador from './pages/PanelOrganizador.jsx';
import Registro from './pages/Registro.jsx';

export default function App() {
  const token = useSesion((state) => state.token);
  const refrescar = useSesion((state) => state.refrescar);
  const [errorSesion, setErrorSesion] = useState('');

  useEffect(() => {
    if (!token) return;
    refrescar()
      .then(() => setErrorSesion(''))
      .catch((error) => setErrorSesion(error.message));
  }, [token, refrescar]);

  return (
    <>
      <Navbar />
      <ContenedorAlertas />
      <main className="container py-4">
        {errorSesion && token && <div className="alert alert-danger">{errorSesion}</div>}
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route element={<RutaPrivada roles={['usuario', 'organizador', 'admin']} />}>
            <Route path="/mi-cuenta" element={<MiCuenta />} />
          </Route>
          <Route element={<RutaPrivada roles={['organizador', 'admin']} />}>
            <Route path="/organizador" element={<PanelOrganizador />} />
          </Route>
          <Route element={<RutaPrivada roles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path=":resource" element={<CrudPage mode="list" />} />
              <Route path=":resource/nuevo" element={<CrudPage mode="create" />} />
              <Route path=":resource/:id/editar" element={<CrudPage mode="edit" />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="text-center text-secondary small py-3">ActiviTuc</footer>
    </>
  );
}
