CREATE DATABASE IF NOT EXISTS activituc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE activituc;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol ENUM('admin', 'organizador', 'usuario') NOT NULL DEFAULT 'usuario',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS etiquetas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS actividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion VARCHAR(1000) NOT NULL,
  horario VARCHAR(100) NOT NULL,
  precio_mensual DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_semanal DECIMAL(10,2) NOT NULL DEFAULT 0,
  imagen_url VARCHAR(500) NULL,
  etiqueta_id INT NOT NULL,
  organizador_id INT NOT NULL,
  estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'aprobada',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_actividades_etiqueta
    FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_organizador
    FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

SET @estado_actividad_existe = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'actividades'
    AND COLUMN_NAME = 'estado'
);
SET @agregar_estado_actividad = IF(
  @estado_actividad_existe = 0,
  'ALTER TABLE actividades ADD COLUMN estado ENUM(''pendiente'', ''aprobada'', ''rechazada'') NOT NULL DEFAULT ''aprobada'' AFTER organizador_id',
  'SELECT 1'
);
PREPARE sentencia_estado_actividad FROM @agregar_estado_actividad;
EXECUTE sentencia_estado_actividad;
DEALLOCATE PREPARE sentencia_estado_actividad;

CREATE TABLE IF NOT EXISTS inscripciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  actividad_id INT NOT NULL,
  asistio TINYINT(1) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, actividad_id),
  CONSTRAINT fk_inscripciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_inscripciones_actividad
    FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resenas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  actividad_id INT NOT NULL,
  estrellas TINYINT NOT NULL,
  comentario VARCHAR(500) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, actividad_id),
  CHECK (estrellas BETWEEN 1 AND 5),
  CONSTRAINT fk_resenas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_resenas_actividad
    FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO etiquetas (nombre) VALUES
  ('Deporte'), ('Cultura'), ('Ocio'), ('Estudio'), ('Socialización');

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol) VALUES
  ('Administración ActiviTuc', 'admin.demo@activituc.test', '$2a$10$ioBr/CMylEOkr4XMC4QioO7ZGaqeoXkuXUuQEHMiy/dnutSebnfRO', 'admin'),
  ('Lucía González', 'organizador.demo@activituc.test', '$2a$10$cLf0Ah6Z9gp1s.AtCizTh.9fN5/euMS/A/owz/oT6tm0NJLOhweKa', 'organizador'),
  ('Mateo Juárez', 'usuario.demo@activituc.test', '$2a$10$jpSN8xP3Sv5.XBKNEawiOuQdYr.cSBFvT6jc9pOMinENnoFeGZT7e', 'usuario');

INSERT IGNORE INTO actividades
  (nombre, descripcion, horario, precio_mensual, precio_semanal, imagen_url, etiqueta_id, organizador_id)
SELECT 'Caminata guiada por el Parque Sierra de San Javier',
       'Recorrido grupal por senderos de las yungas tucumanas con pausas para conocer la flora local.',
       'Sábados de 08:00 a 11:00', 18000.00, 6000.00,
       'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80', e.id, u.id
FROM etiquetas e
JOIN usuarios u ON u.email = 'organizador.demo@activituc.test'
WHERE e.nombre = 'Deporte'
  AND NOT EXISTS (
    SELECT 1 FROM actividades
    WHERE nombre = 'Caminata guiada por el Parque Sierra de San Javier'
  );

INSERT IGNORE INTO actividades
  (nombre, descripcion, horario, precio_mensual, precio_semanal, imagen_url, etiqueta_id, organizador_id)
SELECT 'Taller de folclore tucumano',
       'Clases recreativas de zamba y chacarera para principiantes, con espacio para practicar en grupo.',
       'Martes y jueves de 19:00 a 20:30', 24000.00, 7000.00,
       'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', e.id, u.id
FROM etiquetas e
JOIN usuarios u ON u.email = 'organizador.demo@activituc.test'
WHERE e.nombre = 'Cultura'
  AND NOT EXISTS (
    SELECT 1 FROM actividades
    WHERE nombre = 'Taller de folclore tucumano'
  );

INSERT IGNORE INTO actividades
  (nombre, descripcion, horario, precio_mensual, precio_semanal, imagen_url, etiqueta_id, organizador_id)
SELECT 'Visita cultural a la Casa Histórica',
       'Encuentro para recorrer la Casa Histórica de la Independencia y conversar sobre la historia de Tucumán.',
       'Sábados de 10:00 a 12:00', 0.00, 0.00,
       'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80', e.id, u.id
FROM etiquetas e
JOIN usuarios u ON u.email = 'organizador.demo@activituc.test'
WHERE e.nombre = 'Cultura'
  AND NOT EXISTS (
    SELECT 1 FROM actividades
    WHERE nombre = 'Visita cultural a la Casa Histórica'
  );

INSERT IGNORE INTO actividades
  (nombre, descripcion, horario, precio_mensual, precio_semanal, imagen_url, etiqueta_id, organizador_id)
SELECT 'Observación de aves en Horco Molle',
       'Salida tranquila para observar aves de las yungas en el entorno de la Reserva Experimental Horco Molle.',
       'Domingos de 07:30 a 10:00', 15000.00, 5000.00,
       'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', e.id, u.id
FROM etiquetas e
JOIN usuarios u ON u.email = 'organizador.demo@activituc.test'
WHERE e.nombre = 'Ocio'
  AND NOT EXISTS (
    SELECT 1 FROM actividades
    WHERE nombre = 'Observación de aves en Horco Molle'
  );

INSERT IGNORE INTO actividades
  (nombre, descripcion, horario, precio_mensual, precio_semanal, imagen_url, etiqueta_id, organizador_id)
SELECT 'Apoyo escolar comunitario',
       'Espacio grupal de acompañamiento en matemática y lengua para estudiantes de nivel primario.',
       'Lunes y miércoles de 17:00 a 18:30', 12000.00, 4000.00,
       'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80', e.id, u.id
FROM etiquetas e
JOIN usuarios u ON u.email = 'organizador.demo@activituc.test'
WHERE e.nombre = 'Estudio'
  AND NOT EXISTS (
    SELECT 1 FROM actividades
    WHERE nombre = 'Apoyo escolar comunitario'
  );

INSERT IGNORE INTO inscripciones (usuario_id, actividad_id, asistio)
SELECT u.id, a.id, 1
FROM usuarios u
JOIN actividades a ON a.nombre IN (
  'Taller de folclore tucumano',
  'Visita cultural a la Casa Histórica'
)
WHERE u.email = 'usuario.demo@activituc.test';

INSERT IGNORE INTO inscripciones (usuario_id, actividad_id, asistio)
SELECT u.id, a.id, 0
FROM usuarios u
JOIN actividades a ON a.nombre IN (
  'Caminata guiada por el Parque Sierra de San Javier',
  'Observación de aves en Horco Molle'
)
WHERE u.email = 'usuario.demo@activituc.test';

INSERT IGNORE INTO resenas (usuario_id, actividad_id, estrellas, comentario)
SELECT u.id, a.id, 5, 'Una propuesta muy linda para conocer y compartir la cultura tucumana.'
FROM usuarios u
JOIN actividades a ON a.nombre = 'Taller de folclore tucumano'
WHERE u.email = 'usuario.demo@activituc.test';

INSERT IGNORE INTO resenas (usuario_id, actividad_id, estrellas, comentario)
SELECT u.id, a.id, 5, 'La visita fue interesante y el encuentro estuvo muy bien organizado.'
FROM usuarios u
JOIN actividades a ON a.nombre = 'Visita cultural a la Casa Histórica'
WHERE u.email = 'usuario.demo@activituc.test';

INSERT IGNORE INTO resenas (usuario_id, actividad_id, estrellas, comentario)
SELECT u.id, a.id, 4, 'Una salida agradable; recomiendo llevar agua y calzado cómodo.'
FROM usuarios u
JOIN actividades a ON a.nombre = 'Caminata guiada por el Parque Sierra de San Javier'
WHERE u.email = 'usuario.demo@activituc.test';

INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol) VALUES
  ('Santiago Fernández', 'participante001@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Valentina Romero', 'participante002@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Tomás Herrera', 'participante003@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Camila Díaz', 'participante004@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Benjamín Acosta', 'participante005@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Martina López', 'participante006@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Joaquín Torres', 'participante007@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Sofía Medina', 'participante008@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Lautaro Sosa', 'participante009@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Catalina Pereyra', 'participante010@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Franco Molina', 'participante011@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Julieta Rojas', 'participante012@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Agustín Castillo', 'participante013@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Emilia Navarro', 'participante014@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Thiago Luna', 'participante015@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Mía Gómez', 'participante016@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Facundo Córdoba', 'participante017@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Abril Vega', 'participante018@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Nicolás Ibarra', 'participante019@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Renata Figueroa', 'participante020@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Máximo Cabrera', 'participante021@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Josefina Silva', 'participante022@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Bautista Correa', 'participante023@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Pilar Aguirre', 'participante024@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Ramiro Giménez', 'participante025@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Olivia Campos', 'participante026@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Dante Morales', 'participante027@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Lola Benítez', 'participante028@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Ignacio Núñez', 'participante029@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Alma Quiroga', 'participante030@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Pedro Álvarez', 'participante031@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Bianca Salas', 'participante032@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Simón Ruiz', 'participante033@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Guadalupe Vázquez', 'participante034@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('León Ponce', 'participante035@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Delfina Arias', 'participante036@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Matías Toledo', 'participante037@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Malena Suárez', 'participante038@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Bruno Ferreyra', 'participante039@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Aitana Acuña', 'participante040@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Felipe Giménez', 'participante041@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Bárbara Robles', 'participante042@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Ciro Mansilla', 'participante043@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Violeta Paz', 'participante044@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Lorenzo Bravo', 'participante045@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Amparo Romero', 'participante046@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Ezequiel Roldán', 'participante047@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Uma Herrera', 'participante048@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Lisandro Ojeda', 'participante049@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Candelaria Molina', 'participante050@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Valentín Bravo', 'participante051@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Manuela Funes', 'participante052@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Julián Carrizo', 'participante053@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Luz Fernández', 'participante054@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Gabriel Soria', 'participante055@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Elena Díaz', 'participante056@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Andrés Vera', 'participante057@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Mora Ávila', 'participante058@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Esteban Díaz', 'participante059@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Clara Bustos', 'participante060@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Alejo Pérez', 'participante061@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Rocío Pereyra', 'participante062@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Gonzalo Díaz', 'participante063@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Florencia Suárez', 'participante064@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'organizador'),
  ('Mariano Ríos', 'participante065@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Carolina Méndez', 'participante066@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario'),
  ('Pablo Castro', 'participante067@activituc.test', '$2a$10$PSfa3AvkhOV8qYmjLXQE2OiOb41fNHMMUeF8Ot3bsLRZA3OaCCEDe', 'usuario');

INSERT IGNORE INTO actividades
  (nombre, descripcion, horario, precio_mensual, precio_semanal, imagen_url, etiqueta_id, organizador_id)
SELECT datos.nombre, datos.descripcion, datos.horario, datos.precio_mensual, datos.precio_semanal,
       datos.imagen_url, e.id, u.id
FROM (
  SELECT 'Entrenamiento funcional en Plaza Urquiza' AS nombre, 'Circuito al aire libre para todos los niveles en San Miguel de Tucumán.' AS descripcion, 'Lunes y miércoles de 18:30 a 20:00' AS horario, 18000.00 AS precio_mensual, 5000.00 AS precio_semanal, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80' AS imagen_url, 'Deporte' AS etiqueta, 'participante004@activituc.test' AS organizador
  UNION ALL SELECT 'Yoga al atardecer en Yerba Buena', 'Clases de movilidad y respiración con vista a las yungas.', 'Martes y jueves de 18:00 a 19:15', 20000, 6000, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80', 'Deporte', 'participante008@activituc.test'
  UNION ALL SELECT 'Ciclismo recreativo por avenida Perón', 'Salida grupal de ritmo moderado por Yerba Buena, con punto de encuentro en el parque.', 'Sábados de 08:00 a 10:30', 12000, 4000, 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=1200&q=80', 'Deporte', 'participante012@activituc.test'
  UNION ALL SELECT 'Escuela de básquet en barrio Sur', 'Prácticas recreativas de fundamentos y juego en equipo en San Miguel de Tucumán.', 'Martes y viernes de 19:00 a 20:30', 22000, 6500, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80', 'Deporte', 'participante016@activituc.test'
  UNION ALL SELECT 'Trekking de iniciación en San Javier', 'Caminata de dificultad baja por senderos señalizados, con guía local.', 'Domingos de 08:00 a 12:00', 16000, 5000, 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80', 'Deporte', 'participante020@activituc.test'
  UNION ALL SELECT 'Pádel social en Tafí Viejo', 'Encuentros recreativos de pádel con rotación de parejas y nivel inicial.', 'Miércoles de 20:00 a 21:30', 25000, 7000, 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80', 'Deporte', 'participante024@activituc.test'
  UNION ALL SELECT 'Running para principiantes en Parque 9 de Julio', 'Entrenamiento progresivo y acompañamiento para empezar a correr.', 'Lunes y jueves de 07:00 a 08:00', 14000, 4500, 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80', 'Deporte', 'participante028@activituc.test'
  UNION ALL SELECT 'Taller de cerámica en Yerba Buena', 'Modelado manual y decoración de piezas en un espacio de trabajo compartido.', 'Sábados de 15:00 a 17:30', 28000, 8000, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80', 'Cultura', 'participante032@activituc.test'
  UNION ALL SELECT 'Coro abierto en el centro tucumano', 'Ensayo coral para voces con o sin experiencia, con repertorio popular argentino.', 'Lunes de 20:00 a 21:30', 10000, 3500, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80', 'Cultura', 'participante036@activituc.test'
  UNION ALL SELECT 'Fotografía urbana en San Miguel', 'Recorrido práctico para aprender composición y retratar rincones de la ciudad.', 'Sábados de 16:00 a 18:00', 18000, 5500, 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80', 'Cultura', 'participante040@activituc.test'
  UNION ALL SELECT 'Danzas folclóricas en Tafí Viejo', 'Clases participativas de zamba, chacarera y gato para jóvenes y adultos.', 'Martes y jueves de 20:00 a 21:30', 22000, 6500, 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80', 'Cultura', 'participante044@activituc.test'
  UNION ALL SELECT 'Club de lectura en Yerba Buena', 'Lectura compartida de narrativa argentina y conversación en grupo.', 'Viernes de 18:30 a 20:00', 8000, 2500, 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80', 'Cultura', 'participante048@activituc.test'
  UNION ALL SELECT 'Taller de teatro comunitario', 'Ejercicios de expresión e improvisación teatral en un espacio barrial de la capital.', 'Miércoles de 19:00 a 21:00', 16000, 5000, 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80', 'Cultura', 'participante052@activituc.test'
  UNION ALL SELECT 'Pintura y dibujo en Casa de la Cultura', 'Encuentros de dibujo y pintura para explorar técnicas y compartir trabajos.', 'Sábados de 10:00 a 12:00', 20000, 6000, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80', 'Cultura', 'participante056@activituc.test'
  UNION ALL SELECT 'Cine debate en barrio Norte', 'Proyección mensual de cine argentino seguida de una charla abierta.', 'Viernes de 20:00 a 22:00', 5000, 2000, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80', 'Cultura', 'participante060@activituc.test'
  UNION ALL SELECT 'Picnic y juegos en Parque Avellaneda', 'Tarde distendida con juegos de mesa y merienda compartida en San Miguel.', 'Domingos de 16:00 a 18:30', 0, 0, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', 'Ocio', 'participante064@activituc.test'
  UNION ALL SELECT 'Observación del cielo en San Javier', 'Encuentro de iniciación a la astronomía y observación según las condiciones del tiempo.', 'Sábados de 20:00 a 22:00', 10000, 3000, 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80', 'Ocio', 'participante004@activituc.test'
  UNION ALL SELECT 'Juegos de mesa en Tafí Viejo', 'Tarde para conocer juegos modernos y compartir partidas con nuevos amigos.', 'Jueves de 18:00 a 20:00', 6000, 2000, 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1200&q=80', 'Ocio', 'participante008@activituc.test'
  UNION ALL SELECT 'Paseo fotográfico por el Jardín Botánico', 'Recorrido tranquilo para descubrir y fotografiar especies del parque de Horco Molle.', 'Sábados de 09:00 a 11:00', 5000, 1500, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', 'Ocio', 'participante012@activituc.test'
  UNION ALL SELECT 'Cocina regional tucumana', 'Preparación compartida de empanadas y recetas tradicionales en San Miguel.', 'Sábados de 11:00 a 13:30', 24000, 7000, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80', 'Ocio', 'participante016@activituc.test'
  UNION ALL SELECT 'Tarde de juegos en El Cadillal', 'Jornada recreativa al aire libre con juegos grupales y merienda a la canasta.', 'Domingos de 15:00 a 18:00', 0, 0, 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80', 'Ocio', 'participante020@activituc.test'
  UNION ALL SELECT 'Huerta urbana en barrio Ciudadela', 'Aprendizaje práctico de siembra y cuidados de una huerta comunitaria.', 'Sábados de 09:00 a 11:00', 9000, 3000, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80', 'Ocio', 'participante024@activituc.test'
  UNION ALL SELECT 'Paseo en bicicleta por Yerba Buena', 'Circuito recreativo por calles tranquilas y espacios verdes de la ciudad.', 'Domingos de 08:30 a 10:30', 7000, 2500, 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=1200&q=80', 'Ocio', 'participante028@activituc.test'
  UNION ALL SELECT 'Apoyo de matemática para secundaria', 'Práctica colaborativa de contenidos escolares con acompañamiento docente.', 'Martes y jueves de 17:00 a 18:30', 12000, 4000, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80', 'Estudio', 'participante032@activituc.test'
  UNION ALL SELECT 'Inglés conversacional en San Miguel', 'Práctica oral en grupos reducidos para niveles inicial e intermedio.', 'Miércoles de 18:30 a 20:00', 16000, 5000, 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', 'Estudio', 'participante036@activituc.test'
  UNION ALL SELECT 'Técnicas de estudio para ingresantes', 'Organización del tiempo, lectura comprensiva y estrategias para preparar exámenes.', 'Lunes de 18:00 a 19:30', 10000, 3500, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80', 'Estudio', 'participante040@activituc.test'
  UNION ALL SELECT 'Club de ciencias en Tafí Viejo', 'Experimentos sencillos y actividades de exploración para adolescentes.', 'Viernes de 17:30 a 19:00', 14000, 4500, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80', 'Estudio', 'participante044@activituc.test'
  UNION ALL SELECT 'Programación inicial en Yerba Buena', 'Taller práctico para dar los primeros pasos en lógica y programación.', 'Sábados de 10:00 a 12:00', 22000, 6500, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', 'Estudio', 'participante048@activituc.test'
  UNION ALL SELECT 'Lectura y escritura creativa', 'Consignas de escritura breve y devolución grupal en un ambiente amigable.', 'Jueves de 19:00 a 20:30', 10000, 3500, 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80', 'Estudio', 'participante052@activituc.test'
  UNION ALL SELECT 'Ajedrez para todas las edades', 'Aprendizaje y práctica de ajedrez con partidas guiadas en el centro.', 'Sábados de 16:00 a 18:00', 8000, 2500, 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1200&q=80', 'Estudio', 'participante056@activituc.test'
  UNION ALL SELECT 'Apoyo universitario de física', 'Resolución colaborativa de ejercicios para estudiantes de nivel universitario.', 'Martes de 19:00 a 21:00', 15000, 5000, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80', 'Estudio', 'participante060@activituc.test'
  UNION ALL SELECT 'Intercambio de idiomas en Yerba Buena', 'Encuentro informal para practicar español y otros idiomas en pequeños grupos.', 'Viernes de 19:00 a 20:30', 0, 0, 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante064@activituc.test'
  UNION ALL SELECT 'Ronda de mate en Plaza Independencia', 'Espacio abierto para conversar, conocerse y compartir una tarde en la plaza.', 'Sábados de 17:00 a 18:30', 0, 0, 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante004@activituc.test'
  UNION ALL SELECT 'Caminata grupal por el parque de Tafí Viejo', 'Paseo de ritmo tranquilo para conversar y disfrutar de los espacios verdes.', 'Domingos de 09:00 a 10:30', 0, 0, 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante008@activituc.test'
  UNION ALL SELECT 'Cena comunitaria en barrio Sur', 'Encuentro para compartir platos caseros y conocer vecinos de la zona.', 'Viernes de 20:30 a 22:00', 5000, 2000, 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante012@activituc.test'
  UNION ALL SELECT 'Merienda y charla en Yerba Buena', 'Ronda de conversación y merienda compartida en un espacio accesible.', 'Miércoles de 17:00 a 18:30', 3500, 1500, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante016@activituc.test'
  UNION ALL SELECT 'Voluntariado en refugio de animales', 'Jornada de colaboración y cuidado responsable junto a una organización local.', 'Sábados de 09:00 a 12:00', 0, 0, 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante020@activituc.test'
  UNION ALL SELECT 'Encuentro de fotografía en el centro', 'Salida abierta para recorrer la ciudad y compartir miradas fotográficas.', 'Domingos de 16:00 a 18:00', 0, 0, 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante024@activituc.test'
  UNION ALL SELECT 'Feria de intercambio de libros', 'Traé un libro para intercambiar y sumate a una tarde de lectura y conversación.', 'Sábados de 16:00 a 18:00', 0, 0, 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante028@activituc.test'
  UNION ALL SELECT 'Música acústica entre vecinos', 'Encuentro de música en vivo con artistas locales y espacio para compartir.', 'Viernes de 20:00 a 22:00', 4000, 1500, 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante032@activituc.test'
  UNION ALL SELECT 'Club de caminatas para conocer gente', 'Recorrido accesible por el Parque 9 de Julio con una pausa para conversar.', 'Domingos de 09:00 a 11:00', 0, 0, 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante036@activituc.test'
  UNION ALL SELECT 'Tarde de juegos y merienda en San Javier', 'Encuentro recreativo en grupo con juegos sencillos y merienda a la canasta.', 'Sábados de 15:00 a 17:30', 0, 0, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante040@activituc.test'
  UNION ALL SELECT 'Taller de percusión grupal', 'Actividad musical introductoria para aprender ritmos y tocar en conjunto.', 'Martes de 19:30 a 21:00', 18000, 5500, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante044@activituc.test'
  UNION ALL SELECT 'Visita guiada por el casco histórico', 'Paseo grupal por edificios y plazas emblemáticas de San Miguel de Tucumán.', 'Sábados de 10:00 a 12:00', 3000, 1000, 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante048@activituc.test'
  UNION ALL SELECT 'Picnic de bienvenida en El Cadillal', 'Jornada para compartir al aire libre y dar la bienvenida a nuevos participantes.', 'Domingos de 15:00 a 18:00', 0, 0, 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante052@activituc.test'
  UNION ALL SELECT 'Café y conversación para nuevos vecinos', 'Encuentro tranquilo para conversar y conectar con personas de la comunidad.', 'Jueves de 18:00 a 19:30', 2500, 1000, 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante056@activituc.test'
  UNION ALL SELECT 'Jornada de limpieza en Parque Avellaneda', 'Actividad comunitaria de cuidado del espacio público con materiales provistos.', 'Sábados de 09:00 a 11:00', 0, 0, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante060@activituc.test'
  UNION ALL SELECT 'Muestra de talentos barrial', 'Tarde abierta para compartir música, poesía y otras expresiones artísticas.', 'Domingos de 17:00 a 19:00', 0, 0, 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80', 'Socialización', 'participante064@activituc.test'
) AS datos
JOIN etiquetas e ON e.nombre = datos.etiqueta
JOIN usuarios u ON u.email = datos.organizador
WHERE NOT EXISTS (
  SELECT 1 FROM actividades existentes WHERE existentes.nombre = datos.nombre
);

INSERT IGNORE INTO inscripciones (usuario_id, actividad_id, asistio)
SELECT u.id, a.id, MOD(CAST(SUBSTRING(u.email, 13, 3) AS UNSIGNED) + a.id, 2)
FROM usuarios u
JOIN actividades a ON a.nombre IN (
  'Yoga al atardecer en Yerba Buena',
  'Taller de cerámica en Yerba Buena',
  'Club de lectura en Yerba Buena'
)
WHERE SUBSTRING(u.email, 13, 3) BETWEEN '001' AND '020';

INSERT IGNORE INTO resenas (usuario_id, actividad_id, estrellas, comentario)
SELECT u.id, a.id,
       MOD(CAST(SUBSTRING(u.email, 13, 3) AS UNSIGNED) + a.id, 5) + 1,
       CASE MOD(CAST(SUBSTRING(u.email, 13, 3) AS UNSIGNED) + a.id, 5)
         WHEN 0 THEN 'La propuesta estuvo muy bien organizada y disfruté mucho la actividad.'
         WHEN 1 THEN 'Muy buen ambiente; aprendí y compartí una experiencia agradable.'
         WHEN 2 THEN 'Una actividad interesante, con un grupo amable y buena coordinación.'
         WHEN 3 THEN 'La pasé muy bien y volvería a participar en otro encuentro.'
         ELSE 'Fue una experiencia positiva y recomendable para conocer gente de la zona.'
       END
FROM usuarios u
JOIN actividades a ON a.nombre IN (
  'Yoga al atardecer en Yerba Buena',
  'Taller de cerámica en Yerba Buena',
  'Club de lectura en Yerba Buena'
)
WHERE SUBSTRING(u.email, 13, 3) BETWEEN '001' AND '020';
