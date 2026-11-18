# ActiviTuc

**Entrega final — Programación IV, Comisión 5**

**Integrantes:** Esteban Daniel Pedraza y Tomás Azubel

## 1. Descripción del proyecto

ActiviTuc es una aplicación web para consultar, publicar y administrar actividades. El frontend está desarrollado con **React y Vite**; el backend, con **Node.js y Express**; y la persistencia de datos utiliza **MySQL**.

La aplicación contempla una jerarquía acumulativa de roles:

- **Usuario (`usuario`):** explora actividades aprobadas, se inscribe y consulta sus inscripciones y reseñas en Mi cuenta.
- **Organizador (`organizador`):** accede a las funciones de usuario y, además, gestiona sus actividades y registra asistencias.
- **Administrador (`admin`):** accede a las funciones de los otros roles, administra los registros, revisa actividades y consulta métricas.

## 2. Estructura del repositorio

```text
activituc/
├── backend/       # API Node.js/Express, acceso a MySQL y script de base de datos
├── frontend/      # Aplicación React/Vite
├── diagramas.pdf  # Diagrama de relaciones exportado desde MySQL Workbench
└── README.md
```

El diagrama gráfico de relaciones exportado desde MySQL Workbench se encuentra en [`./diagramas.pdf`](./diagramas.pdf).

## 3. Creación de la base de datos

El siguiente script crea la base `activituc` y sus cinco tablas. Incluye las relaciones, claves foráneas, restricciones `UNIQUE` y `CHECK`, y los campos `ENUM` definidos en `backend/database.sql`.

```sql
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
```

Para crear también las etiquetas y los datos de demostración, ejecutá el script completo `backend/database.sql` en MySQL Workbench.

## 4. Instalación, ejecución y usuarios demo

### Requisitos

- Node.js y npm.
- MySQL en ejecución.

### Preparar la base de datos y el backend

1. Abrí `backend/database.sql` en MySQL Workbench y ejecutá el script completo. Este crea la base, las tablas, las etiquetas y los registros de demostración.
2. Creá el archivo `backend/.env` con los datos de conexión a MySQL y un secreto JWT de al menos 32 caracteres:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tu_usuario_mysql
   DB_PASSWORD=tu_contrasena_mysql
   DB_NAME=activituc
   JWT_SECRET=un_secreto_aleatorio_de_al_menos_32_caracteres
   ```

3. En una terminal, instalá las dependencias e iniciá el backend:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   La API queda disponible en `http://localhost:3000`. Podés verificarla en `http://localhost:3000/api/health`.

### Preparar el frontend

En otra terminal, desde la raíz del proyecto:

```bash
cd frontend
npm install
npm run dev
```

Vite muestra en la terminal la dirección local para abrir la aplicación y reenvía las solicitudes `/api` al backend en `localhost:3000`.

### Usuarios de demostración

`backend/database.sql` inserta estas cuentas con sus roles:

| Rol | Nombre | Email |
|---|---|---|
| Administrador | Administración ActiviTuc | `admin.demo@activituc.test` |
| Organizador | Lucía González | `organizador.demo@activituc.test` |
| Usuario | Mateo Juárez | `usuario.demo@activituc.test` |

Las contraseñas se almacenan como hashes bcrypt en la base de datos. El script no guarda las contraseñas en texto plano.
