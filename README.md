# Plataforma "Código a Voluntad" 

Repositorio oficial del Trabajo Práctico Integrador de la materia **Desarrollo de Software** (2° Cuatrimestre 2026) de la **UTN FRBA** (Universidad Tecnológica Nacional, Facultad Regional Buenos Aires).

---

##  Integrantes del Equipo

* **Camila Sol Hernández Greco**
* **Santiago Martín**
* **Luca Belardinelli**
* **Francisco Nicolas Bosi**
* **Pedro Jose Nicolas Alvarez**

---

##  Descripción del Proyecto

**"Código a Voluntad"** es una plataforma de código libre diseñada para actuar como un puente solidario entre **colectivos** (fundaciones, asociaciones barriales, ONGs, asambleas y organizaciones territoriales) que necesitan soluciones de software de clase profesional pero carecen de recursos económicos, y **personas colaboradoras** del ámbito tecnológico dispuestas a aportar su talento, mano de obra y asesoramiento en desarrollo de software de forma altruista o colaborativa.

---

##  Arquitectura y Stack Tecnológico

La arquitectura propuesta es de tipo **cliente-servidor web (cliente pesado)**, optimizada para requerir una infraestructura mínima y de bajo costo:

* **Backend:**
  * **Lenguaje:** JavaScript / Node.js
  * **Framework:** Express.js
  * **Control de Versiones:** Git & GitHub (bajo un flujo de trabajo Git Flow definido)
  * **Testing Unitario:** Jest (capa de servicios y dominio)
  * **Documentación API:** Swagger / OpenAPI

* **Base de Datos:**
  * MongoDB (NoSQL Documental)

* **Frontend:**
  * **Framework:** React
  * **Cliente HTTP:** Axios

* **Despliegue & Infraestructura:**
  * Contenedores Docker para el proceso servidor y MongoDB.
  * Despliegue inicial y progresivo en servidores en la nube (ej. DigitalOcean).

---

##  Plan de Entregas e Iteraciones

###  Primera Entrega
* **Alcance:** Despliegue inicial y API HTTP inicial.
* **Requerimientos mínimos:**
  * Implementación de los elementos del dominio bajo arquitectura de capas.
  * Endpoints REST para carga de colectivos, colaboradores, habilidades y proyectos.
  * Anotación de colaboradores a proyectos con validación de habilidades.
  * Cierre manual de proyectos.
  * Endpoint de *Health Check*.
* **Entregables:** Diagrama de clases, implementación completa de endpoints, explicación de Git Flow y despliegue inicial.

###  Segunda Entrega
* **Alcance:** Segunda iteración de la API HTTP, persistencia y despliegue.
* **Cambios al dominio:**
  * Transición a perfiles requeridos (habilidades obligatorias y opcionales, compromisos y modalidades por perfil).
  * Contribuciones anónimas y gestión interna de medios de contacto.
  * Búsquedas cruzadas y notificaciones internas y por medios alternativos.
  * Carga de logros, porcentajes de avance y enlaces públicos.
* **Tecnologías:** MongoDB, Jest, Swagger automático.

###  Tercera Entrega
* **Alcance:** Interfaz de usuario (UI), sistema de autenticación (Login), postulaciones y despliegue final.
* **Cambios al dominio:**
  * Límites de colaboraciones por perfil y estados de búsqueda abierta/cerrada.
  * Sistema de postulaciones (revisión, aceptación y rechazo manual por parte del colectivo).
  * Funcionalidad de desanotación mutua con advertencias en interfaz.
* **Requerimientos de UI & UX:**
  * Interfaz intuitiva y consistente inspirada en patrones de e-commerce.
  * Feedback visual (loaders, skeletons, alertas de error/confirmación).
  * Diseño completamente responsivo y buenas prácticas de accesibilidad (contrastes, navegación por teclado, etiquetas ARIA).
  * Pantallas completas para gestión de organizaciones, colaboradores, proyectos, búsquedas, mensajería interna, postulaciones y perfiles.

---

##  Git Flow

Para el desarrollo colaborativo de este proyecto, el equipo adopta el siguiente flujo de trabajo basado en **Git Flow**:

1. **`main` / `master`**: Rama principal que contiene el código estable correspondiente a cada entrega oficial aprobada.
2. **`develop`**: Rama de integración para las nuevas funcionalidades. Todas las ramas de características (`feature/*`) parten y se integran aquí mediante Pull Requests.
3. **`feature/*`**: Ramas individuales creadas para el desarrollo de cada historia de usuario o componente específico (ej. `feature/gestion-colectivos`, `feature/api-postulaciones`, `feature/ui-login`).
4. **`release/*`**: Ramas utilizadas para preparar las versiones de entrega final, pruebas de integración y corrección menor de errores.
5. **`hotfix/*`**: Ramas dedicadas a solucionar errores críticos detectados en producción de manera urgente.
