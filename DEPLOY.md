# Despliegue

## Local (con Docker)

Desde la raíz del repo:

```
docker compose up --build
```

Esto levanta el backend en `http://localhost:3000` y un contenedor de MongoDB con su volumen (`mongo-data`), así los datos no se pierden al reiniciar. Probar con:

```
curl http://localhost:3000/health
```

### Solo la base, para desarrollar sin Docker en el backend

```
docker compose up mongo
```

Deja Mongo en `localhost:27017`. En `packages/backend/.env` (copiar de `.env.example`) va `MONGO_URI=mongodb://localhost:27017/codigo_a_voluntad` y el backend se levanta con `npm run dev`.

### Datos iniciales (seeds)

El script semilla **borra** las colecciones de la base de `MONGO_URI` y carga habilidades, colectivos, colaboradoras (con medios de contacto), proyectos con perfiles, colaboraciones, una notificación y logros. Se puede correr las veces que haga falta.

```
# desarrollo local (desde packages/backend)
npm run seed

# dentro del contenedor del backend
docker compose exec backend npm run seed
```

Los ids son fijos (ver `src/seeds/datos.js`), por ejemplo:

| Entidad | Id |
|---|---|
| Colectivo "Fundación Manos Unidas" | `650000000000000000000101` |
| Proyecto "Web de donaciones" | `650000000000000000000201` |
| Colaboradora "Ada" | `650000000000000000000301` |

Los ids de los perfiles se generan al cargar: se obtienen con `GET /api/proyectos/{id}/perfiles`. La documentación de la API queda en `/api-docs`.

## Producción de la 3ra entrega (Render + MongoDB Atlas)

Desde la 3ra entrega hay **un solo servicio**: la imagen del `Dockerfile` compila el front (con `REACT_APP_API_URL=/api`) y el backend lo sirve junto con la API. Todo queda bajo la misma URL, por eso la cookie de sesión (`SameSite=Lax`) funciona sin configuración extra. Dos servicios separados en `onrender.com` serían sitios distintos y el login no andaría.

Render gratis no corre un contenedor de MongoDB con datos persistentes, así que la base va en **MongoDB Atlas** (cluster gratuito M0). Para correr todo en un servidor propio con Mongo en Docker, ver "Servidor propio" más abajo.

**Estado (17/11/2026): desplegado.**

- URL pública (front y API): https://codigo-a-voluntad-g3.onrender.com
- Health check: https://codigo-a-voluntad-g3.onrender.com/health
- Documentación de la API: https://codigo-a-voluntad-g3.onrender.com/api-docs
- Servicio en Render (plan Free, rama `E3-Correcciones-E2`, Dockerfile `packages/backend/Dockerfile`) y base en MongoDB Atlas (M0), con los datos de ejemplo cargados con `npm run seed`.
- El plan Free duerme el servicio sin tráfico: la primera visita después de un rato tarda cerca de 50 segundos.

### 1. Base en Atlas

1. Crear cuenta en https://www.mongodb.com/atlas y un cluster gratuito (M0).
2. *Database Access*: crear un usuario con contraseña propia (no la de la cuenta).
3. *Network Access*: permitir `0.0.0.0/0` (Render gratis no tiene IP fija; la protección es el usuario y la contraseña).
4. *Connect → Drivers*: copiar la cadena `mongodb+srv://...` y agregarle el nombre de la base, por ejemplo `.../codigo_a_voluntad?retryWrites=true&w=majority`. Esa cadena es el `MONGO_URI`.

### 2. Variables de entorno en Render

Servicio existente (Dashboard → Environment). Las claves se cargan solo ahí, nunca en el repo.

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` (activa la cookie `Secure` y `trust proxy` para el límite por IP) |
| `MONGO_URI` | la cadena de Atlas |
| `ALLOWED_ORIGINS` | `https://tp-dds-2c-grupo3.onrender.com` (la URL pública del servicio) |
| `PUBLIC_APP_URL` | la misma URL pública (se usa en los enlaces de RSS y de LinkedIn) |
| `ADMIN_API_KEY` | texto aleatorio de 32 caracteres o más |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | los de la cuenta de correo del grupo (ver `.env.example`); sin `SMTP_HOST` el email se simula por consola |

`PORT` lo inyecta Render solo.

### 3. Deploy y verificación

El servicio se redeploya con cada push a la rama conectada. Para publicar la 3ra entrega, cambiar la rama del servicio (Settings → Branch) a la que se entregue, o mergear a la rama conectada. Cuando termine el build:

```
curl https://<url>.onrender.com/health        # {"status":"OK",...}
```

Abrir la URL en el navegador (carga el front), `/api-docs` (Swagger), registrar una colectiva y una colaboradora y mandar una notificación para ver el email.

### 4. Datos iniciales en la base de Atlas

El seed **borra** las colecciones de la base a la que apunte `MONGO_URI`. Correrlo una vez desde la computadora, apuntando a Atlas, solo si la base está vacía y el equipo lo acordó:

```
cd packages/backend
MONGO_URI="<cadena de Atlas>" npm run seed
```

(En PowerShell: `$env:MONGO_URI="<cadena>"; npm run seed`.) Las habilidades las carga el equipo administrativo, así que sin seed el formulario de registro no tiene habilidades para elegir.

### Probar la imagen en la computadora

```
docker build -f packages/backend/Dockerfile -t codigo-a-voluntad .
docker run --rm -p 3000:3000 -e PORT=3000 -e MONGO_URI=mongodb://host.docker.internal:27017/codigo_a_voluntad codigo-a-voluntad
```

Abrir http://localhost:3000. Sin `NODE_ENV=production` la cookie no es `Secure` y el login funciona por HTTP.

## Render: primer deploy del backend (1ra entrega)

**Importante:** la consigna pide una imagen Docker para el servidor y otra para MongoDB. Render gratis sirve para el backend solo, pero no permite correr un contenedor de Mongo con datos persistentes. Para la 2da entrega el despliegue completo va en un servidor propio (ver "Servidor propio" más abajo).

**Estado: ya deployado.**

- URL pública: https://tp-dds-2c-grupo3.onrender.com
- Health check: https://tp-dds-2c-grupo3.onrender.com/health
- Dashboard del servicio (acceso del equipo, cuenta de Cami): https://dashboard.render.com/web/srv-dag6t2gu01pc73974f90
- Región: Virginia (US East). Plan: Free ($0/mes, 0.1 CPU, 512 MB RAM).
- El plan Free "duerme" el servicio sin tráfico y tarda unos segundos en responder en el primer request después de un rato inactivo — es normal, no hace falta plan pago para esta entrega.

Pasos seguidos para llegar a este estado (quedan documentados por si hay que rehacer el servicio o alguien más del equipo necesita crear uno nuevo):

1. Crear una cuenta en https://render.com (se puede loguear directo con GitHub).
2. Dashboard → "New" → "Web Service".
3. Conectar el repositorio `TP-DDS-2C-Grupo3` (Render pide autorizar acceso a tu cuenta/organización de GitHub).
4. Cuando pregunte el entorno, elegir **Docker** (Render va a detectar el `Dockerfile` solo si le indicamos la ruta):
   - **Root Directory**: dejar vacío (raíz del repo).
   - **Dockerfile Path**: `packages/backend/Dockerfile`
5. Variables de entorno (sección "Environment"):
   - `ALLOWED_ORIGINS`: por ahora se puede dejar vacío o poner `*` hasta que el frontend tenga su propia URL.
   - (No hace falta configurar `PORT`, Render lo inyecta solo y el backend ya lo lee).
6. Plan: elegir el "Free" instance type.
7. Deploy. Render te da una URL pública tipo `https://codigo-a-voluntad-backend.onrender.com`.
8. Verificar que responda: `https://<tu-url>.onrender.com/health`.

Cada `git push` a la rama conectada (`main` o la que se elija en la configuración del servicio) dispara un redeploy automático.

**Nota:** el plan free de Render "duerme" el servicio tras un rato sin tráfico y tarda unos segundos en despertar en el primer request — normal para un despliegue inicial de TP, no hace falta plan pago para esta entrega.

## Servidor propio (DigitalOcean o similar)

Con el `docker-compose.yml` alcanza para levantar todo en un Droplet con Docker instalado:

```
git clone <repo> && cd TP-DDS-2C-Grupo3
docker compose up -d --build
curl http://<ip-del-servidor>:3000/health
```

- Mongo queda atado a `127.0.0.1`, no es accesible desde internet.
- Los datos viven en el volumen `mongo-data` y sobreviven a reinicios y redeploys.
- Para actualizar: `git pull && docker compose up -d --build`.

## Futuro (DigitalOcean)

El mismo `Dockerfile` sirve para armar un Droplet con Docker instalado y correr:

```
docker build -f packages/backend/Dockerfile -t codigo-a-voluntad-backend .
docker run -d -p 80:3000 --env-file packages/backend/.env codigo-a-voluntad-backend
```

Pendiente para cuando el equipo decida migrar (por ejemplo al sumar MongoDB en la 2da entrega, ya que ahí sí conviene tener control total del servidor).
