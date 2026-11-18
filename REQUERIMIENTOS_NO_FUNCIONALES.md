# Justificación de los requerimientos no funcionales

Tercera entrega, grupo 3. Para cada lineamiento de UI del enunciado contamos qué hicimos, dónde se ve en la aplicación y qué quedó afuera. Todo se puede comprobar en https://codigo-a-voluntad-g3.onrender.com o levantando el proyecto en local (ver el [README](README.md)).

## 1. Interfaz intuitiva

El enunciado pide que alguien sin experiencia en plataformas parecidas entienda la aplicación y llegue a las funciones principales en pocos clics.

- Menú fijo con las secciones de siempre: Explorar proyectos, Colectivos, Colaboradoras, Mi espacio, Mensajes, Términos y Habilidades. La sección actual queda marcada (`aria-current="page"`).
- Cada pantalla tiene su dirección (`#proyectos`, `#proyecto/<id>`, `#espacio`, ...), así que el botón Atrás del navegador funciona y se puede compartir un enlace directo a un proyecto o a un perfil.
- Migas de pan arriba del contenido y "← Volver al listado" en el detalle de un proyecto.
- Las acciones que se muestran dependen de quién está usando la app. Una colaboradora ve "Postularme" en los perfiles; el colectivo dueño ve editar, finalizar, postulaciones y tareas; un visitante solo ve el contenido público. Por ejemplo, "Denunciar" no aparece para los colectivos, porque el servidor solo acepta denuncias de colaboradoras.
- Los casos de uso principales están a uno o dos clics de la portada: buscar un proyecto, abrirlo y postularse; o desde Mi espacio, editar los datos, ver las postulaciones y descargar los datos personales.
- En varios casos, cuando algo no se puede hacer, la interfaz dice por qué en vez de solo deshabilitar el botón: si a la colaboradora le falta una habilidad requerida, si venció la fecha de postulación, si la búsqueda está cerrada o si el proyecto está finalizado (en las tareas).

Dónde verlo: `packages/frontend/src/App.js` (menú, migas y rutas por hash) y el recorrido de [ENTREGA3.md](packages/frontend/ENTREGA3.md).

## 2. Aprendizaje rápido (patrones de ecommerce)

Usamos el mismo esquema que una tienda online, que la mayoría de la gente ya conoce: catálogo → ficha → acción.

- El catálogo de proyectos es una grilla de tarjetas, como el listado de productos de una tienda. Cada tarjeta muestra si la búsqueda está abierta, el título, la descripción, las habilidades que se piden, las etiquetas, la cantidad de perfiles y el botón "Ver proyecto".
- Hay un buscador arriba ("Buscar por nombre, causa o habilidad…") con filtros al lado: "Solo búsquedas abiertas", "Para mis habilidades" y etiquetas. Los filtros se pueden combinar y quitar de a uno, como los filtros de una tienda.
- La ficha del proyecto funciona como la de un producto: descripción, perfiles con sus condiciones (habilidades, horas, modalidad, cupo y fecha) y el botón principal de acción ("Postularme") al lado de cada perfil.
- "Mi espacio" cumple el papel de "Mi cuenta": datos personales, postulaciones con su estado, contactos, preferencias y la descarga de datos.
- Los formularios tienen etiquetas claras, campos opcionales marcados como tales, ayudas donde hacen falta (por ejemplo, cómo elegir varias habilidades o cómo se escriben las etiquetas) y vista previa del Markdown en las descripciones.
- Cuando una lista está vacía, en vez de quedar en blanco la pantalla explica qué hacer ("Todavía no hay resultados", "Aún no hay colaboraciones aceptadas").

## 3. Feedback visual y notificaciones

Cada acción relevante tiene una respuesta visible: algo pasando, éxito o error.

- Cargando. Mientras llegan los datos se muestra "Cargando información…" en una región `role="status"`, que también anuncian los lectores de pantalla. Lo mismo al comprobar la sesión, al actualizar los datos de Mi espacio, al cargar contactos, al generar la descarga de datos y en cada sección que pide algo al backend.
- Mientras se envía un formulario o una acción, los botones quedan deshabilitados y algunos cambian el texto ("Preparando archivo…"). Eso también evita los envíos dobles.
- Éxito. Después de guardar aparece un aviso de confirmación con ✓ ("Postulación enviada para revisión del colectivo.", "Cuenta eliminada. El historial del colectivo se conserva.", etc.).
- Error. Los errores se muestran con `role="alert"`, el mensaje que manda el servidor y un ícono ⚠. Si falla la carga inicial hay un botón "Reintentar carga". Si la sesión vence, la app avisa y vuelve al estado de visitante sin mostrar datos privados.
- Las acciones permanentes (dar de baja una colaboración, eliminar un proyecto, una tarea o una cuenta) piden confirmación antes, y el texto explica qué se pierde. La baja de una colaboración dice explícitamente que es permanente, como pide el enunciado.

Quedó afuera: no usamos *skeletons* (siluetas grises del contenido mientras carga), solo mensajes de carga y botones deshabilitados. Con la cantidad de datos del TP las cargas son cortas, salvo la primera visita a Render después de un rato sin uso, que puede tardar unos 50 segundos mientras el servicio se despierta. En ese caso se ve el mensaje "Cargando información…".

## 4. Diseño responsivo

- La grilla del catálogo pasa de tres columnas a dos y a una según el ancho, con cortes en 1500, 1150, 760 y 640 px (`App.css`).
- En celular el menú de secciones se desplaza horizontalmente, el encabezado pasa a dos líneas y las tablas (por ejemplo la de tareas) se muestran como tarjetas sin perder su estructura para los lectores de pantalla. El Gantt tiene su propio scroll horizontal.
- Los botones tienen al menos 44 px de alto para tocarlos cómodos con el dedo.
- Lo probamos en Chrome a 1900 y 1400 px de ancho y en modo celular a 375 px (iPhone SE).

## 5. Accesibilidad

- Navegación por teclado: enlace "Saltar al contenido" al principio, foco visible (borde de 3 px) en botones, enlaces y campos, y todos los controles son nativos (`button`, `select`, `input`), así que funcionan con Tab, Enter y Espacio. El recorrido con Tab lo probamos en el navegador.
- Los formularios se abren en un modal con `aria-modal` que mantiene el foco adentro, se cierra con Escape y devuelve el foco al botón que lo abrió.
- Lectores de pantalla: todos los campos tienen su etiqueta, los estados se anuncian con `role="status"` y los errores con `role="alert"`, la decoración tiene `aria-hidden` y las imágenes tienen texto alternativo. El Gantt es visual (`aria-hidden`) y debajo tiene una tabla con la misma información.
- Contraste según WCAG AA (4.5:1 para texto): texto principal 11.5:1, botones 6.4:1, enlaces 6.0:1. Encontramos 15 textos secundarios por debajo del mínimo y los oscurecimos. Las etiquetas y los metadatos que tenían 10 u 11 px pasaron a 12 px.
- Modo daltónico (adicional 20): un botón en el encabezado cambia toda la paleta por una basada en Okabe-Ito. Además, la información nunca depende solo del color: los errores llevan ⚠, los éxitos ✓ y los estados de las tareas tienen patrón y texto propios.
- `lang="es"` en el documento, para que el lector de pantalla use la pronunciación correcta.

El detalle de la revisión, con los valores de contraste, está en [ENTREGA3.md](packages/frontend/ENTREGA3.md#revisión-de-accesibilidad-17112026).

Quedó afuera: no hicimos una prueba completa con un lector de pantalla real ni afirmamos conformidad WCAG total.

## 6. Consistencia

- Todos los colores salen de variables CSS en un solo archivo (`App.css`), y el modo daltónico solo redefine esas variables. Ningún componente define colores propios.
- Una tipografía (Inter) para toda la interfaz. La monoespaciada aparece solo en los íconos decorativos de las tarjetas.
- Los formularios de alta y edición (proyectos, perfiles, logros, tareas, datos personales) usan el mismo componente `ResourceForm`, así que todos se ven y se comportan igual: mismas etiquetas, mismos mensajes de validación y mismo modal.
- Los textos en Markdown se muestran siempre con el mismo componente (`Markdown.js`), y las etiquetas con `ListaEtiquetas.js`.
- Los mensajes siguen el mismo patrón en toda la app: estado de carga, aviso de éxito y error con las mismas clases (`.success`, `.error`, `.hint`) y el mismo lugar en la pantalla.
- Mismas palabras para lo mismo en todas las pantallas: "postulación", "colaboración", "perfil", "Dar de baja", "Mi espacio".

## Requerimientos técnicos de la entrega

| Pedido | Cómo lo cumplimos |
|---|---|
| React con CRA o Next sin rutas dinámicas | Create React App (`react-scripts`). La navegación usa el hash de la URL, sin router ni rutas dinámicas |
| Cliente HTTP Axios | `packages/frontend/src/api.js`: una instancia con `withCredentials` para mandar la cookie de sesión y un interceptor que unifica los errores |
| Un test de integración en los controladores | `packages/backend/test/services/*Http.test.js`, por ejemplo `AuthHttp.test.js`: levantan la app real y le hacen pedidos HTTP con sesiones |
| Un test de integración en el front | `packages/frontend/src/App.test.js`, "permite explorar y postularse desde una sesión de colaboradora" |
| Login y rutas privadas | Cookie de sesión HttpOnly (`Secure` en producción), contraseñas con scrypt y el middleware `autorizar`, que controla en el servidor que cada cambio lo haga el dueño del recurso |
| Aplicación desplegada | https://codigo-a-voluntad-g3.onrender.com ([DEPLOY.md](DEPLOY.md)) |
