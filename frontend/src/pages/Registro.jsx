import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSesion } from '../store.js';

export default function Registro() {
  const entrar = useSesion((s) => s.entrar);
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    try {
      await entrar('/auth/registro', form);
      navigate('/mi-cuenta', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="col-md-5 mx-auto auth-form" onSubmit={enviar}>
      <h2>Registrarse</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <input className="form-control mb-3" name="nombre" placeholder="Nombre" required value={form.nombre} onChange={cambiar} />
      <input className="form-control mb-3" type="email" name="email" placeholder="Email" required value={form.email} onChange={cambiar} />
      <input className="form-control mb-3" type="password" name="password" placeholder="Contraseña (6+ caracteres)" required minLength="6" value={form.password} onChange={cambiar} />
      <button className="btn btn-success">Crear cuenta</button>
    </form>
  );
}
