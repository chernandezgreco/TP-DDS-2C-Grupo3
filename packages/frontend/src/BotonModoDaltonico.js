import React, { useEffect, useId, useRef, useState } from "react";
import Icono from "./Icono";
import {
  aplicarPreferenciaColor,
  guardarPreferenciaColor,
  leerPreferenciaColor,
} from "./vision";

// Cada opción muestra su par (principal y acento) para comparar las cuatro sin aplicarlas.
// Son los mismos valores que --color-principal y --color-acento-fondo de cada modo en App.css;
// paleta.test.js controla que no se desincronicen.
export const MODOS = [
  { valor: "normal", nombre: "Colores originales", corto: null, muestras: ["#007a70", "#fab72a"] },
  {
    valor: "protanopia",
    nombre: "Azul y ámbar (protanopia)",
    corto: "azul y ámbar",
    muestras: ["#1e65aa", "#fab72a"],
  },
  {
    valor: "deuteranopia",
    nombre: "Violeta y ámbar (deuteranopia)",
    corto: "violeta y ámbar",
    muestras: ["#643b9a", "#fab72a"],
  },
  {
    valor: "tritanopia",
    nombre: "Carmín y verde azulado (tritanopia)",
    corto: "carmín y verde azulado",
    muestras: ["#a1243d", "#74dac6"],
  },
];

// Botón siempre visible en el encabezado: abre un panel con las paletas como opciones de radio.
// Elegir una la aplica en el momento y el panel queda abierto para comparar; se cierra con Escape,
// con el botón "Listo" o tocando afuera. Es una ayuda visual: los estados también usan texto,
// íconos y patrones.
export default function BotonModoDaltonico() {
  const [modo, setModo] = useState(leerPreferenciaColor);
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);
  const disparador = useRef(null);
  const idPanel = useId();

  useEffect(() => {
    aplicarPreferenciaColor(modo);
  }, [modo]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTocarAfuera = (event) => {
      if (!contenedor.current?.contains(event.target)) setAbierto(false);
    };
    const alApretarTecla = (event) => {
      if (event.key === "Escape") {
        setAbierto(false);
        disparador.current?.focus();
      }
    };
    document.addEventListener("mousedown", alTocarAfuera);
    document.addEventListener("keydown", alApretarTecla);
    return () => {
      document.removeEventListener("mousedown", alTocarAfuera);
      document.removeEventListener("keydown", alApretarTecla);
    };
  }, [abierto]);

  const elegir = (nuevoModo) => {
    setModo(nuevoModo);
    guardarPreferenciaColor(nuevoModo);
  };

  const activo = MODOS.find((m) => m.valor === modo) || MODOS[0];

  return (
    <div className="vision-menu" ref={contenedor}>
      <button
        type="button"
        ref={disparador}
        className={`secondary vision-trigger${activo.corto ? " vision-trigger-activo" : ""}`}
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((a) => !a)}
      >
        <Icono nombre="ver" />
        {/* un solo texto: un span interno hace que algunos lectores de pantalla lean "daltónico : azul" */}
        <span>{activo.corto ? `Modo daltónico: ${activo.corto}` : "Modo daltónico"}</span>
      </button>
      {abierto && (
        <div className="vision-panel" id={idPanel}>
          <fieldset className="vision-opciones">
            <legend>Elegí la combinación que veas mejor</legend>
            {MODOS.map((m) => (
              <label key={m.valor} className="vision-opcion">
                <input
                  type="radio"
                  name="modo-daltonico"
                  value={m.valor}
                  checked={modo === m.valor}
                  onChange={() => elegir(m.valor)}
                />
                <span className="vision-opcion-nombre">{m.nombre}</span>
                <span className="vision-muestras" aria-hidden="true">
                  {m.muestras.map((color) => (
                    <span key={color} style={{ backgroundColor: color }} />
                  ))}
                </span>
              </label>
            ))}
          </fieldset>
          <p className="vision-nota">
            Los estados también se distinguen por texto, íconos y patrones, no sólo por el color.
          </p>
          <button
            type="button"
            className="vision-listo"
            onClick={() => {
              setAbierto(false);
              disparador.current?.focus();
            }}
          >
            <Icono nombre="check" />
            Listo
          </button>
        </div>
      )}
    </div>
  );
}
