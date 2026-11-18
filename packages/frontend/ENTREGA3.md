# Tercera entrega: guía de uso

Cómo levantar la app, los recorridos de cada tipo de cuenta, qué pantalla cubre cada caso de uso del enunciado y cómo probar los adicionales. La justificación de los lineamientos de UI está en [REQUERIMIENTOS_NO_FUNCIONALES.md](../../REQUERIMIENTOS_NO_FUNCIONALES.md).

La app usa login real con una cookie de sesión HttpOnly. Cada cambio se valida en el servidor: solo el titular puede editar su perfil y solo el colectivo dueño puede tocar su proyecto.

## Levantarla en local

1. En la raíz: `npm install`.
2. MongoDB: `docker compose up -d mongo`.
3. Si no existe, copiar `packages/backend/.env.example` a `packages/backend/.env`. Con `SERVER_PORT=8000`, `MONGO_URI=mongodb://localhost:27017/codigo_a_voluntad` y `ALLOWED_ORIGINS=http://localhost:3000` alcanza.
4. Datos de ejemplo (opcional, borra la base): `npm run seed --workspace=backend`.
5. `npm run dev` levanta el backend en el puerto 8000 y el front en el 3000.
6. Abrir http://localhost:3000. Usar siempre `localhost`, sin mezclarlo con `127.0.0.1`, para que la cookie y el origen coincidan.

Para apuntar el front a otra API, poner `REACT_APP_API_URL` en `packages/frontend/.env.local` y reiniciar. Es una URL pública: no van claves ahí.

## Primer acceso

- Iniciar sesión / Registrarme → Crear cuenta, y elegir colectivo o persona colaboradora.
- Se carga el correo de acceso, una contraseña de al menos 10 caracteres y los datos del perfil. Al registrarse ya queda la sesión iniciada.
- Los colectivos y colaboradoras del seed no tienen contraseña, así que no se puede entrar con ellos: para probar hay que crear cuentas nuevas.
- Si el catálogo de habilidades está vacío, se cargan desde Habilidades → Administrar catálogo con la `ADMIN_API_KEY` del backend. Una colaboradora necesita al menos una habilidad para registrarse.
- El correo de acceso, la contraseña y las sesiones no aparecen en ningún listado. Los contactos de una colaboradora solo los ve un colectivo después de aceptarla.

## Recorrido del colectivo

1. Crear la cuenta de colectivo.
2. Explorar proyectos → Crear proyecto: título, descripción, declaración de uso de IA y aceptación de los términos vigentes.
3. En el proyecto, Agregar perfil: habilidades, compromiso y modalidad. El cupo y la fecha límite son opcionales.
4. Desde cada perfil, Buscar colaboradoras y mandarle un mensaje a quien acepte mensajes.
5. Ver las postulaciones pendientes y aceptarlas o rechazarlas. El cupo cuenta colaboraciones aceptadas, no postulaciones pendientes.
6. Consultar los contactos desde una colaboración aceptada. Otro colectivo no puede verlos aunque conozca el id.
7. Cargar, editar y borrar logros: porcentaje de avance, enlace al sistema y al código.
8. Cargar tareas y verlas en el Gantt (sección "Planificación y tareas").
9. Editar el proyecto, pausar o reabrir la búsqueda, o finalizarlo. Un proyecto con historial no se elimina: se finaliza.
10. Dar de baja a una colaboradora desde "Colaboraciones actuales". La app avisa que es permanente.
11. Mi espacio → Editar mis datos, para cambiar los datos de la organización.

## Recorrido de la colaboradora

1. Crear la cuenta con habilidades y un nombre público (puede ser de fantasía).
2. Mi espacio → Editar mis datos: presentación, pronombres, GitHub o GitLab y habilidades.
3. Agregar, editar o quitar contactos privados, y activar o desactivar los mensajes de colectivos.
4. Explorar proyectos: buscar por nombre o habilidad, filtrar las búsquedas abiertas, usar "Para mis habilidades" o filtrar por etiqueta.
5. Abrir un proyecto y postularse a un perfil. Hace falta al menos una habilidad requerida, la búsqueda abierta y el perfil con fecha y cupo vigentes.
6. Elegir si la contribución se muestra en público o de forma anónima. El colectivo dueño igual sabe quién es; el resto no.
7. Seguir el estado de las postulaciones en Mi espacio y leer los mensajes en Mensajes.
8. Darse de baja de un proyecto. La app avisa que es permanente. Después de la baja, el colectivo deja de ver sus contactos, salvo que tengan otra colaboración aceptada.

## Pantallas obligatorias

| Caso de uso del enunciado | Dónde está |
|---|---|
| Registro y edición de organización | Crear cuenta y Mi espacio → Editar mis datos |
| Registro y edición de colaboradora | Crear cuenta, Mi espacio: datos, habilidades, experiencia y contactos |
| CRUD de proyectos | Crear, ver, editar, finalizar y eliminar (si no tiene historial). Perfiles, logros y tareas adentro del proyecto |
| Búsquedas de colaboradoras y proyectos | Buscador y filtros del catálogo, "Para mis habilidades", etiquetas y "Buscar colaboradoras" en cada perfil |
| Página del proyecto y su avance | Detalle del proyecto: atributos, perfiles abiertos o cerrados con quiénes los ocupan, logros con porcentaje y enlaces, Gantt |
| Contacto interno con colaboradoras de un perfil | "Enviar mensaje" desde las candidatas de un perfil |
| Listado de mensajes internos | Sección Mensajes |
| Realizar, aceptar y rechazar una postulación | "Postularme" en el perfil; pendientes y procesadas en el proyecto, para el colectivo |
| Desanotación de ambos lados | "Dar de baja permanentemente" en las colaboraciones, con confirmación |
| Datos de contacto de un perfil | "Consultar contactos". Falla con un mensaje para otra colaboradora o para un colectivo sin colaboración aceptada |
| Login | Registro, login, logout y sesión vencida |

## Accesibilidad

Revisamos el código y los estilos el 17/11/2026:

- Idioma, título y viewport definidos (`lang="es"`).
- Teclado: enlace "Saltar al contenido", foco visible de 3 px en botones, enlaces y campos. El modal mantiene el foco adentro, se cierra con Escape y lo devuelve al botón que lo abrió.
- Lectores de pantalla: estados con `role="status"`, errores con `role="alert"`, modal con `aria-modal`, página actual con `aria-current`, imágenes con texto alternativo y decoración con `aria-hidden`. Todos los campos tienen etiqueta.
- Botones de al menos 44 px de alto.
- Contraste WCAG AA (mínimo 4.5:1): texto principal 11.5:1, botones 6.4:1, enlaces 6.0:1. Había 15 textos secundarios (migas, contadores, pie, ayudas) entre 3.0:1 y 4.5:1; los oscurecimos hasta pasar 4.5:1.
- Las etiquetas y metadatos de 10 y 11 px pasaron a 12 px.
- Cortes de diseño en 1500, 1150 y 760 px.

También la miramos en Chrome a 1900 px y a 375 px (iPhone SE) en el listado de proyectos: en celular las tarjetas pasan a una columna y el menú se desplaza de costado. De ahí salieron dos arreglos: el botón "Denunciar" aparecía para los colectivos, y las tarjetas decían "1 perfiles". El recorrido completo con Tab funciona.

No lo probamos con un lector de pantalla real.

## Adicionales

Términos y condiciones, límite de tasa, Markdown, huella IA y RSS están explicados en [ADICIONALES.md](ADICIONALES.md). El resto, acá.

### Modo daltónico (20)

Botón "Modo daltónico" en el encabezado, con o sin sesión. Cambia toda la paleta y el navegador recuerda la elección.

- Cómo funciona: el botón pone `data-vision="daltonico"` en `<html>`. Los colores de `App.css` son variables, y el bloque `:root[data-vision="daltonico"]` solo las redefine, así que ningún componente sabe de colores. La preferencia se lee y se guarda en `vision.js`, y `index.js` la aplica antes del primer render para que no parpadee. Si el navegador bloquea `localStorage`, queda la paleta normal.
- Paleta: basada en Okabe-Ito. El verde y el rojo (éxito y error, principal y peligro) pasan a azul y naranja, que se distinguen con los tres tipos de daltonismo. Los verdes de fondo y bordes pasan a un azul grisáceo con la misma luminancia, así los contrastes quedan iguales que en el modo normal.
- No depende solo del color: los errores llevan ⚠, los éxitos ✓ y los estados de las tareas tienen patrón y texto propios. El botón indica si está activo con `aria-pressed`.
- Lo probamos con el build de producción a 1400 y 375 px, con el modo apagado y prendido, y con la simulación de protanopía, deuteranopía y tritanopía de Chrome DevTools.
- Tests: `paleta.test.js` lee `App.css` y verifica los contrastes de las dos paletas; `BotonModoDaltonico.test.js` y `vision.test.js` cubren el botón (también con teclado), la persistencia y el almacenamiento bloqueado.

### Etiquetas (34)

Proyectos y colectivos pueden tener etiquetas libres (`#educacion`, `#software-libre`) para encontrarlos más fácil.

- Se cargan en el registro del colectivo, en Editar mis datos y al crear o editar un proyecto. Se agregan con Enter o coma y se quitan con ✕ o Backspace. El campo sugiere las que ya existen para no crear variantes.
- Se guardan normalizadas: minúsculas, sin acentos y con guiones ("Educación Popular" queda `educacion-popular`). De 2 a 30 caracteres, hasta 10 por proyecto o colectivo y sin repetir. La regla está en el dominio (`domain/etiquetas.js`); el front tiene una copia solo para mostrar cómo va a quedar.
- Al editar, si no se mandan se conservan; si se mandan, reemplazan a las anteriores.
- Tocar una etiqueta filtra el listado (`GET /api/proyectos?etiquetas=a,b` o `/api/colectivos?etiquetas=a,b`), que devuelve los que tienen todas las pedidas. Se combina con los otros filtros, y el buscador de texto también encuentra por etiqueta.
- Tests: `Etiquetas.test.js`, `ConsultaEtiquetas.test.js` y `EtiquetasHttp.test.js` en el backend; `etiquetas.test.js`, `EtiquetasInput.test.js` y `App.etiquetas.test.js` en el front.

### Portabilidad de datos (26)

Cualquier cuenta puede descargar una copia de todos sus datos personales en JSON o CSV.

- Mi espacio → Tus datos, elegir el formato y Descargar mis datos. Los avisos de eliminar cuenta sugieren descargarlos antes, porque después ya no se puede entrar.
- API: `GET /api/mi/exportacion?formato=json|csv`. Toma la cuenta de la sesión, sin id en la URL, así que no se pueden pedir datos ajenos. Admite 5 descargas por cuenta cada 15 minutos.
- La colaboradora se lleva su cuenta, su perfil con sus contactos, habilidades, postulaciones, colaboraciones, mensajes, tareas y denuncias. El colectivo se lleva su perfil, sus proyectos completos, tareas, postulaciones y colaboraciones recibidas, mensajes enviados y revisiones de términos.
- Protección de datos: nunca salen contraseñas, sesiones, tokens de LinkedIn ni denuncias recibidas. En el archivo del colectivo, las colaboradoras aparecen solo con id y nombre de fantasía, sin sus contactos, porque son datos de otra persona.
- El CSV es un solo archivo con columnas `seccion,registro,campo,valor`. Los valores que empiezan con `=`, `+`, `-` o `@` llevan un apóstrofo adelante para que Excel no los ejecute como fórmula.
- Tests: `ExportacionDatos.test.js`, `Csv.test.js` y `PortabilidadHttp.test.js` en el backend; `PortabilidadDatos.test.js` en el front.

### Diagrama de Gantt (33)

En el detalle del proyecto, la sección "Planificación y tareas" muestra las tareas en un Gantt y en una tabla. El colectivo dueño las crea, edita y borra; cualquiera puede verlas. Cada tarea tiene fechas, estado (pendiente, en curso, finalizada) y, opcionalmente, una colaboradora responsable. Al finalizar el proyecto, las tareas sin terminar pasan a "cerrada".

### Cierre automático (10)

Al crear o editar un proyecto se puede poner una fecha y hora de cierre ("Cierre automático"). Un proceso del backend revisa cada minuto y finaliza los proyectos vencidos, con las mismas consecuencias que el cierre manual: se rechazan las postulaciones pendientes y no se aceptan nuevas.

### Sanitización (11)

Todos los campos de texto que carga una persona pasan por `sanitizarTexto` en la validación del backend: se sacan las etiquetas HTML (`<script>`, `<iframe>`, etc.) antes de guardar. Se prueba escribiendo `Hola <b>mundo</b><script>alert(1)</script>` en una descripción: se guarda "Hola mundo". Si después de limpiar un campo obligatorio queda vacío, la API lo rechaza como cualquier campo vacío.

### Denuncias (22)

Una colaboradora que participó en un proyecto puede denunciar ese proyecto o a su colectivo con "Denunciar", eligiendo un motivo y describiendo qué pasó. La administración las revisa en "Administrar denuncias" (con la `ADMIN_API_KEY`) y les cambia el estado: pendiente, en revisión, resuelta o desestimada.

### Eliminación de cuentas (23 y 24)

En Mi espacio. Si un colectivo elimina su cuenta, se conserva su historial, se borra su ubicación, se cierran sus búsquedas y se rechazan las postulaciones pendientes. Si una colaboradora elimina la suya, se borran sus datos personales, contactos y credenciales, y en el historial aparece como "Persona eliminada". En los dos casos no se puede volver a iniciar sesión.

### Experiencia por habilidad (37)

En Mi espacio, la colaboradora puede indicar para cada habilidad el nivel (inicial, intermedio o avanzado), los años de experiencia y una descripción corta. Se muestra en su perfil público.

### LinkedIn (1 y 2)

En Mi espacio → Redes sociales · LinkedIn se conecta la cuenta de LinkedIn. Una vez conectada, la colaboradora puede importar su nombre y foto, y en los logros de un proyecto aparece "Compartir en LinkedIn" para publicarlo. Necesita las variables `LINKEDIN_*` del backend (ver [DEPLOY.md](../../DEPLOY.md)); sin ellas el resto de la app funciona igual.

## Validación técnica

```powershell
npm run lint
npm test --workspace=frontend -- --watchAll=false
npm run build --workspace=frontend
npm test --workspace=backend -- --runInBand
```

Los tests del backend levantan su propio MongoDB en memoria; para usar uno local, definir antes `$env:MONGO_URI_TEST='mongodb://127.0.0.1:27017'`. Usan una base temporal y la borran al terminar.

Los tests HTTP prueban registro, sesión y logout, permisos entre colectivos, rechazo de orígenes ajenos, contactos antes y después de aceptar y de la baja, anonimato y aceptaciones simultáneas con cupo. Al 18/11/2026: 490 tests de backend y 147 de frontend en verde, y el build del front compila sin advertencias.

## Para desplegar

Está explicado en [DEPLOY.md](../../DEPLOY.md). Lo importante: `ALLOWED_ORIGINS` y `PUBLIC_APP_URL` con la URL real, `MONGO_URI`, `ADMIN_API_KEY` y `NODE_ENV=production`. En producción la cookie es `Secure`, así que hace falta HTTPS, y front y API tienen que estar en el mismo sitio.
