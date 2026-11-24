// Preferencias de accesibilidad de color. Las paletas son ayudas visuales, no simulaciones
// clínicas ni una solución universal; las etiquetas, iconos y patrones siguen visibles.
export const CLAVE_MODO_DALTONICO = "cav-modo-daltonico";
const VALOR_DALTONICO_ANTERIOR = "daltonico";
export const MODOS_COLOR = ["normal", "protanopia", "deuteranopia", "tritanopia"];

export function leerPreferenciaColor() {
  try {
    const guardada = window.localStorage.getItem(CLAVE_MODO_DALTONICO);
    // Una preferencia booleana anterior se interpreta como la paleta rojo/verde.
    const modo =
      guardada === "1" || guardada === VALOR_DALTONICO_ANTERIOR
        ? "protanopia"
        : guardada;
    return MODOS_COLOR.includes(modo) ? modo : "normal";
  } catch {
    return "normal";
  }
}

export function guardarPreferenciaColor(modo) {
  try {
    if (!MODOS_COLOR.includes(modo) || modo === "normal") {
      window.localStorage.removeItem(CLAVE_MODO_DALTONICO);
    } else {
      window.localStorage.setItem(CLAVE_MODO_DALTONICO, modo);
    }
  } catch {
    // Sin almacenamiento, la preferencia dura sólo esta visita.
  }
}

export function aplicarPreferenciaColor(modo, raiz = document.documentElement) {
  if (MODOS_COLOR.includes(modo) && modo !== "normal") {
    raiz.dataset.vision = modo;
  } else {
    delete raiz.dataset.vision;
  }
}

// Compatibilidad con las funciones booleanas anteriores.
export function leerModoDaltonico() {
  return leerPreferenciaColor() !== "normal";
}

export function guardarModoDaltonico(activo) {
  guardarPreferenciaColor(activo ? "protanopia" : "normal");
}

export function aplicarModoDaltonico(activo, raiz = document.documentElement) {
  aplicarPreferenciaColor(activo ? "protanopia" : "normal", raiz);
}

// Se llama antes del primer render para restaurar la preferencia elegida.
export function iniciarModoDaltonico() {
  aplicarPreferenciaColor(leerPreferenciaColor());
}
