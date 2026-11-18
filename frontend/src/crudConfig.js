export const recursos = {
  usuarios: {
    nombre: 'Usuarios',
    singular: 'usuario',
    columnas: ['id', 'nombre', 'email', 'rol', 'creado_en'],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true, maxLength: 100 },
      { nombre: 'email', etiqueta: 'Email', tipo: 'email', requerido: true, maxLength: 150 },
      { nombre: 'password', etiqueta: 'Contraseña', tipo: 'password', requerido: true, opcionalAlEditar: true, minLength: 6 },
      { nombre: 'rol', etiqueta: 'Rol', tipo: 'select', requerido: true, opciones: [
        ['usuario', 'Usuario'], ['admin', 'Administrador'], ['organizador', 'Organizador']
      ] }
    ]
  },
  etiquetas: {
    nombre: 'Etiquetas',
    singular: 'etiqueta',
    columnas: ['id', 'nombre'],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true, maxLength: 50 }
    ]
  },
  actividades: {
    nombre: 'Actividades',
    singular: 'actividad',
    columnas: ['nombre', 'imagen_url', 'etiqueta', 'organizador', 'estado', 'precios'],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true, maxLength: 150 },
      { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', requerido: true, maxLength: 1000 },
      { nombre: 'horario', etiqueta: 'Horario', requerido: true, maxLength: 100 },
      { nombre: 'precio_mensual', etiqueta: 'Precio mensual', tipo: 'number', requerido: true, min: 0, step: '0.01' },
      { nombre: 'precio_semanal', etiqueta: 'Precio semanal', tipo: 'number', requerido: true, min: 0, step: '0.01' },
      { nombre: 'imagen_url', etiqueta: 'URL de imagen', tipo: 'url', maxLength: 500 },
      { nombre: 'etiqueta_id', etiqueta: 'Etiqueta', tipo: 'select', fuente: 'etiquetas', requerido: true },
      { nombre: 'organizador_id', etiqueta: 'Organizador', tipo: 'select', fuente: 'usuarios', requerido: true },
      { nombre: 'estado', etiqueta: 'Estado', tipo: 'select', requerido: true, opciones: [
        ['pendiente', 'Pendiente'], ['aprobada', 'Aprobada'], ['rechazada', 'Rechazada']
      ] }
    ]
  },
  inscripciones: {
    nombre: 'Inscripciones',
    singular: 'inscripción',
    columnas: ['id', 'usuario', 'actividad', 'asistio', 'creado_en'],
    campos: [
      { nombre: 'usuario_id', etiqueta: 'Usuario', tipo: 'select', fuente: 'usuarios', requerido: true },
      { nombre: 'actividad_id', etiqueta: 'Actividad', tipo: 'select', fuente: 'actividades', requerido: true },
      { nombre: 'asistio', etiqueta: 'Asistió', tipo: 'checkbox' }
    ]
  },
  resenas: {
    nombre: 'Reseñas',
    singular: 'reseña',
    columnas: ['id', 'usuario', 'actividad', 'estrellas', 'comentario', 'creado_en'],
    campos: [
      { nombre: 'usuario_id', etiqueta: 'Usuario', tipo: 'select', fuente: 'usuarios', requerido: true },
      { nombre: 'actividad_id', etiqueta: 'Actividad', tipo: 'select', fuente: 'actividades', requerido: true },
      { nombre: 'estrellas', etiqueta: 'Calificación (1 a 5)', tipo: 'number', requerido: true, min: 1, max: 5, step: 1 },
      { nombre: 'comentario', etiqueta: 'Comentario', tipo: 'textarea', maxLength: 500 }
    ]
  }
};
