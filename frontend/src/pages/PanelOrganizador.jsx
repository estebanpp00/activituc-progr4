import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import ImagenActividad from '../components/ImagenActividad.jsx';
import ModalConfirmacion from '../components/ModalConfirmacion.jsx';
import { useNotificaciones } from '../store.js';

const formularioVacio = {
  nombre: '',
  descripcion: '',
  horario: '',
  precio_mensual: '',
  precio_semanal: '',
  imagen_url: '',
  etiqueta_id: ''
};

const estados = {
  pendiente: ['Pendiente', 'text-bg-warning'],
  aprobada: ['Aprobada', 'text-bg-success'],
  rechazada: ['Rechazada', 'text-bg-danger']
};

function mostrarFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleString('es-AR') : '—';
}

export default function PanelOrganizador() {
  const navigate = useNavigate();
  const notificar = useNotificaciones((state) => state.notificar);
  const [actividades, setActividades] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [form, setForm] = useState(formularioVacio);
  const [actividadEditando, setActividadEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [actividadEliminar, setActividadEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarDatos = async () => {
    const [misActividades, misInscripciones, etiquetasDisponibles] = await Promise.all([
      api('/organizador/actividades'),
      api('/organizador/inscripciones'),
      api('/etiquetas')
    ]);
    setActividades(misActividades);
    setInscripciones(misInscripciones);
    setEtiquetas(etiquetasDisponibles);
  };

  useEffect(() => {
    let vigente = true;
    Promise.all([
      api('/organizador/actividades'),
      api('/organizador/inscripciones'),
      api('/etiquetas')
    ])
      .then(([misActividades, misInscripciones, etiquetasDisponibles]) => {
        if (!vigente) return;
        setActividades(misActividades);
        setInscripciones(misInscripciones);
        setEtiquetas(etiquetasDisponibles);
      })
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => { vigente = false; };
  }, []);

  const limpiarFormulario = () => {
    setForm(formularioVacio);
    setActividadEditando(null);
  };

  const cambiarCampo = (event) => {
    setForm((actual) => ({ ...actual, [event.target.name]: event.target.value }));
  };

  const guardarActividad = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    const estabaEditando = Boolean(actividadEditando);
    try {
      const body = {
        ...form,
        precio_mensual: Number(form.precio_mensual),
        precio_semanal: Number(form.precio_semanal),
        etiqueta_id: Number(form.etiqueta_id)
      };
      await api(
        actividadEditando
          ? `/organizador/actividades/${actividadEditando}`
          : '/organizador/actividades',
        { method: actividadEditando ? 'PUT' : 'POST', body }
      );
      await cargarDatos();
      limpiarFormulario();
      notificar({
        tipo: 'success',
        titulo: estabaEditando ? 'Actividad actualizada' : 'Actividad enviada a revisión',
        mensaje: estabaEditando
          ? 'Los cambios quedaron pendientes de revisión.'
          : 'La actividad se creó y quedó pendiente de revisión.'
      });
    } catch (e) {
      setError(e.message);
      notificar({ tipo: 'danger', titulo: 'No se pudo guardar la actividad', mensaje: e.message });
    } finally {
      setGuardando(false);
    }
  };

  const editarActividad = (actividad) => {
    setActividadEditando(actividad.id);
    setForm({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion,
      horario: actividad.horario,
      precio_mensual: String(actividad.precio_mensual),
      precio_semanal: String(actividad.precio_semanal),
      imagen_url: actividad.imagen_url || '',
      etiqueta_id: String(actividad.etiqueta_id)
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarActividad = async () => {
    if (!actividadEliminar) return;
    setError('');
    setEliminando(true);
    try {
      await api(`/organizador/actividades/${actividadEliminar.id}`, { method: 'DELETE' });
      setActividades((actuales) => actuales.filter((item) => item.id !== actividadEliminar.id));
      setInscripciones((actuales) => actuales.filter((item) => item.actividad_id !== actividadEliminar.id));
      if (actividadEditando === actividadEliminar.id) limpiarFormulario();
      notificar({ tipo: 'success', titulo: 'Actividad eliminada', mensaje: 'La actividad se eliminó correctamente.' });
      setActividadEliminar(null);
    } catch (e) {
      setError(e.message);
      notificar({ tipo: 'danger', titulo: 'No se pudo eliminar la actividad', mensaje: e.message });
    } finally {
      setEliminando(false);
    }
  };

  const cambiarAsistencia = async (inscripcion) => {
    setError('');
    const asistio = Number(inscripcion.asistio) === 1 ? 0 : 1;
    try {
      await api(`/organizador/inscripciones/${inscripcion.id}/asistencia`, {
        method: 'PATCH',
        body: { asistio }
      });
      setInscripciones((actuales) => actuales.map((item) => (
        item.id === inscripcion.id ? { ...item, asistio } : item
      )));
      notificar({
        tipo: 'success',
        titulo: asistio ? 'Asistencia confirmada' : 'Asistencia desmarcada',
        mensaje: `${inscripcion.usuario} · ${inscripcion.actividad}`
      });
    } catch (e) {
      setError(e.message);
      notificar({ tipo: 'danger', titulo: 'No se pudo actualizar la asistencia', mensaje: e.message });
    }
  };

  return (
    <section>
      <button type="button" className="btn btn-outline-secondary mb-3" onClick={() => navigate('/')}>
        ← Volver atrás
      </button>
      <h1 className="mb-4">Panel del organizador</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <ModalConfirmacion
        abierto={Boolean(actividadEliminar)}
        titulo="Eliminar actividad"
        mensaje={actividadEliminar ? `¿Seguro que querés eliminar “${actividadEliminar.nombre}”? Esta acción no se puede deshacer.` : ''}
        textoConfirmar="Eliminar actividad"
        cargando={eliminando}
        onConfirmar={eliminarActividad}
        onCancelar={() => setActividadEliminar(null)}
      />
      {cargando ? <p>Cargando...</p> : (
        <>
          <section className="mb-5">
            <h2 className="h3 mb-3">Mis actividades</h2>
            <div className="card mb-4">
              <div className="card-body">
                <h3 className="h5">{actividadEditando ? 'Editar actividad' : 'Crear actividad'}</h3>
                <form onSubmit={guardarActividad}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="actividad-nombre">Nombre</label>
                      <input className="form-control" id="actividad-nombre" name="nombre" maxLength="150" required value={form.nombre} onChange={cambiarCampo} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="actividad-etiqueta">Etiqueta</label>
                      <select className="form-select" id="actividad-etiqueta" name="etiqueta_id" required value={form.etiqueta_id} onChange={cambiarCampo}>
                        <option value="">Seleccioná una etiqueta</option>
                        {etiquetas.map((etiqueta) => (
                          <option key={etiqueta.id} value={etiqueta.id}>{etiqueta.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="actividad-descripcion">Descripción</label>
                      <textarea className="form-control" id="actividad-descripcion" name="descripcion" maxLength="1000" required value={form.descripcion} onChange={cambiarCampo} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="actividad-horario">Horario</label>
                      <input className="form-control" id="actividad-horario" name="horario" maxLength="100" required value={form.horario} onChange={cambiarCampo} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="actividad-precio-mensual">Precio mensual</label>
                      <input className="form-control" id="actividad-precio-mensual" name="precio_mensual" type="number" min="0" max="99999999.99" step="0.01" required value={form.precio_mensual} onChange={cambiarCampo} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" htmlFor="actividad-precio-semanal">Precio semanal</label>
                      <input className="form-control" id="actividad-precio-semanal" name="precio_semanal" type="number" min="0" max="99999999.99" step="0.01" required value={form.precio_semanal} onChange={cambiarCampo} />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="actividad-imagen">URL de imagen (opcional)</label>
                      <input className="form-control" id="actividad-imagen" name="imagen_url" type="url" maxLength="500" value={form.imagen_url} onChange={cambiarCampo} />
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <button className="btn btn-primary" disabled={guardando}>
                      {guardando ? 'Guardando...' : actividadEditando ? 'Guardar cambios' : 'Crear actividad'}
                    </button>
                    {actividadEditando && (
                      <button type="button" className="btn btn-outline-secondary" onClick={limpiarFormulario}>
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
            {actividades.length ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Imagen</th><th>Actividad</th><th>Etiqueta</th><th>Horario</th><th>Estado</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actividades.map((actividad) => {
                      const [estadoNombre, estadoClase] = estados[actividad.estado] || [actividad.estado, 'text-bg-secondary'];
                      return (
                        <tr key={actividad.id}>
                          <td>
                            <ImagenActividad
                              className="actividad-imagen-tabla"
                              src={actividad.imagen_url}
                              alt={`Imagen de ${actividad.nombre}`}
                            />
                          </td>
                          <td>{actividad.nombre}</td>
                          <td>{actividad.etiqueta}</td>
                          <td>{actividad.horario}</td>
                          <td><span className={`badge ${estadoClase}`}>{estadoNombre}</span></td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                title={`Editar ${actividad.nombre}`}
                                onClick={() => editarActividad(actividad)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title={`Eliminar ${actividad.nombre}`}
                                onClick={() => setActividadEliminar(actividad)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p>Aún no tenés actividades.</p>}
          </section>

          <section>
            <h2 className="h3 mb-3">Control de asistencias</h2>
            {inscripciones.length ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr><th>Inscripto</th><th>Actividad</th><th>Fecha de inscripción</th><th>Asistencia</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    {inscripciones.map((inscripcion) => {
                      const asistio = Number(inscripcion.asistio) === 1;
                      return (
                        <tr key={inscripcion.id}>
                          <td>{inscripcion.usuario}</td>
                          <td>{inscripcion.actividad}</td>
                          <td>{mostrarFecha(inscripcion.creado_en)}</td>
                          <td>{asistio ? 'Asistió' : 'Pendiente'}</td>
                          <td>
                            <div className="table-actions">
                            <button
                              className={`btn btn-sm ${asistio ? 'btn-outline-secondary' : 'btn-success'}`}
                              title={asistio ? 'Desmarcar asistencia' : 'Confirmar asistencia'}
                              onClick={() => cambiarAsistencia(inscripcion)}
                            >
                              {asistio ? 'Desmarcar asistencia' : 'Marcar asistencia'}
                            </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p>Todavía no hay inscriptos en tus actividades.</p>}
          </section>
        </>
      )}
    </section>
  );
}
