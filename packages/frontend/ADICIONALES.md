# Adicionales implementados — entrega 3

Los requisitos que no tenían responsable eran Términos y Condiciones (3), límite de tasa (1), Markdown (2), huella hídrica / IA (2) y RSS (2): **10 puntos**. Este avance implementa esos cinco. No implementa ni da por terminados los adicionales asignados a otros integrantes.

## Qué probar desde el navegador

Con MongoDB, backend y frontend encendidos, recargar la aplicación:

1. **Términos y condiciones** en el menú: consultar texto y versión vigentes. Al crear o editar un proyecto, abrir las condiciones y aceptar explícitamente. Sin aceptación no se envía el formulario; la API también rechaza aceptación ausente o de una versión anterior.
2. **Markdown**: registrar o editar descripciones usando `**negrita**`, `# Título`, listas, enlaces y código. El formulario ofrece vista previa. Se renderizan descripciones de proyectos, perfiles, logros, colectivos, presentaciones personales y habilidades. Los campos de título/nombre siguen siendo texto simple.
3. **Huella hídrica / IA**: al crear/editar proyecto, declarar si requiere IA generativa. Si la requiere, agregar uno o más usos, cada uno con descripción, justificación y grado BAJO/MEDIO/ALTO. Si no la requiere, no puede tener usos. El detalle muestra la declaración; el listado y la búsqueda por habilidades priorizan los proyectos que declaran no requerir IA. Los registros anteriores sin declaración se muestran al final y no se etiquetan como libres de IA.
4. **RSS**: usar los enlaces del pie o abrir http://localhost:8000/api/rss/proyectos.xml y http://localhost:8000/api/rss/colectivos.xml. Copiar la URL a un lector RSS para suscribirse; no hay que crear cuenta ni compartir contactos. Hay hasta 100 novedades públicas, identificadores estables y fecha de creación (ObjectId para datos históricos). El XML muestra contenido escapado, sin HTML ejecutable ni contactos. Los enlaces abren el proyecto o el colectivo en el frontend.
5. **Límite de tasa**: por defecto admite 120 solicitudes por IP cada 60 segundos a `/api`, lecturas y escrituras. Al superarlo devuelve 429 y Retry-After. `/health` no se limita. Esperar el reinicio de la ventana si una prueba manual consume la cuota.

## Administración de condiciones

Esta función usa una credencial de servidor independiente del selector de perfiles del frontend. No sustituye el login general que sigue pendiente.

1. Generar una clave con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Agregarla como `ADMIN_API_KEY=...` en `packages/backend/.env` (archivo ignorado por Git). No ponerla en variables `REACT_APP_`.
3. Reiniciar el backend si no está en modo watch.
4. Ir a Términos → Administrar condiciones y cumplimiento e ingresar la credencial. Sólo permanece en memoria mientras está montada esa pantalla; no se guarda en localStorage ni en URLs.
5. Publicar otra versión: se conserva la anterior. El panel identifica proyectos que todavía no aceptaron la vigente. Al editar el proyecto se exige aceptar la nueva versión. Una actualización de condiciones no suspende automáticamente recursos históricos: la decisión administrativa se registra explícitamente con su motivo.
6. Evaluar proyecto o colectivo: seleccionar recurso y decisión, explicar el motivo y registrar. Una suspensión retira el recurso de los listados y RSS; si es un colectivo, también sus proyectos. Bloquea nuevas postulaciones y aceptación de postulaciones en sus proyectos. Los datos e historial se conservan. Rehabilitar permite corregir la situación sin recrear el recurso.

Sin clave configurada o con menos de 32 caracteres, los endpoints administrativos devuelven 503. Una clave incorrecta devuelve 401. Los endpoints públicos de lectura de condiciones y RSS funcionan sin esa clave.

El texto inicial es una propuesta funcional para este TP, basada en las reglas de la consigna; el equipo puede reemplazarlo desde el panel. No representa asesoramiento legal ni una política final para un servicio comercial.

## Contratos nuevos para el equipo

- GET `/api/terminos/actual`: `{version,titulo,contenido,...}`.
- Crear/actualizar proyectos exige `versionTerminosAceptada` con la versión vigente. Se persiste como `aceptacionTerminos: {version,fecha}`; el cliente no decide la fecha.
- `requiereIA`: booleano; `null` sólo para datos previos/sin declarar. `usosIA`: lista de `{descripcion,justificacion,grado}`. No se calculan litros, energía ni emisiones: es una declaración, según la consigna.
- GET `/api/admin/terminos/estado`, POST `/api/admin/terminos` y POST `/api/admin/terminos/revisiones`: requieren `Authorization: Bearer <ADMIN_API_KEY>`.
- Revisión: `{recurso:'proyectos'|'colectivos',recursoId,suspendido:boolean,motivo}`.
- Las suspensiones se almacenan en `moderacionTerminos`, separadas del estado del proyecto y de la eliminación de cuentas que desarrollan los compañeros. Colecciones nuevas: términos versionados y revisiones.
- Cada publicación tiene una versión nueva inmutable; la aceptación no se reutiliza para otra versión.
- `PUBLIC_APP_URL` configura los enlaces de los feeds, sobre todo al desplegar. `PUBLIC_RATE_LIMIT` y `PUBLIC_RATE_WINDOW_MS` configuran el límite.
- El contador se mantiene en memoria por proceso, adecuado al servidor único del TP. Si se escala a varios procesos, hace falta un almacén compartido. No se confía ciegamente en X-Forwarded-For: al desplegar con un proxy, configurar `trust proxy` sólo para el proxy conocido.
- La API Swagger incluye las rutas, campos nuevos, autenticación administrativa y respuestas 429.

## Pruebas

Backend: `npm test --workspace=backend -- --runInBand test/services/AdicionalesHttp.test.js test/services/EdicionHttp.test.js`.

Para usar Mongo local, definir antes `$env:MONGO_URI_TEST='mongodb://127.0.0.1:27017'`. El helper existente usa una base separada `test_<PID>` y la borra al terminar; no escribe en `codigo_a_voluntad`.

Frontend: `npm test --workspace=frontend -- --watchAll=false --runInBand`.

Los tests HTTP ejercitan aceptación/versionado, credencial administrativa, suspensión/restauración e historial, huella y ordenamiento, RSS y 429. Los del frontend incluyen renderizado seguro de Markdown y formulario de IA con aceptación explícita.

## Alcance y coordinación

El login general y la autorización de propietario siguen pendientes. Este avance protege la administración de condiciones con una credencial propia, pero no afirma proteger las rutas existentes mediante sesiones. Los módulos de eliminación, denuncias, experiencia, redes, Gantt, tags, portabilidad, modo daltónico, sanitización general y cierre automático quedan a cargo de los responsables indicados por el grupo.

La seguridad de Markdown se limita al renderizador: HTML deshabilitado y salida filtrada, sin imágenes remotas. No sustituye la sanitización general de entradas del backend que hará otro integrante.

Referencias de implementación: [markdown-it: seguridad](https://github.com/markdown-it/markdown-it/blob/master/docs/safety.md), [DOMPurify](https://github.com/cure53/DOMPurify), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit).

Verificación de este avance: 11 pruebas HTTP de backend y 8 de frontend aprobadas. La revisión visual automática no pudo acceder al navegador local; se debe confirmar la disposición de las pantallas en el navegador del equipo. No se modificaron datos de desarrollo ni se ejecutaron seeds.
