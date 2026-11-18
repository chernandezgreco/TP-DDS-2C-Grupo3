// Copia de las reglas de packages/backend/src/domain/etiquetas.js (CRA no permite importar
// fuera de src). El backend es la referencia: acá sólo se usa para mostrar cómo va a quedar
// cada etiqueta y avisar antes de enviar.

export const MIN_LARGO_ETIQUETA = 2;
export const MAX_LARGO_ETIQUETA = 30;
export const MAX_ETIQUETAS = 10;

// "Educación Popular" -> "educacion-popular"
export const normalizarEtiqueta = (texto) =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// devuelve el motivo por el que no se puede agregar, o null si se puede
export const problemaEtiqueta = (etiqueta, actuales = []) => {
  if (
    etiqueta.length < MIN_LARGO_ETIQUETA ||
    etiqueta.length > MAX_LARGO_ETIQUETA
  )
    return `Cada etiqueta debe tener entre ${MIN_LARGO_ETIQUETA} y ${MAX_LARGO_ETIQUETA} letras o números.`;
  if (!actuales.includes(etiqueta) && actuales.length >= MAX_ETIQUETAS)
    return `Se pueden cargar hasta ${MAX_ETIQUETAS} etiquetas.`;
  return null;
};

// para la búsqueda de texto: sin mayúsculas ni acentos, pero conservando los espacios
export const sinAcentos = (texto) =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// texto en el que busca el buscador: "educacion-popular" también se encuentra como "educacion popular"
export const textoDeEtiquetas = (etiquetas = []) =>
  etiquetas.map((e) => `${e} ${e.replaceAll("-", " ")}`).join(" ");

// etiquetas ya usadas en una lista de proyectos o colectivos, para sugerir al cargar
export const etiquetasEnUso = (items = []) =>
  [...new Set(items.flatMap((x) => x.etiquetas || []))].sort();
