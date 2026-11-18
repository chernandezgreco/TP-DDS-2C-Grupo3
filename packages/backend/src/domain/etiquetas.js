import { DomainError } from "./errores.js";

// Etiquetas libres de proyectos y colectivos. Se guardan normalizadas para que
// "Educación Popular", "educacion popular" y "educación-popular" sean la misma
// etiqueta y la búsqueda sea por coincidencia exacta.
// A diferencia de Habilidad.codigoPara, acá se quitan los acentos (y la ñ pasa a n):
// las etiquetas se escriben a mano y se busca que dos formas de tipearlas coincidan.

export const MIN_LARGO_ETIQUETA = 2;
export const MAX_LARGO_ETIQUETA = 30;
export const MAX_ETIQUETAS = 10;

// "Educación Popular" -> "educacion-popular", "node.js" -> "node-js".
// Aplicarla dos veces da lo mismo que aplicarla una.
export const normalizarEtiqueta = (texto) =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizarEtiquetas = (lista = []) => {
  if (!Array.isArray(lista)) {
    throw new DomainError("Las etiquetas deben ser una lista", {
      campo: "etiquetas",
    });
  }

  const etiquetas = [];
  for (const valor of lista) {
    if (typeof valor !== "string") {
      throw new DomainError("Cada etiqueta debe ser un texto", {
        campo: "etiquetas",
        valor,
      });
    }
    const etiqueta = normalizarEtiqueta(valor);
    if (
      etiqueta.length < MIN_LARGO_ETIQUETA ||
      etiqueta.length > MAX_LARGO_ETIQUETA
    ) {
      throw new DomainError(
        `Cada etiqueta debe tener entre ${MIN_LARGO_ETIQUETA} y ${MAX_LARGO_ETIQUETA} letras o números`,
        { campo: "etiquetas", valor },
      );
    }
    if (!etiquetas.includes(etiqueta)) etiquetas.push(etiqueta);
  }

  if (etiquetas.length > MAX_ETIQUETAS) {
    throw new DomainError(
      `No se pueden cargar más de ${MAX_ETIQUETAS} etiquetas`,
      { campo: "etiquetas", cantidad: etiquetas.length },
    );
  }

  return etiquetas;
};
