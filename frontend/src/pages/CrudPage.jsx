import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ImagenActividad from '../components/ImagenActividad.jsx';
import { recursos } from '../crudConfig.js';

function nuevoFormulario(recurso) {
  return Object.fromEntries(recurso.campos.map((campo) => [
    campo.nombre,
    campo.tipo === 'checkbox' ? false : ''
  ]));
}

function mostrar(valor, columna) {
  if (columna === 'asistio') return valor ? 'Sí' : 'No';
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'object') return new Date(valor).toLocaleString('es-AR');
  return String(valor);
}

function etiquetaEstado(estado) {
  const variantes = {
    pendiente: ['Pendiente', 'text-bg-warning'],
    aprobada: ['Aprobada', 'text-bg-success'],
    rechazada: ['Rechazada', 'text-bg-danger']
  };
  const [texto, clase] = variantes[estado] || [estado, 'text-bg-secondary'];
  return <span className={`badge ${clase}`}>{texto}</span>;
}

const nombresColumnasActividad = {
  nombre: 'Nombre',
  imagen_url: 'Imagen',
  etiqueta: 'Etiqueta',
  organizador: 'Organizador',
  estado: 'Estado',
  precios: 'Precios'
};

function precioActividad(value) {
  const precio = Number(value);
  return Number.isFinite(precio)
    ? `$${precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';
}

export default function CrudPage({ mode }) {
  const { resource, id } = useParams();
  const navigate = useNavigate();
  const recurso = recursos[resource];
  const [registros, setRegistros] = useState([]);
  const [form, setForm] = useState(recurso ? nuevoFormulario(recurso) : {});
  const [opciones, setOpciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    if (!recurso) return () => { vigente = false; };

    async function cargar() {
      setCargando(true);
      setError('');
      try {
        if (mode === 'list') {
          setRegistros(await api(`/admin/${resource}`));
          return;
        }

        setForm(nuevoFormulario(recurso));
        const fuentes = [...new Set(recurso.campos.map((campo) => campo.fuente).filter(Boolean))];
        const resultados = await Promise.all(fuentes.map((fuente) => api(`/admin/${fuente}`)));
        const nuevasOpciones = Object.fromEntries(fuentes.map((fuente, index) => [fuente, resultados[index]]));
        if (mode === 'edit') {
          const registro = await api(`/admin/${resource}/${id}`);
          const valores = Object.fromEntries(recurso.campos.map((campo) => [
            campo.nombre,
            campo.tipo === 'password' ? '' : (registro[campo.nombre] ?? (campo.tipo === 'checkbox' ? false : ''))
          ]));
          if (vigente) setForm(valores);
        }
        if (vigente) setOpciones(nuevasOpciones);
      } catch (e) {
        if (vigente) setError(e.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }

    cargar();
    return () => { vigente = false; };
  }, [resource, id, mode]);

  if (!recurso) return <div className="alert alert-danger">Entidad no encontrada.</div>;
  const base = `/admin/${resource}`;

  const guardar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    const body = { ...form };
    if (mode === 'edit' && !body.password) delete body.password;
    try {
      await api(mode === 'create' ? base : `${base}/${id}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        body
      });
      navigate(base);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (registro) => {
    if (!window.confirm(`¿Eliminar ${recurso.singular} #${registro.id}?`)) return;
    setError('');
    try {
      await api(`${base}/${registro.id}`, { method: 'DELETE' });
      setRegistros((actuales) => actuales.filter((item) => item.id !== registro.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const cambiarEstado = async (registro, estado) => {
    setError('');
    try {
      await api(`/admin/actividades/${registro.id}/estado`, {
        method: 'PATCH',
        body: { estado }
      });
      setRegistros(await api(base));
    } catch (e) {
      setError(e.message);
    }
  };

  if (cargando) return <p>Cargando...</p>;

  if (mode === 'list') {
    return (
      <section>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <button type="button" className="btn btn-outline-secondary mb-3" onClick={() => navigate('/admin')}>
              ← Volver atrás
            </button>
            <h1 className="mb-0">{recurso.nombre}</h1>
          </div>
          <Link className="btn btn-primary" to={`${base}/nuevo`}>Crear {recurso.singular}</Link>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {!error && registros.length === 0 ? <p>No hay registros.</p> : registros.length > 0 && (
          <div className={`table-responsive${recurso === recursos.actividades ? ' actividades-table-responsive' : ''}`}>
            <table className={`table table-hover align-middle${recurso === recursos.actividades ? ' actividades-crud-table' : ''}`}>
              <thead>
                <tr>
                  {recurso.columnas.map((columna) => (
                    <th key={columna}>
                      {recurso === recursos.actividades
                        ? nombresColumnasActividad[columna]
                        : columna.replaceAll('_', ' ')}
                    </th>
                  ))}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    {recurso.columnas.map((columna) => (
                      <td
                        key={columna}
                        data-column={columna}
                        data-label={recurso === recursos.actividades
                          ? nombresColumnasActividad[columna]
                          : undefined}
                      >
                        {recurso === recursos.actividades && columna === 'imagen_url' ? (
                          <ImagenActividad
                            className="actividad-imagen-tabla actividad-imagen-tabla-compacta"
                            src={registro.imagen_url}
                            alt={`Imagen de ${registro.nombre}`}
                          />
                        ) : recurso === recursos.actividades && columna === 'estado' ? (
                          etiquetaEstado(registro.estado)
                        ) : recurso === recursos.actividades && columna === 'precios' ? (
                          <div className="actividad-precios">
                            <span>Mensual: {precioActividad(registro.precio_mensual)}</span>
                            <span>Semanal: {precioActividad(registro.precio_semanal)}</span>
                          </div>
                        ) : mostrar(registro[columna], columna)}
                      </td>
                    ))}
                    <td data-column="acciones" data-label="Acciones">
                      <div className="table-actions">
                        {recurso === recursos.actividades && registro.estado === 'pendiente' && (
                          <>
                          <button
                            className="btn btn-sm btn-success me-2 mb-1"
                            onClick={() => cambiarEstado(registro, 'aprobada')}
                          >
                            Aprobar
                          </button>
                          <button
                            className="btn btn-sm btn-danger me-2 mb-1"
                            onClick={() => cambiarEstado(registro, 'rechazada')}
                          >
                            Rechazar
                          </button>
                          </>
                        )}
                        <Link className="btn btn-sm btn-outline-primary" to={`${base}/${registro.id}/editar`}>Editar</Link>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(registro)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="crud-form-section">
      <button type="button" className="btn btn-outline-secondary mb-3" onClick={() => navigate(base)}>
        ← Volver atrás
      </button>
      <div className="card crud-form-card">
        <div className="card-body p-4 p-lg-5">
          <h1 className="mb-4">{mode === 'create' ? 'Crear' : 'Editar'} {recurso.singular}</h1>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={guardar}>
            {recurso.campos.map((campo) => {
              const requerido = campo.requerido && !(mode === 'edit' && campo.opcionalAlEditar);
              if (campo.tipo === 'checkbox') {
                return (
                  <div className="form-check mb-3" key={campo.nombre}>
                    <input
                      className="form-check-input"
                      id={campo.nombre}
                      type="checkbox"
                      checked={Boolean(form[campo.nombre])}
                      onChange={(event) => setForm({ ...form, [campo.nombre]: event.target.checked })}
                    />
                    <label className="form-check-label" htmlFor={campo.nombre}>{campo.etiqueta}</label>
                  </div>
                );
              }

              return (
                <div className="mb-3" key={campo.nombre}>
                  <label className="form-label" htmlFor={campo.nombre}>{campo.etiqueta}</label>
                  {campo.tipo === 'textarea' ? (
                    <textarea
                      className="form-control"
                      id={campo.nombre}
                      required={requerido}
                      maxLength={campo.maxLength}
                      value={form[campo.nombre]}
                      onChange={(event) => setForm({ ...form, [campo.nombre]: event.target.value })}
                    />
                  ) : campo.tipo === 'select' ? (
                    <select
                      className="form-select"
                      id={campo.nombre}
                      required={requerido}
                      value={form[campo.nombre]}
                      onChange={(event) => setForm({ ...form, [campo.nombre]: event.target.value })}
                    >
                      <option value="">Seleccioná una opción</option>
                      {(campo.fuente ? opciones[campo.fuente] || [] : campo.opciones || []).map((opcion) => {
                        const value = campo.fuente ? opcion.id : opcion[0];
                        const label = campo.fuente
                          ? `${opcion.id} — ${opcion.nombre}`
                          : opcion[1];
                        return <option key={value} value={value}>{label}</option>;
                      })}
                    </select>
                  ) : (
                    <input
                      className="form-control"
                      id={campo.nombre}
                      type={campo.tipo || 'text'}
                      required={requerido}
                      minLength={campo.minLength}
                      maxLength={campo.maxLength}
                      min={campo.min}
                      max={campo.max}
                      step={campo.step}
                      value={form[campo.nombre]}
                      onChange={(event) => setForm({ ...form, [campo.nombre]: event.target.value })}
                    />
                  )}
                  {campo.opcionalAlEditar && mode === 'edit' && (
                    <div className="form-text">Dejá vacío para conservar el valor actual.</div>
                  )}
                </div>
              );
            })}
            <button className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
