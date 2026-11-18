import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSesion } from '../store.js';

export default function Login() {
  const entrar = useSesion((s) => s.entrar);
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    try {
      await entrar('/auth/login', form);
      const usuario = useSesion.getState().usuario;
      const destino = usuario.rol === 'admin'
        ? '/admin'
        : usuario.rol === 'organizador'
          ? '/organizador'
          : '/mi-cuenta';
      navigate(state?.desde || destino, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="col-md-5 mx-auto auth-form" onSubmit={enviar}>
      <h2>Ingresar</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <input className="form-control mb-3" type="email" name="email" placeholder="Email" required value={form.email} onChange={cambiar} />
      <input className="form-control mb-3" type="password" name="password" placeholder="Contraseña" required value={form.password} onChange={cambiar} />
      <button className="btn btn-success me-3">Ingresar</button>
      <Link to="/registro" state={state}>¿No tenés cuenta? Registrate</Link>
    </form>
  );
}
