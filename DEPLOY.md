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

## Producción (Render, gratis)

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
