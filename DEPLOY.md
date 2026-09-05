# Despliegue

## Local (con Docker)

Desde la raíz del repo:

```
docker compose up --build
```

Esto levanta el backend en `http://localhost:3000`. Probar con:

```
curl http://localhost:3000/health
```

## Producción (Render, gratis)

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

## Futuro (DigitalOcean)

El mismo `Dockerfile` sirve para armar un Droplet con Docker instalado y correr:

```
docker build -f packages/backend/Dockerfile -t codigo-a-voluntad-backend .
docker run -d -p 80:3000 --env-file packages/backend/.env codigo-a-voluntad-backend
```

Pendiente para cuando el equipo decida migrar (por ejemplo al sumar MongoDB en la 2da entrega, ya que ahí sí conviene tener control total del servidor).
