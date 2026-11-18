# Entrega 3 — Guía actual del frontend

El frontend usa autenticación real mediante una cookie de sesión HttpOnly. Se eliminó el selector que permitía elegir cualquier identidad. Las rutas de modificación validan en el servidor que la sesión sea titular del perfil o del colectivo propietario del proyecto.

## Iniciar

1. En la raíz: `npm install`.
2. MongoDB: `docker compose up -d mongo`.
3. Si no existe, copiar `packages/backend/.env.example` a `packages/backend/.env`. Usar SERVER_PORT=8000, MONGO_URI=mongodb://localhost:27017/codigo_a_voluntad y ALLOWED_ORIGINS=http://localhost:3000.
4. `npm run dev:backend` y dejar esa terminal abierta.
5. En otra terminal, `npm run start:frontend`.
6. Abrir http://localhost:3000. Usar `localhost` para ambos servicios, sin mezclarlo con `127.0.0.1`, para mantener la cookie y el origen configurado.

Para otra API, configurar REACT_APP_API_URL en `packages/frontend/.env.local` y reiniciar CRA. Es una URL pública; no incluir claves ni contraseñas allí. El frontend envía las cookies mediante Axios withCredentials.

No se ejecutaron seeds ni se borró la base de desarrollo. Las pruebas usan una base test\_<PID> separada y la eliminan al terminar.

## Primer acceso

- Usar **Iniciar sesión / Registrarme → Crear cuenta**. Elegir colectivo o persona colaboradora.
- Registrar correo de acceso, contraseña de al menos 10 caracteres y los datos del perfil. El registro inicia la sesión.
- Los perfiles históricos o creados por seeds no tienen contraseña asociada. No se asignan a una cuenta por conocer su id. Para probar, crear cuentas nuevas; una migración de cuentas históricas necesitaría un procedimiento administrativo que verifique titularidad.
- Si el catálogo está vacío, la administración puede cargar habilidades desde **Habilidades → Administrar catálogo**, usando ADMIN_API_KEY configurada en el backend. Las personas colaboradoras deben registrar al menos una habilidad existente.
- El correo de acceso, los hashes de contraseña y las sesiones no se publican en los listados. Los contactos se comparten con colectivos sólo después de una colaboración aceptada.

## Recorrido del colectivo

1. Crear cuenta de colectivo.
2. Explorar proyectos → Crear proyecto. Completar título, descripción, declaración de IA y aceptar explícitamente los términos vigentes.
3. Abrir proyecto → Agregar perfil. Elegir habilidades, compromiso y modalidad. Cupo y fecha de búsqueda son opcionales.
4. Buscar colaboradoras desde cada perfil. Enviar mensaje interno a quien acepte mensajería.
5. Consultar postulaciones pendientes; aceptar o rechazar. El servidor verifica que la postulación corresponda al proyecto de ese colectivo. El cupo limita colaboraciones aceptadas, no postulaciones pendientes.
6. Consultar contactos desde una colaboración aceptada. Un colectivo ajeno no tiene acceso aunque conozca el id.
7. Publicar, editar y eliminar logros; consultar avances y enlaces a repositorio/sistema.
8. Editar proyecto, pausar/reabrir búsqueda o finalizarlo. Los proyectos con historial se finalizan, no se eliminan; los perfiles con historial tampoco se eliminan.
9. Mi espacio → Editar mis datos para modificar la organización.

## Recorrido de la colaboradora

1. Crear cuenta con habilidades y nombre público. Se admiten nombres de fantasía.
2. Mi espacio → Editar mis datos para actualizar presentación, pronombres, GitHub/GitLab y habilidades.
3. Agregar contactos privados, editarlos o quitarlos. Activar/desactivar mensajes de colectivos.
4. Explorar proyectos; buscar por nombre o habilidad, filtrar búsquedas abiertas y usar Para mis habilidades.
5. Abrir un proyecto y postularse al perfil compatible. Se exige al menos una habilidad requerida, búsqueda abierta y fecha/cupo vigentes.
6. Elegir si la contribución será pública como anónima. Se conserva la identidad internamente para permitir seguimiento y baja; los visitantes no la reciben.
7. Consultar el estado de las postulaciones y proyectos aceptados en Mi espacio; leer notificaciones en Mensajes.
8. Dar de baja una colaboración. La interfaz advierte que es permanente. Después de la baja el colectivo pierde el acceso concedido por esa colaboración, salvo que exista otra colaboración aceptada entre ambos.

## Cobertura de pantallas obligatorias

| Consigna                           | Implementación                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| Registro y edición de organización | Registro con cuenta y Mi espacio                                                     |
| Registro y edición de colaboradora | Registro con cuenta, edición de perfil, habilidades y contactos                      |
| CRUD de proyectos                  | Crear, detalle, editar y eliminar sin historial; cierre para conservar historial     |
| Búsquedas                          | Catálogo textual, filtro por etiquetas, proyectos compatibles y candidatas por perfil |
| Detalle y avance                   | Atributos, perfiles, ocupantes, compromisos, modalidades, logros y enlaces           |
| Contacto interno                   | Envío desde candidatas compatibles, sujeto a preferencia                             |
| Mensajes                           | Bandeja de la colaboradora autenticada                                               |
| Postulaciones                      | Envío, seguimiento personal, pendientes/procesadas y decisiones del colectivo        |
| Desanotación                       | Baja permanente por colaboradora o colectivo con advertencia                         |
| Contactos privados                 | Endpoint y vista autorizada para titular/colectivo con colaboración aceptada         |
| Login y permisos                   | Registro/login/logout/sesión, cookie HttpOnly, hash scrypt, autorización por recurso |

Los cinco adicionales de este trabajo están explicados en [ADICIONALES.md](ADICIONALES.md). Los otros adicionales asignados a compañeros no se dan por implementados ni integrados: requieren sus módulos y contratos finales.

## UI y accesibilidad

Navegación por hash y enlaces directos de RSS; búsqueda, estados vacíos y errores con reintento. Formularios con etiquetas y controles nativos, validación de datos, prevención de envíos repetidos y vista previa de Markdown. Indicadores de carga y mensajes anunciables por lectores de pantalla. Modal con foco contenido, Escape y devolución de foco. Grillas de tres/dos/una columnas y navegación móvil horizontal. Se admiten errores por permisos y sesión vencida sin mostrar datos privados.

### Revisión de accesibilidad (17/11/2026)

Revisión del código y de los estilos, sin recorrido visual en el navegador:

- **Idioma y metadatos:** `lang="es"`, título y viewport definidos.
- **Teclado y foco:** enlace para saltar al contenido, indicador de foco visible (borde de 3 px) en botones, enlaces y campos; el modal contiene el foco, se cierra con Escape y lo devuelve.
- **Lectores de pantalla:** estados y errores con `role="status"` / `role="alert"`, modal con `aria-modal`, página actual con `aria-current`, imágenes con texto alternativo, decoración con `aria-hidden`. Todos los campos de formulario tienen su etiqueta.
- **Tamaño táctil:** botones de al menos 44 px de alto.
- **Contraste (WCAG AA, mínimo 4.5:1):** texto principal 11.5:1, botones 6.4:1, enlaces 6.0:1. Se encontraron 15 textos secundarios (migas de pan, contadores, pie de página, ayudas) con contraste entre 3.0:1 y 4.5:1; se oscurecieron manteniendo el tono hasta superar 4.5:1. Los elementos decorativos (`aria-hidden`) quedaron como estaban.
- **Tamaño de texto:** las etiquetas y metadatos de 10 a 11 px pasaron a 12 px.
- **Diseño adaptable:** cortes en 1500, 1150 y 760 px.

Revisión visual (17/11/2026, capturas en Chrome): escritorio a 1900 px y celular a 375 px (modo dispositivo, iPhone SE) en el listado de proyectos. Con los textos secundarios más oscuros y de 12 px, las tarjetas, el encabezado, el pie y el menú se ven sin desbordes; en celular las tarjetas pasan a una columna y el menú de secciones se desplaza horizontalmente. Se detectaron y corrigieron dos defectos: el botón "Denunciar" aparecía para los colectivos (el servidor sólo admite denuncias de colaboradoras) y las tarjetas decían "1 perfiles".

Recorrido con teclado (17/11/2026): se probó la navegación con la tecla Tab en el navegador y funciona.

### Modo daltónico (adicional 20)

Botón **Modo daltónico** en el encabezado, visible con y sin sesión. Cambia toda la app a una paleta distinguible con daltonismo y recuerda la elección en el navegador.

- **Cómo funciona:** el botón pone `data-vision="daltonico"` en `<html>`. Los colores con significado de `App.css` son variables (acción principal y links, éxito, error, peligro, badges, página actual, estados de tareas, línea "hoy" del Gantt y foco), y el bloque `:root[data-vision="daltonico"]` sólo las redefine: ningún componente conoce los colores. La lógica (leer, guardar y aplicar la preferencia) está en `vision.js`; el botón, en `BotonModoDaltonico.js`. `index.js` aplica la preferencia antes del primer render para que no parpadee la paleta normal. Si el navegador bloquea `localStorage`, la app sigue con la paleta normal.
- **Paleta:** basada en Okabe-Ito. El par verde/rojo (éxito/error, principal/peligro) pasa a azul/naranja. Estados de tareas: pendiente gris, en curso azul, finalizada ámbar, cerrada naranja quemado; la línea "hoy" pasa a negro. Para que la pantalla quede homogénea, también los 66 tonos verdes de la interfaz (fondos claros, bordes, textos secundarios, ilustración del inicio, sombras) son variables `--ui-*` que en modo daltónico pasan a azul grisáceo **con la misma luminancia**: como el contraste depende sólo de la luminancia, todos los contrastes quedan idénticos a los del modo normal, ya revisados.
- **Por qué:** con la paleta normal, el verde de éxito y el rojo de error son casi iguales para una persona con protanopía (diferencia de color ΔE 6.9, simulación de Machado 2009). Con la paleta daltónica superan ΔE 70 en protanopía, deuteranopía y tritanopía. Entre los cuatro estados de tareas la diferencia mínima pasa de 10.7 a 18.6 (finalizada/cerrada con deuteranopía); esos dos estados se distinguen además por patrón y borde.
- **No sólo color (WCAG 1.4.1):** todos los mensajes de error llevan un ícono ⚠ agregado por CSS (`.error::before`, oculto para lectores de pantalla porque el texto alcanza); esto también se ve en el modo normal. El aviso general de éxito lleva ✓ y los estados del Gantt tienen patrón y texto propios. El botón anuncia su estado con `aria-pressed` y lo muestra con una marca ✓.
- **Contraste:** en la paleta daltónica, los textos con significado (éxito, error, peligro, badges, página actual) y el color principal sobre blanco, el fondo de página, el bloque de inicio y la página actual superan 4.5:1; los bordes de estado superan 3:1. Los tonos `--ui-*` conservan exactamente el contraste del modo normal: algunos textos decorativos del bloque de inicio y de la nota lateral ya estaban entre 3.7 y 4.4:1 en el modo normal y siguen igual (no los introduce este cambio).
- **Pruebas:** `paleta.test.js` lee `App.css` y comprueba esos pares en las dos paletas, que el modo daltónico sólo redefina variables existentes, que no quede ningún verde y que los tonos `--ui-*` conserven la luminancia. `BotonModoDaltonico.test.js` y `vision.test.js` cubren el botón (también sólo con teclado), la persistencia y el almacenamiento bloqueado.
- **Modo normal:** no cambia ningún color; lo único nuevo es el ícono ⚠ de los errores.

Verificación visual (17/11/2026): capturas en Chrome del build de producción a 1400 y 375 px con el modo apagado y encendido, y con la emulación de protanopía, deuteranopía y tritanopía de DevTools. En la simulación con la paleta normal, los cuadros de éxito y error se ven del mismo beige; con la paleta daltónica, azul y caqui. El foco (borde negro de 3 px) se ve en modo daltónico. En celular el encabezado pasa a dos líneas (el botón arriba y el de sesión abajo), sin desbordes. Falta recorrerlo con datos reales (backend levantado).

Lo que no está verificado: el cierre del modal con Escape, el recorrido completo solo con teclado y el uso con un lector de pantalla, las demás pantallas en celular (detalle, formularios, mensajes), y no se afirma conformidad WCAG completa.

### Etiquetado (adicional 34)

Los proyectos y los colectivos pueden tener etiquetas libres (por ejemplo `#educacion`, `#software-libre`) para encontrarlos más fácil.

- **Carga:** campo **Etiquetas (opcional)** al registrar un colectivo, en **Mi espacio → Editar mis datos** y al crear o editar un proyecto. Se agregan con Enter o coma, se quitan con ✕ o con Backspace, y lo que queda escrito sin confirmar se suma al guardar. Sugiere las etiquetas que ya se usan, para no crear variantes.
- **Normalización:** se guardan en minúsculas, sin acentos y con guiones en lugar de espacios: "Educación Popular" queda `educacion-popular`, así distintas formas de escribirla son la misma etiqueta. Cada una tiene de 2 a 30 caracteres; hasta 10 por proyecto o colectivo, sin repetir. La regla vive en el dominio del backend (`domain/etiquetas.js`); el front tiene una copia (`etiquetas.js`) sólo para mostrar cómo va a quedar y avisar antes de enviar.
- **Edición:** como el resto de los campos, si no se envían se conservan; si se envían, la lista reemplaza a la anterior (`[]` las quita). Agregar perfiles o logros no las modifica.
- **Búsqueda:** las tarjetas, el detalle del proyecto y el perfil del colectivo muestran las etiquetas como botones; al elegir una se filtra el listado con `GET /api/proyectos?etiquetas=a,b` o `GET /api/colectivos?etiquetas=a,b`, que devuelve los que tienen **todas** las etiquetas pedidas. Se pueden sumar varias, quitarlas de a una o limpiar el filtro, y se combina con "Solo búsquedas abiertas" y "Para mis habilidades". El buscador de texto también encuentra por etiqueta e ignora los acentos ("alimentación" encuentra `#alimentacion`). En **Mi espacio** las etiquetas se muestran sin filtro.
- **Pruebas:** backend `test/domain/Etiquetas.test.js`, `test/services/ConsultaEtiquetas.test.js` y `test/services/EtiquetasHttp.test.js` (normalización, límites, conservar o reemplazar al editar, que agregar un logro no las pise, filtro con todas, parámetro vacío o inválido y que se sigan excluyendo los suspendidos). Frontend `etiquetas.test.js`, `EtiquetasInput.test.js` y `App.etiquetas.test.js`.

Lo que no está verificado: el recorrido visual en el navegador (escritorio y celular) y con lector de pantalla.

### Portabilidad de datos (adicional 26)

Cualquier cuenta con sesión, colectivo o colaboradora, puede descargar una copia de todos sus datos personales en JSON o CSV.

- **Cómo probarlo:** iniciar sesión, ir a **Mi espacio → Tus datos**, elegir el formato y tocar **Descargar mis datos**. Baja un archivo `codigo-a-voluntad-datos-colaboradora-AAAA-MM-DD.json` (o `colectivo`, o `.csv`). Los avisos de **Eliminar mi cuenta** y **Eliminar cuenta del colectivo** sugieren descargar los datos antes, porque una cuenta eliminada ya no puede iniciar sesión.
- **API:** `GET /api/mi/exportacion?formato=json|csv` (`json` por defecto). La identidad sale sólo de la cookie de sesión: no hay id en la URL, así que no se pueden pedir datos de otra cuenta. Responde 401 sin sesión, 400 con un formato inválido y 429 al superar 5 descargas exitosas cada 15 minutos por cuenta (`EXPORT_RATE_LIMIT` y `EXPORT_RATE_WINDOW_MS`). Los pedidos rechazados no consumen cuota. Headers: `Content-Disposition: attachment`, `Cache-Control: no-store` y `nosniff`.
- **Qué incluye:** una sección `metadatos` (versión del formato, fecha, titular, secciones y lista de lo excluido) y una sección por tipo de dato. La colaboradora recibe su cuenta, su perfil **con sus propios contactos**, habilidades y experiencia, postulaciones, colaboraciones, mensajes recibidos, tareas asignadas, denuncias realizadas y la conexión de LinkedIn. El colectivo recibe su cuenta, su perfil con etiquetas y moderación, sus proyectos completos (perfiles, logros, usos de IA, etiquetas), tareas, postulaciones y colaboraciones recibidas, mensajes enviados, revisiones de términos, denuncias realizadas y LinkedIn.
- **Protección de datos:** nunca se exportan la contraseña, la sal, las sesiones, los tokens de LinkedIn ni las denuncias recibidas. En el archivo del colectivo, las colaboradoras figuran **sólo con id y nombre de fantasía**, sin contactos aunque la postulación esté aceptada (minimización: los contactos son datos de otra persona y un archivo se puede reenviar o perder). El service elige los campos uno por uno, así un campo nuevo de un modelo no se filtra al export hasta que se decida incluirlo. No se registra quién exporta.
- **CSV:** un solo archivo en formato largo con las columnas `seccion,registro,campo,valor` (por ejemplo `proyectos,1,perfiles[1].descripcionPerfil,Tester`), con BOM para que Excel muestre los acentos. Los valores que empiezan con `=`, `+`, `-` o `@` llevan un apóstrofo adelante para que la planilla no los ejecute como fórmula; el JSON conserva el valor original.
- **Capas:** dominio `domain/Exportacion/ExportacionDatos.js` (metadatos, exclusiones, referencia mínima a terceros, nombre del archivo y aplanado a CSV), service `PortabilidadService.js`, controller `PortabilidadController.js`, ruta `routes/Portabilidad.js` con `requiereSesion`, `validarQuery` y `limiteExportacion`, y `utils/csv.js`. En el front, `PortabilidadDatos.js`. Documentado en Swagger bajo el tag "Portabilidad".
- **Pruebas:** backend `test/domain/ExportacionDatos.test.js`, `test/utils/Csv.test.js` y `test/services/PortabilidadHttp.test.js` (sesión, formato, límite por cuenta, contenido de los dos tipos de cuenta, que ningún secreto aparezca en la respuesta, que una cuenta no reciba datos de otra, que el colectivo no reciba contactos de colaboradoras, CSV y etiquetas). Frontend `PortabilidadDatos.test.js` (descarga en los dos formatos, estado de carga, mensaje del límite y accesibilidad).

Lo que no está verificado: la descarga en un navegador real (está probada con tests y con pedidos HTTP reales), en particular en Safari.

## Validación técnica

```powershell
npm run lint
npm test --workspace=frontend -- --watchAll=false --runInBand
npm run build --workspace=frontend
$env:MONGO_URI_TEST='mongodb://127.0.0.1:27017'
npm test --workspace=backend -- --runInBand
```

La suite HTTP comprueba registro, sesión/logout, identidad, autorización entre colectivos, rechazo de orígenes ajenos, contactos antes/después de aceptación y baja, anonimidad y aceptaciones simultáneas con cupo. La serialización de decisiones funciona en el servidor único del TP; si se escala a varios procesos hace falta coordinación/atomicidad compartida.

## Para desplegar

Configurar el origen real del frontend en ALLOWED_ORIGINS, la URL pública en PUBLIC_APP_URL, MongoDB y ADMIN_API_KEY. En producción las cookies requieren HTTPS (Secure). Usar mismo sitio para frontend/API con SameSite=Lax; una arquitectura entre sitios distintos requiere revisar cookies y CSRF. No habilitar trust proxy indiscriminadamente.

El despliegue del equipo, la integración de los adicionales de compañeros y la prueba manual final siguen fuera del resultado verificado localmente.

Resultado de la revisión (17/11/2026): lint sin errores, 20 pruebas de frontend y 260 de backend aprobadas, y compilación del frontend correcta. Mongoose actualizado a 8.24.9. Las pruebas usan datos temporales; no se borraron ni sembraron datos de desarrollo.
