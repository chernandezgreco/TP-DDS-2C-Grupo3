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
| Búsquedas                          | Catálogo textual, proyectos compatibles y candidatas por perfil                      |
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

La inspección visual automatizada fue bloqueada por la herramienta de control de Windows al no poder verificar la URL del navegador. Falta la revisión manual en escritorio/celular y con teclado; no se afirma conformidad WCAG completa ni una validación visual perfecta.

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

Resultado de la revisión: lint sin errores, 11 pruebas de frontend aprobadas y suite completa de backend con 154 pruebas aprobadas. Mongoose actualizado a 8.24.9. Las pruebas usan datos temporales; no se borraron ni sembraron datos de desarrollo.
