# Despliegue

## Producción (Render + MongoDB Atlas)

Hay un solo servicio. La imagen del [`Dockerfile`](packages/backend/Dockerfile) compila el front con `REACT_APP_API_URL=/api` y el backend lo sirve junto con la API. Todo queda bajo la misma URL, y por eso la cookie de sesión (`SameSite=Lax`) funciona sin configuración extra. Con front y API en dos servicios de `onrender.com` serían sitios distintos y el login no andaría.

Render gratis no puede correr un contenedor de MongoDB con datos persistentes, así que la base está en MongoDB Atlas (cluster gratuito M0). Para tener app y base en Docker en un mismo servidor, ver [Servidor propio](#servidor-propio-digitalocean-o-similar).

Estado actual:

- App (front y API): https://codigo-a-voluntad-g3.onrender.com
- Health check: https://codigo-a-voluntad-g3.onrender.com/health
- Swagger: https://codigo-a-voluntad-g3.onrender.com/api-docs
- Servicio de Render en plan Free, conectado a la rama `3era-entrega`, con Dockerfile `packages/backend/Dockerfile`. Cada push a esa rama dispara un deploy.
- El plan Free duerme el servicio cuando no tiene tráfico: la primera visita después de un rato tarda unos 50 segundos.

### 1. Base en Atlas

1. Crear un cluster gratuito (M0) en https://www.mongodb.com/atlas.
2. En Database Access, crear un usuario con contraseña propia (no la de la cuenta de Atlas).
3. En Network Access, permitir `0.0.0.0/0`. Render gratis no tiene IP fija; la protección es el usuario y la contraseña.
4. En Connect → Drivers, copiar la cadena `mongodb+srv://...` y agregarle el nombre de la base, por ejemplo `.../codigo_a_voluntad?retryWrites=true&w=majority`. Esa cadena es el `MONGO_URI`.

### 2. Variables de entorno en Render

Se cargan en Dashboard → Environment del servicio. Las claves van solo ahí, nunca en el repo.

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` (cookie `Secure` y `trust proxy` para el límite por IP) |
| `MONGO_URI` | la cadena de Atlas |
| `ALLOWED_ORIGINS` | `https://codigo-a-voluntad-g3.onrender.com` |
| `PUBLIC_APP_URL` | `https://codigo-a-voluntad-g3.onrender.com` (enlaces de RSS y vuelta de LinkedIn) |
| `ADMIN_API_KEY` | texto aleatorio de 32 caracteres o más |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | la cuenta de correo del grupo. Sin `SMTP_HOST` el email se simula por consola |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | los de la app de LinkedIn del grupo |
| `LINKEDIN_REDIRECT_URI` | `https://codigo-a-voluntad-g3.onrender.com/api/integraciones/linkedin/callback` |
| `LINKEDIN_TOKEN_ENCRYPTION_KEY` | 32 bytes en Base64 (ver `.env.example`) |
| `LINKEDIN_API_VERSION` | `202610` |

`PORT` lo pone Render. Sin las variables de LinkedIn la app funciona igual y solo esa integración responde 503.

La URL de `LINKEDIN_REDIRECT_URI` tiene que estar cargada tal cual en la app de LinkedIn (https://www.linkedin.com/developers → la app → Auth → Authorized redirect URLs). Para probar LinkedIn en local se puede registrar también una segunda URL: `http://localhost:8000/api/integraciones/linkedin/callback`, o la de un túnel HTTPS (por ejemplo `cloudflared tunnel --url http://localhost:8000`). El túnel gratuito cambia de URL cada vez que se levanta, así que hay que actualizarla en LinkedIn y en el `.env`.

### 3. Deploy y verificación

El deploy es automático con cada push a `3era-entrega`. Para entregar desde otra rama, cambiarla en Settings → Branch o mergear a la conectada. Cuando termine el build:

```
curl https://codigo-a-voluntad-g3.onrender.com/health        # {"status":"OK",...}
```

Después abrir la URL en el navegador, crear una cuenta de colectivo y otra de colaboradora, y probar postularse y aceptar.

### 4. Datos de ejemplo en Atlas

El seed borra habilidades, colectivos, colaboradoras, proyectos, colaboraciones, notificaciones y tareas de la base a la que apunte `MONGO_URI`. No toca cuentas ni postulaciones, así que sobre una base en uso dejaría cuentas apuntando a perfiles que ya no existen. Correrlo contra Atlas solo si la base está vacía y el grupo lo acordó:

```
cd packages/backend
MONGO_URI="<cadena de Atlas>" npm run seed
```

En PowerShell: `$env:MONGO_URI="<cadena>"; npm run seed`.

Sin seed, el registro no tiene habilidades para elegir: las carga la administración desde Habilidades → Administrar catálogo con la `ADMIN_API_KEY`.

### Probar la imagen en la computadora

```
docker build -f packages/backend/Dockerfile -t codigo-a-voluntad .
docker run --rm -p 3000:3000 -e PORT=3000 -e MONGO_URI=mongodb://host.docker.internal:27017/codigo_a_voluntad codigo-a-voluntad
```

Abrir http://localhost:3000. Sin `NODE_ENV=production` la cookie no es `Secure` y el login anda por HTTP.

## Local con Docker

Desde la raíz del repo:

```
docker compose up --build
```

Levanta la app completa en http://localhost:3000 y un MongoDB con su volumen (`mongo-data`), así los datos sobreviven a los reinicios. Para cargar los datos de ejemplo:

```
docker compose exec backend npm run seed
```

Para desarrollar con recarga automática conviene levantar solo la base (`docker compose up -d mongo`) y correr `npm run dev` desde la raíz: backend en el puerto 8000 y front en el 3000. Ver el [README](README.md#cómo-levantarlo).

## Servidor propio (DigitalOcean o similar)

El enunciado propone un único servidor con una imagen Docker para la app y otra para MongoDB. El `docker-compose.yml` hace exactamente eso, así que en un Droplet con Docker alcanza con:

```
git clone <repo> && cd TP-DDS-2C-Grupo3
docker compose up -d --build
curl http://<ip-del-servidor>:3000/health
```

- Mongo queda atado a `127.0.0.1` y no se puede acceder desde internet.
- Los datos viven en el volumen `mongo-data` y sobreviven a reinicios y redeploys.
- Para actualizar: `git pull && docker compose up -d --build`.
- Antes de exponerlo hay que pasarle las mismas variables que en Render (`NODE_ENV`, `ALLOWED_ORIGINS` con la URL real, `ADMIN_API_KEY`, etc.) y ponerle HTTPS adelante (por ejemplo NGINX con Let's Encrypt), porque en producción la cookie de sesión es `Secure`.

## Servicio anterior

En la 1ra entrega el backend solo estaba en `https://tp-dds-2c-grupo3.onrender.com`. Desde la 3ra entrega se usa el servicio `codigo-a-voluntad-g3`, que sirve front y API juntos.
