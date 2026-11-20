import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificaciones, useSesion } from '../store.js';

export default function Registro() {
  const entrar = useSesion((s) => s.entrar);
  const notificar = useNotificaciones((s) => s.notificar);
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    try {
      await entrar('/auth/registro', form);
      notificar({ tipo: 'success', titulo: 'Cuenta creada', mensaje: '¡Ya podés empezar a explorar actividades!' });
      navigate('/mi-cuenta', { replace: true });
    } catch (err) {
      setError(err.message);
      notificar({ tipo: 'danger', titulo: 'No se pudo crear la cuenta', mensaje: err.message });
    }
  };

  return (
    <form className="auth-form" onSubmit={enviar}>
      <header className="auth-heading">
        <div className="auth-brand">
          <span className="navbar-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13.2c1.7-4.1 6.2-6.7 12.8-6.4 1.4 5.9-1 10.1-5.3 11.6-3.2 1.1-6.7-.1-8-2.7-.4-.8-.2-1.6.5-2.5Z" />
              <path d="M13.5 7.2c1.3-2.6 3.6-3.5 6-3.2-.3 2.6-2 4.1-5.3 4.3M7 15c2.4-.7 5.4-2.1 7.8-4.6" />
            </svg>
          </span>
          <span><strong>ActiviTuc</strong><small>San Miguel de Tucumán</small></span>
        </div>
        <span className="dashboard-eyebrow">SUMATE A LA COMUNIDAD</span>
        <h1>Crear cuenta</h1>
        <p>Registrate para descubrir y compartir actividades.</p>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3">
        <label className="form-label" htmlFor="registro-nombre">Nombre</label>
        <input id="registro-nombre" className="form-control" name="nombre" autoComplete="name" placeholder="Tu nombre" required value={form.nombre} onChange={cambiar} />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="registro-email">Email</label>
        <input id="registro-email" className="form-control" type="email" name="email" autoComplete="email" placeholder="tu@email.com" required value={form.email} onChange={cambiar} />
      </div>
      <div className="mb-4">
        <label className="form-label" htmlFor="registro-password">Contraseña</label>
        <input id="registro-password" className="form-control" type="password" name="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres" required minLength="6" value={form.password} onChange={cambiar} />
      </div>
      <button className="btn btn-primary w-100">Crear cuenta</button>
    </form>
  );
}
