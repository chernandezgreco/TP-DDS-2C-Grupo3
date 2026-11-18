import { normalizarEtiquetas } from "../domain/etiquetas.js";

// El filtro de búsqueda llega por la URL: "?etiquetas=salud,educacion" o la clave repetida.
// Sin etiquetas devuelve [] (no se filtra). Las reglas de cada etiqueta son las del dominio.
export const etiquetasDeConsulta = (valor) => {
  if (valor === undefined || valor === null) return [];
  const partes = (Array.isArray(valor) ? valor : [valor])
    .flatMap((parte) => String(parte).split(","))
    .map((parte) => parte.trim())
    .filter(Boolean);
  return normalizarEtiquetas(partes);
};

// Cláusula de Mongo: el recurso tiene que tener todas las etiquetas pedidas.
// Con la lista vacía no se agrega nada ($all: [] no devolvería ningún documento).
export const filtroEtiquetas = (etiquetas) =>
  etiquetas.length ? { etiquetas: { $all: etiquetas } } : {};
