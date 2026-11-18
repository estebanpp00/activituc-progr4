import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

function FormularioResena({ inscripcion }) {
  const [estrellas, setEstrellas] = useState(String(inscripcion.resena_estrellas || ''));
  const [comentario, setComentario] = useState(inscripcion.resena_comentario || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const guardar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      await api('/resenas', {
        method: 'POST',
        body: {
          actividad_id: Number(inscripcion.actividad_id),
          estrellas: Number(estrellas),
          comentario: comentario.trim()
        }
      });
      setMensaje('Reseña guardada correctamente.');
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="mt-3 pt-3 border-top" onSubmit={guardar}>
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor={`estrellas-${inscripcion.actividad_id}`}>
            Puntuación (1 a 5 estrellas)
          </label>
          <select
            className="form-select w-100"
            id={`estrellas-${inscripcion.actividad_id}`}
            value={estrellas}
            required
            onChange={(event) => setEstrellas(event.target.value)}
          >
            <option value="">Elegí una puntuación</option>
            {[5, 4, 3, 2, 1].map((valor) => (
              <option key={valor} value={valor}>{valor} {valor === 1 ? 'estrella' : 'estrellas'}</option>
            ))}
          </select>
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor={`comentario-${inscripcion.actividad_id}`}>Comentario</label>
          <textarea
            className="form-control"
            id={`comentario-${inscripcion.actividad_id}`}
            rows="3"
            maxLength="500"
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            placeholder="Contá qué te pareció la actividad (opcional)"
          />
        </div>
        <div className="col-12 d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2">
          <button className="btn btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar reseña'}
          </button>
          {mensaje && <span className="text-success">{mensaje}</span>}
        </div>
      </div>
      {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
    </form>
  );
}

export default function MiCuenta() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/mi-cuenta').then(setDatos).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!datos) return <p>Cargando...</p>;

  return (
    <section>
      <button type="button" className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        ← Volver atrás
      </button>
      <h1>Mi cuenta</h1>
      <p>{datos.usuario.nombre} · {datos.usuario.email} · {datos.usuario.rol}</p>
      <h2 className="h4 mt-4">Mis inscripciones</h2>
      {datos.inscripciones.length === 0 ? <p>Todavía no tenés inscripciones.</p> : (
        <ul className="row list-unstyled g-4 align-items-start">
          {datos.inscripciones.map((item) => (
            <li className="col-12 col-lg-6" key={item.id}>
              <div className="mi-cuenta-inscripcion-card h-100 d-flex flex-column border rounded-4 p-4 bg-white shadow-sm">
                <h3 className="h5 fw-bold mb-1">{item.actividad}</h3>
                <p className="small mb-2">{item.horario}</p>
                <span className={`badge align-self-start ${Number(item.asistio) === 1 ? 'text-bg-success' : 'text-bg-warning'}`}>
                  {Number(item.asistio) === 1 ? 'Asistencia confirmada' : 'Asistencia pendiente'}
                </span>
                {Number(item.asistio) === 1 ? (
                  <FormularioResena inscripcion={item} />
                ) : (
                  <div className="mi-cuenta-aviso mt-3 mb-0">
                    Podrás opinar una vez que se confirme tu asistencia.
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
