# Pruebas manuales de la API

## Ejecución registrada

- Fecha: 9 de septiembre de 2026.
- Commit probado: `5d3787e`.
- Entorno: backend local en `http://localhost:3000`.
- Resultado: 27 casos ejecutados, 27 correctos.

Estas pruebas verifican los contratos HTTP actuales de la primera entrega. Los datos se almacenan en memoria y se pierden al reiniciar el backend.

## Cómo ejecutar la colección

1. Instalar las dependencias desde la raíz del repositorio con `npm install`.
2. Iniciar el backend con `npm run start:backend`.
3. Importar en Postman el archivo `Codigo-a-Voluntad-E1.postman_collection.json`.
4. Abrir la colección y comprobar que la variable `baseUrl` tenga el valor `http://localhost:3000`.
5. Ejecutar la colección completa con **Run collection** y respetar el orden de las carpetas.

La colección genera nombres diferentes en cada ejecución y guarda automáticamente los códigos e identificadores obtenidos. No es necesario copiar IDs manualmente.

## Datos utilizados

### Habilidad

```json
{
  "titulo": "JavaScript",
  "descripcion": "Desarrollo con JavaScript"
}
```

El código de la habilidad es generado por el backend a partir del título normalizado. Para asociar habilidades a colaboradoras o proyectos se debe enviar ese código, no el título.

### Colectivo

```json
{
  "nombre": "Colectivo de prueba",
  "descripcion": "Colectivo utilizado para probar la API",
  "ubicacion": "CABA",
  "tipo": "ONG"
}
```

Tipos admitidos: `FUNDACION`, `ASOCIACION_BARRIAL`, `ONG` y `ASAMBLEA`.

### Colaboradora

```json
{
  "nombreFantasia": "Colaboradora JS",
  "github": "colaboradora-js",
  "habilidades": ["codigo-de-la-habilidad"],
  "pronombres": "ella",
  "presentacion": "Desarrolladora web"
}
```

### Proyecto

```json
{
  "titulo": "Plataforma comunitaria",
  "descripcion": "Proyecto utilizado para probar la API",
  "habilidadesRequeridas": ["codigo-de-la-habilidad"],
  "compromiso": {
    "cantidadHoras": 5,
    "tipo": "SEMANALES"
  },
  "modalidad": {
    "gratuita": true,
    "incentivoEconomico": false,
    "contratacionEventual": false
  }
}
```

Tipos de compromiso admitidos: `TOTALES`, `SEMANALES` y `MENSUALES`.

### Inscripción a un proyecto

```json
{
  "colaboradoraId": "id-de-la-colaboradora"
}
```

### Cierre de un proyecto

```json
{
  "estado": "FINALIZADO"
}
```

## Resultados esperados y obtenidos

| Caso | Método y ruta | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- |
| Health check | `GET /health` | `200`, estado `OK` | `200`, correcto |
| Crear habilidad JavaScript | `POST /api/habilidades` | `201`, habilidad creada | `201`, correcto |
| Crear habilidad duplicada | `POST /api/habilidades` | `400`, `La habilidad ya existe` | `400`, correcto |
| Crear habilidad Java | `POST /api/habilidades` | `201`, habilidad creada | `201`, correcto |
| Crear habilidad sin descripción | `POST /api/habilidades` | `400`, descripción obligatoria | `400`, correcto |
| Listar habilidades | `GET /api/habilidades` | `200`, arreglo de habilidades | `200`, correcto |
| Crear colectivo | `POST /api/colectivos` | `201`, colectivo creado | `201`, correcto |
| Crear colectivo con tipo inválido | `POST /api/colectivos` | `400`, tipo inválido | `400`, correcto |
| Listar colectivos | `GET /api/colectivos` | `200`, arreglo de colectivos | `200`, correcto |
| Crear colaboradora compatible | `POST /api/colaboradoras` | `201`, colaboradora creada | `201`, correcto |
| Crear colaboradora incompatible | `POST /api/colaboradoras` | `201`, colaboradora creada | `201`, correcto |
| Crear colaboradora con habilidad inexistente | `POST /api/colaboradoras` | `400`, habilidad no dada de alta | `400`, correcto |
| Listar colaboradoras | `GET /api/colaboradoras` | `200`, arreglo de colaboradoras | `200`, correcto |
| Crear proyecto | `POST /api/colectivos/:colectivoId/proyectos` | `201`, proyecto en estado `ACTIVO` | `201`, correcto |
| Crear proyecto con habilidad inexistente | `POST /api/colectivos/:colectivoId/proyectos` | `400`, habilidad no dada de alta | `400`, correcto |
| Listar proyectos | `GET /api/proyectos` | `200`, arreglo de proyectos | `200`, correcto |
| Anotar colaboradora compatible | `POST /api/proyectos/:proyectoId/colaboraciones` | `201`, colaboración creada | `201`, correcto |
| Repetir la misma inscripción | `POST /api/proyectos/:proyectoId/colaboraciones` | `400`, inscripción duplicada | `400`, correcto |
| Anotar colaboradora incompatible | `POST /api/proyectos/:proyectoId/colaboraciones` | `400`, no cumple habilidades | `400`, correcto |
| Listar colaboradoras del proyecto | `GET /api/proyectos/:proyectoId/colaboradoras` | `200`, incluye a la colaboradora anotada | `200`, correcto |
| Listar colaboradoras de un proyecto inexistente | `GET /api/proyectos/:proyectoId/colaboradoras` | `404`, proyecto no encontrado | `404`, correcto |
| Listar colaboraciones | `GET /api/colaboraciones` | `200`, arreglo de colaboraciones | `200`, correcto |
| Obtener colaboración | `GET /api/colaboraciones/:colaboracionId` | `200`, colaboración solicitada | `200`, correcto |
| Obtener colaboración inexistente | `GET /api/colaboraciones/:colaboracionId` | `404`, colaboración no encontrada | `404`, correcto |
| Cerrar con estado inválido | `PATCH /api/colectivos/:colectivoId/proyectos/:proyectoId` | `400`, debe ser `FINALIZADO` | `400`, correcto |
| Finalizar proyecto | `PATCH /api/colectivos/:colectivoId/proyectos/:proyectoId` | `200`, proyecto `FINALIZADO` | `200`, correcto |
| Anotarse en un proyecto finalizado | `POST /api/proyectos/:proyectoId/colaboraciones` | `400`, no admite colaboraciones | `400`, correcto |

## Orden del recorrido principal

Las entidades están relacionadas, por lo que el recorrido debe respetar este orden:

1. Crear las habilidades.
2. Crear el colectivo.
3. Crear las colaboradoras utilizando los códigos de las habilidades.
4. Crear el proyecto dentro del colectivo.
5. Anotar una colaboradora compatible en el proyecto.
6. Consultar la colaboración y las colaboradoras asociadas.
7. Finalizar el proyecto.
8. Comprobar que el proyecto ya no acepte nuevas colaboraciones.

Si el backend se reinicia durante el recorrido, hay que volver a ejecutar la colección desde el principio porque todos los identificadores anteriores dejan de existir.
