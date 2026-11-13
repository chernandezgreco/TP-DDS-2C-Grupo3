# Frontend de entrega 3 — Código a Voluntad

Trabajo realizado sobre `3era-entrega`, a partir de `origin/3era-entrega` disponible en este checkout. No se hizo push ni publicación. El cambio local previo de ProyectoService en develop está conservado en el stash `codex: preservar cambio local develop antes de entrega3`; no aplicarlo automáticamente a esta rama porque corresponde a una versión anterior del servicio.

## Para levantarlo

Desde la raíz del repositorio:

1. `npm install`
2. `docker compose up -d mongo` (sólo Mongo; el servicio backend del compose usa el puerto 3000 y colisionaría con CRA).
3. Copiar `packages/backend/.env.example` a `packages/backend/.env`, si todavía no existe. Usa Mongo local y puerto 8000.
4. `npm run dev:backend`
5. En otra terminal: `npm run start:frontend`
6. Abrir http://localhost:3000. La API predeterminada es http://localhost:8000/api.

Para otra API, copiar `.env.example` del frontend a `.env.local`, cambiar REACT*APP_API_URL y reiniciar CRA. No incluir credenciales en variables REACT_APP*: se publican en el bundle.

No ejecuté seeds: el script existente borra las colecciones. Sobre una base vacía podés registrar colectivos y colaboradoras desde la interfaz; las habilidades deben cargarse desde la API administrativa o mediante seeds sobre una base descartable.

## Flujos implementados con la API existente

- Navegación por proyectos, colectivos, colaboradoras, espacio personal y mensajes mediante hash (sin depender de configuración de rutas del servidor).
- Búsqueda textual por nombre, descripción y habilidades; filtro de búsquedas abiertas; búsqueda de proyectos compatibles vía backend.
- Registro de colectivos y colaboradoras con habilidades, presentación y datos opcionales.
- Selección explícita de entidad para probar los flujos en desarrollo. **No es un login ni demuestra autorización.**
- Crear proyecto; detalle con perfiles, modalidad, compromiso, cupos y fecha; pausar/reabrir búsqueda y finalizar proyecto.
- Alta, edición y eliminación de perfiles; búsqueda de candidatas compatibles y envío de notificación interna.
- Postulación a un perfil con anonimidad opcional; revisión de pendientes y procesadas; aceptación y rechazo.
- Listado de colaboraciones por proyecto y baja con advertencia de acción permanente desde ambos lados.
- Alta, consulta, edición y eliminación de logros; porcentaje de avance; enlaces HTTP/HTTPS a código fuente y sistema.
- Agregar habilidades y medios de contacto privados; activar/desactivar preferencia de mensajería; bandeja de notificaciones.
- Estados de carga, errores de API, reintento, confirmaciones, formularios HTML con etiquetas y validaciones básicas.

La UI no muestra medios de contacto privados. La ruta de consulta autorizada de contactos todavía no existe; no se intenta sustituirla leyendo datos de otras entidades.

## Pendientes que impiden declarar la entrega completa

| Consigna                          | Estado / coordinación necesaria                                                                                                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login y rutas privadas            | Falta autenticación backend, endpoints de registro/login/logout/sesión y autorización por entidad. Después reemplazar el selector de desarrollo e integrar credenciales. Ocultar botones en React no protege la API.               |
| Edición de organización y persona | Implementado: edición general desde Mi espacio, con persistencia y validación en backend. Queda integrar permisos de sesión.                                                                                                       |
| CRUD completo de proyectos        | Implementado: editar título/descripción y eliminar proyectos sin historial. Los que tienen historial deben finalizarse. Queda integrar permisos de sesión.                                                                         |
| Consulta autorizada de contactos  | Falta endpoint que valide colaboración aceptada y pertenencia al colectivo en servidor.                                                                                                                                            |
| Privacidad y anonimidad           | La API global de colaboradoras/colaboraciones no tiene autenticación. El servicio tiene un TODO sobre anonimidad que sustituye el id real por "Anonimo"; debe conservar identidad internamente para permitir bajas sin publicarla. |
| Cupos y fechas opcionales         | El schema actual obliga ambos campos; el formulario respeta ese contrato. La consigna los considera opcionales: acordar y corregir backend antes de hacerlos opcionales en UI.                                                     |
| Opcionales                        | No se afirman implementados. Coordinar los módulos que están haciendo los compañeros antes de conectar endpoints nuevos.                                                                                                           |
| Integración y despliegue          | Probar contra Mongo real, autenticación final y servidor compartido; falta despliegue de la entrega.                                                                                                                               |
| Test de controlador               | Pendiente del equipo backend según consigna.                                                                                                                                                                                       |

Según el chat: Camila tomó frontend; Fran tomó eliminación de colectivos, denuncias, experiencia de habilidades y redes sociales; Nicolás tomó Gantt, tags, portabilidad y modo daltónico; Luca tomó eliminación personal, sanitización y cierre automático. El chat contiene imágenes y audios omitidos: no fue posible deducir su contenido.

## Orden recomendado para terminar tu parte

1. Mostrar al grupo los recorridos implementados y acordar los contratos faltantes de la tabla.
2. Probar con dos colaboradoras y un colectivo: crear proyecto → agregar perfil → postularse → aceptar/rechazar → publicar logro → baja permanente. También probar habilidades insuficientes, fecha vencida y cupo lleno.
3. Integrar login real y permisos antes de exponer datos reales o publicar.
4. Conectar edición/cierre/eliminación/contactos y opcionales cuando estén las rutas.
5. Repetir prueba de integración con Mongo, revisar móvil/teclado y desplegar con el grupo.

## Arquitectura para explicar en la defensa

`App.js` mantiene navegación, entidad seleccionada, catálogo y flujos. `forms.js` define campos reutilizables y traduce el formulario de perfil a los objetos compromiso/modalidad y fecha DDMMYYYY que espera la API actual. `api.js` centraliza Axios, URL configurable, timeout y errores. El estado remoto se vuelve a consultar después de una mutación; no hay persistencia ficticia en localStorage.

Responsive: tres columnas en escritorio, dos en ancho intermedio y una en móvil; navegación horizontal en pantallas chicas. Accesibilidad: controles nativos, etiquetas, enlace para saltar al contenido, mensajes de estado y errores anunciables, foco visible y nombres accesibles. El modal contiene el foco y lo devuelve al control anterior al cerrarse. Falta una auditoría completa con lector de pantalla antes de afirmar conformidad WCAG.

## Comprobaciones

`npm test --workspace=frontend -- --watchAll=false --runInBand`: pruebas de interacción de componentes con la frontera HTTP sustituida; no son pruebas E2E ni verifican persistencia Mongo. Cubren postulación desde exploración, filtro y fallo de conexión.

`npm run build --workspace=frontend`: genera el bundle para producción.

Correcciones puntuales backend: parámetro proyectoId en cambiarBusqueda; preservar fechaLimite y cantidadLimite al reconstruir Perfil durante edición.

Resultado de esta sesión: tres pruebas de frontend aprobadas y compilación de producción exitosa. La comprobación puntual de edición de Perfil conserva cupo, fecha y habilidades. No hubo prueba E2E contra MongoDB: el backend no estaba escuchando en 8000. El navegador de verificación no pudo acceder al localhost del entorno; queda pendiente inspección visual en el navegador local.

## Segundo avance: edición y persistencia

- Mi espacio → Editar mis datos para colectivos y colaboradoras.
- Detalle de proyecto → Editar proyecto y Eliminar proyecto.
- PATCH /api/colectivos/:id y PATCH /api/colaboradoras/:id: actualizaciones parciales con campos permitidos y validación de dominio; conservan contactos y preferencias.
- PUT /api/colectivos/:colectivoId/proyectos/:proyectoId: título y descripción; valida que el proyecto pertenezca al colectivo indicado en la ruta. Esto no sustituye autenticación de sesión.
- DELETE en la misma ruta: sólo proyectos sin postulaciones, colaboraciones o logros. Conservación de historial como decisión de implementación.
- Corrección: estaBuscando ahora se guarda en el schema de MongoDB.
- Swagger incluye las operaciones nuevas.
- Test HTTP de controlador y persistencia: test/services/EdicionHttp.test.js usa una base test\_<PID> separada mediante el helper existente; no usar la base de desarrollo como base de pruebas manuales destructivas.

Las rutas nuevas, igual que las existentes, aún requieren autenticación y autorización antes de un despliegue compartido.
