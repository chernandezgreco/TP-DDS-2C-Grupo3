import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

export const DURACION_AVISO_MS = 15000;

// Todos los avisos se apilan en un mismo contenedor fijo, arriba a la derecha, fuera del
// árbol de la página: así no los recorta ni los desplaza ningún contenedor ni modal.
function contenedorAvisos() {
  let contenedor = document.getElementById("avisos-flotantes");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "avisos-flotantes";
    contenedor.className = "toast-stack";
    document.body.appendChild(contenedor);
  }
  return contenedor;
}

// Confirmación de una acción (guardar, editar, cerrar sesión...). Se cierra sola a los
// 15 segundos o con la cruz. Mientras el puntero o el foco están encima no se cierra,
// para que se pueda terminar de leer.
function Aviso({ mensaje, onCerrar }) {
  const cerrar = useRef(onCerrar);
  const [pausado, setPausado] = useState(false);

  // quien lo usa suele pasar una función nueva en cada render: no debe reiniciar la cuenta
  useEffect(() => {
    cerrar.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    if (pausado) return undefined;
    const temporizador = window.setTimeout(() => cerrar.current(), DURACION_AVISO_MS);
    return () => window.clearTimeout(temporizador);
  }, [pausado]);

  return (
    <div
      className="success notice-toast"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <span>✓ {mensaje}</span>
      <button
        type="button"
        className="notice-dismiss"
        aria-label="Cerrar mensaje"
        onClick={() => cerrar.current()}
      >
        ×
      </button>
    </div>
  );
}

Aviso.propTypes = {
  mensaje: PropTypes.string.isRequired,
  onCerrar: PropTypes.func.isRequired,
};

// La región con role="status" está siempre presente para que los lectores de pantalla
// anuncien el mensaje cuando aparece. La key reinicia el aviso si cambia el texto.
export default function AvisoFlotante({ mensaje, onCerrar }) {
  return createPortal(
    <div role="status" aria-live="polite">
      {mensaje && <Aviso key={mensaje} mensaje={mensaje} onCerrar={onCerrar} />}
    </div>,
    contenedorAvisos(),
  );
}

AvisoFlotante.propTypes = {
  mensaje: PropTypes.string,
  onCerrar: PropTypes.func.isRequired,
};
