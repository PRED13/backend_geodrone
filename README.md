# GeoDrone — Backend API

API REST del sistema GeoDrone. Recibe fotos del dron desde la app móvil, extrae las coordenadas GPS del EXIF, gestiona proyectos, vuelos, mediciones y reportes.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar el archivo de entorno y configurarlo (PowerShell)
Copy-Item .env.example .env
# Edita .env con tus credenciales de PostgreSQL

# 3. Iniciar PostgreSQL y esperar a que esté listo
docker compose up -d --wait postgres

# 4. Iniciar en modo desarrollo (sincroniza tablas automáticamente)
npm run dev
```

## Uso

- API: `http://localhost:3000/api`
- Documentación Swagger: `http://localhost:3000/api-docs`

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión (devuelve JWT) |
| GET | /api/auth/me | Perfil del usuario autenticado |
| GET/POST | /api/projects | Listar / crear proyectos |
| GET/PUT/DELETE | /api/projects/:id | Ver / editar / borrar proyecto |
| GET/POST | /api/flights | Listar / crear vuelos |
| GET/PUT/DELETE | /api/flights/:id | Ver / editar / borrar vuelo |
| POST | /api/images/upload | **Subir fotos del dron** (extrae GPS EXIF) |
| GET | /api/images | Listar imágenes de un vuelo |
| GET | /api/coordinates | Listar coordenadas GPS |
| GET/POST | /api/control-points | Puntos de control (GCPs) |
| GET/POST | /api/measurements | Mediciones (área, distancia, etc.) |
| GET/POST | /api/models3d | Modelos 3D (ODM) |
| GET/POST | /api/reports | Reportes |

## Subida de fotos

El endpoint `POST /api/images/upload` acepta `multipart/form-data` con:
- `flight_id` (string) — UUID del vuelo
- `images` (array de archivos) — JPG, PNG o TIFF, máx. 50 MB por foto

Las coordenadas GPS se extraen automáticamente del EXIF de cada imagen y se guardan en la tabla `coordinates`.

## Estructura del proyecto

```
src/
├── app.js                  # Express app
├── index.js                # Arranque del servidor
├── config/
│   ├── multer.js           # Configuración de subida de archivos
│   └── swagger.js          # Configuración de Swagger
├── controllers/            # Lógica de negocio
├── database/
│   └── connection.js       # Conexión a PostgreSQL
├── middlewares/
│   ├── auth.middleware.js  # Verificación JWT
│   └── validate.middleware.js
├── models/                 # Modelos Sequelize
│   ├── index.js            # Asociaciones
│   ├── User.js
│   ├── Project.js
│   ├── Flight.js
│   ├── Image.js
│   ├── Coordinate.js
│   ├── ControlPoint.js
│   ├── Measurement.js
│   ├── Model3D.js
│   └── Report.js
└── routes/                 # Rutas Express con documentación Swagger
```

## Tecnologías

- **Express** — framework HTTP
- **Sequelize + pg** — ORM para PostgreSQL
- **JWT + bcryptjs** — autenticación
- **Multer** — subida de archivos
- **exifr** — extracción de GPS del EXIF
- **swagger-jsdoc + swagger-ui-express** — documentación automática

## Despliegue en Render con Aiven

Docker Compose se usa para desarrollo local. En producción, despliega la API como un Web Service de Render y usa PostgreSQL administrado por Aiven.

En Render configura `npm ci` como comando de instalación y `npm start` como comando de inicio. Define estas variables de entorno con los datos del servicio Aiven:

- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`
- `DB_SSL_CA` con el certificado CA de Aiven (PEM); no lo guardes en el repositorio
- `JWT_SECRET` con un valor aleatorio y privado
- `JWT_EXPIRES_IN=7d`

`PORT` lo proporciona Render. La conexión habilita TLS y valida el certificado cuando `DB_SSL_CA` está definido. Los servicios gratuitos de Render tienen almacenamiento efímero: las fotos y los reportes guardados localmente en `uploads/` no son persistentes.

## ejecutar la Base de Datos
Set-Location "C:\Users\yanet\OneDrive\Documentos\7° SEMESTRE\IBM\GeoDrone-BD\playground\geodrone-backend"
docker compose up -d --wait postgres
npm run dev