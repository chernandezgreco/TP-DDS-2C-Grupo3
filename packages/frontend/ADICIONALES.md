# Adicionales: términos, límite de tasa, Markdown, huella IA y RSS

Estos cinco adicionales se hicieron en un mismo avance (10 puntos: términos 3, límite de tasa 1, Markdown 2, huella IA 2 y RSS 2). El resto de los adicionales está en [ENTREGA3.md](ENTREGA3.md#adicionales).

## Cómo probarlos

Con MongoDB, el backend y el front levantados:

1. Términos y condiciones (21). En el menú, Términos muestra el texto y la versión vigente. Al crear o editar un proyecto hay que abrir las condiciones y aceptarlas; sin eso el formulario no se envía, y la API también rechaza una aceptación que falte o que sea de una versión anterior.
2. Markdown (38). En cualquier descripción se puede usar `**negrita**`, `# Título`, listas, enlaces y código, con vista previa en el formulario. Se ve en las descripciones de proyectos, perfiles, logros, colectivos, habilidades y en la presentación de las colaboradoras. Títulos y nombres siguen siendo texto simple.
3. Huella IA (36). Al crear o editar un proyecto se declara si necesita IA generativa. Si la necesita, se cargan uno o más usos con descripción, justificación y grado (bajo, medio o alto); si no, no puede tener usos. El listado y la búsqueda por habilidades muestran primero los proyectos que declaran no usarla. Los proyectos viejos, sin declaración, van al final y no se marcan como libres de IA.
4. RSS (5). Enlaces en el pie, o directamente http://localhost:8000/api/rss/proyectos.xml y http://localhost:8000/api/rss/colectivos.xml. Se pueden copiar en cualquier lector RSS, sin cuenta. Publican hasta 100 novedades, con el contenido escapado y sin datos de contacto, y los enlaces abren el proyecto o el colectivo en el front.
5. Límite de tasa (14). Por defecto, 120 pedidos por IP cada 60 segundos a `/api`, contando lecturas y escrituras. Al pasarse responde 429 con el header `Retry-After`. `/health` no tiene límite.

## Administración de los términos

La administración usa una clave propia (`ADMIN_API_KEY`), aparte del login de las cuentas.

1. Generar una clave: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Ponerla como `ADMIN_API_KEY=...` en `packages/backend/.env`, que no se sube al repo. Nunca en una variable `REACT_APP_`.
3. Reiniciar el backend si no está en modo watch.
4. Ir a Términos → Administrar condiciones y cumplimiento e ingresar la clave. Queda en memoria mientras esa pantalla está abierta; no se guarda en el navegador ni en la URL.
5. Publicar una versión nueva: la anterior se conserva. El panel muestra qué proyectos todavía no aceptaron la vigente, y al editarlos se les pide aceptarla. Publicar una versión no suspende nada por sí sola.
6. Evaluar un proyecto o un colectivo: elegir el recurso, la decisión y escribir el motivo. Una suspensión lo saca de los listados y del RSS (si es un colectivo, también a sus proyectos) y bloquea las postulaciones nuevas y las aceptaciones. Los datos y el historial se conservan, y se puede rehabilitar.

Sin clave configurada, o con menos de 32 caracteres, las rutas de administración responden 503; con una clave incorrecta, 401. Leer los términos y el RSS no necesita clave.

El texto inicial de los términos es una propuesta basada en las reglas del enunciado y se puede reemplazar desde el panel. No es asesoramiento legal.

## Detalles de la API

- `GET /api/terminos/actual` devuelve `{ version, titulo, contenido, ... }`.
- Crear o editar un proyecto exige `versionTerminosAceptada` con la versión vigente. Se guarda como `aceptacionTerminos: { version, fecha }`, y la fecha la pone el servidor.
- `requiereIA` es booleano (`null` solo en datos viejos sin declarar) y `usosIA` es una lista de `{ descripcion, justificacion, grado }`. Es una declaración: no se calculan litros, energía ni emisiones, como dice el enunciado.
- Administración: `GET /api/admin/terminos/estado`, `POST /api/admin/terminos` y `POST /api/admin/terminos/revisiones`, todas con `Authorization: Bearer <ADMIN_API_KEY>`. Una revisión es `{ recurso: "proyectos" | "colectivos", recursoId, suspendido, motivo }`.
- Las suspensiones se guardan en `moderacionTerminos`, aparte del estado del proyecto y de la eliminación de cuentas. Cada versión de los términos es inmutable, y una aceptación vale solo para su versión.
- `PUBLIC_APP_URL` define los enlaces de los feeds. `PUBLIC_RATE_LIMIT` y `PUBLIC_RATE_WINDOW_MS`, el límite.
- El contador del límite vive en la memoria del proceso, que alcanza para el servidor único del TP; con varios procesos haría falta un almacén compartido. En producción `trust proxy` confía en un solo salto (el proxy de Render), para no creerle a cualquier `X-Forwarded-For`.
- En Markdown, el HTML está deshabilitado y la salida pasa por DOMPurify, sin imágenes remotas. Aparte, el backend sanitiza todos los textos al guardarlos (adicional 11).

## Tests

- Backend: `test/services/AdicionalesHttp.test.js` y `test/services/EdicionHttp.test.js`. Cubren aceptación y versionado, la clave de administración, suspender y rehabilitar con historial, huella IA y su orden, RSS y el 429.
- Front: `Markdown.test.js` (render seguro) y los tests del formulario de IA con aceptación explícita.

Referencias: [markdown-it: seguridad](https://github.com/markdown-it/markdown-it/blob/master/docs/safety.md), [DOMPurify](https://github.com/cure53/DOMPurify), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit).
