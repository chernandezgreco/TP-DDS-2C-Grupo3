// Preferencia de visión (modo daltónico). Lógica sin React: leer, guardar y aplicar.
// La paleta vive en App.css: este módulo sólo pone o saca data-vision="daltonico" en <html>,
// y el CSS redefine las variables de color. Así ningún componente necesita conocer los colores.

export const CLAVE_MODO_DALTONICO = "cav-modo-daltonico";
const VALOR_DALTONICO = "daltonico";

// localStorage puede no existir o lanzar (modo privado, almacenamiento bloqueado):
// en ese caso la app sigue funcionando con la paleta normal.
export function leerModoDaltonico() {
  try {
    return window.localStorage.getItem(CLAVE_MODO_DALTONICO) === "1";
  } catch {
    return false;
  }
}

export function guardarModoDaltonico(activo) {
  try {
    if (activo) window.localStorage.setItem(CLAVE_MODO_DALTONICO, "1");
    else window.localStorage.removeItem(CLAVE_MODO_DALTONICO);
  } catch {
    // sin almacenamiento la preferencia dura sólo esta visita
  }
}

export function aplicarModoDaltonico(activo, raiz = document.documentElement) {
  if (activo) raiz.dataset.vision = VALOR_DALTONICO;
  else delete raiz.dataset.vision;
}

// Se llama antes del primer render para que no se vea la paleta normal por un instante.
export function iniciarModoDaltonico() {
  aplicarModoDaltonico(leerModoDaltonico());
}
