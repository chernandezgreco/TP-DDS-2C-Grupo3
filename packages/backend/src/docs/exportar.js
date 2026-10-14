// Exporta la especificación OpenAPI a docs/openapi.json para versionarla junto al código.
// Uso: npm run openapi
import { writeFileSync, mkdirSync } from "node:fs";
import { especificacion } from "./swagger.js";

mkdirSync("docs", { recursive: true });
writeFileSync("docs/openapi.json", `${JSON.stringify(especificacion, null, 2)}\n`);
console.log(`docs/openapi.json generado (${Object.keys(especificacion.paths).length} rutas)`);
