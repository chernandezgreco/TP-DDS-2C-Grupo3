import React from "react";
import PropTypes from "prop-types";

// Íconos de trazo (24×24, trazo 2, extremos redondeados) dibujados a mano en el estilo de Lucide.
// Son decorativos: el nombre accesible del botón o enlace lo da su texto, por eso van con aria-hidden.
// Toman el color del texto (currentColor), así que respetan cada paleta y cada modo daltónico.

// un círculo escrito como trazo, para mantener todos los íconos como listas de `d`
const circulo = (cx, cy, r) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const ICONOS = {
  mas: ["M12 5v14", "M5 12h14"],
  editar: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"],
  eliminar: [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "M10 11v6",
    "M14 11v6",
  ],
  volver: ["M19 12H5", "M12 19l-7-7 7-7"],
  ir: ["M5 12h14", "M12 5l7 7-7 7"],
  externo: ["M7 17 17 7", "M7 7h10v10"],
  enviar: ["M22 2 11 13", "M22 2 15 22l-4-9-9-4Z"],
  buscar: [circulo(11, 11, 8), "m21 21-4.3-4.3"],
  personas: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    circulo(9, 7, 4),
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  "persona-mas": [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    circulo(9, 7, 4),
    "M19 8v6",
    "M22 11h-6",
  ],
  persona: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", circulo(12, 7, 4)],
  "persona-baja": [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    circulo(9, 7, 4),
    "M22 11h-6",
  ],
  bandera: ["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z", "M4 22v-7"],
  pausa: ["M7 4h3v16H7Z", "M14 4h3v16h-3Z"],
  reanudar: ["M7 4l13 8-13 8Z"],
  finalizar: [circulo(12, 12, 10), "m9 12 2 2 4-4"],
  check: ["M20 6 9 17l-5-5"],
  "check-doble": ["M18 6 7 17l-5-5", "m22 10-7.5 7.5L13 16"],
  cruz: ["M18 6 6 18", "M6 6l12 12"],
  ver: ["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", circulo(12, 12, 3)],
  logro: [
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z",
  ],
  compartir: [
    circulo(18, 5, 3),
    circulo(6, 12, 3),
    circulo(18, 19, 3),
    "m8.59 13.51 6.83 3.98",
    "m15.41 6.51-6.82 3.98",
  ],
  reloj: [circulo(12, 12, 10), "M12 6v6l4 2"],
  correo: [
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "m22 6-10 7L2 6",
  ],
  salir: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  entrar: ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "M10 17l5-5-5-5", "M15 12H3"],
  recargar: ["M21 12a9 9 0 1 1-3-6.7L21 8", "M21 3v5h-5"],
  descargar: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  subir: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  guardar: [
    "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z",
    "M17 21v-8H7v8",
    "M7 3v5h8",
  ],
  enlace: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
  abajo: ["m6 9 6 6 6-6"],
  documento: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z",
    "M14 2v6h6",
    "M8 13h8",
    "M8 17h5",
  ],
  chispa: ["M12 3l1.9 5.8L20 10.7l-6.1 1.9L12 18.5l-1.9-5.9L4 10.7l6.1-1.9Z", "M19 3v4", "M21 5h-4"],
  escudo: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"],
  tareas: ["M9 6h12", "M9 12h12", "M9 18h12", "m3 6 1 1 2-2", "m3 12 1 1 2-2", "m3 18 1 1 2-2"],
  calendario: [
    "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M16 2v4",
    "M8 2v4",
    "M3 10h18",
  ],
  proyectos: ["M3 3h7v7H3Z", "M14 3h7v7h-7Z", "M14 14h7v7h-7Z", "M3 14h7v7H3Z"],
  colectivos: [
    circulo(12, 8, 3),
    circulo(5, 10, 2),
    circulo(19, 10, 2),
    "M7 20v-1a5 5 0 0 1 10 0v1",
    "M2 20v-1a3 3 0 0 1 3-3",
    "M22 20v-1a3 3 0 0 0-3-3",
  ],
  corazon: [
    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  ],
  inicio: ["M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"],
  codigo: ["m16 18 6-6-6-6", "m8 6-6 6 6 6"],
  info: [circulo(12, 12, 10), "M12 16v-4", "M12 8h.01"],
  alerta: [
    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
    "M12 9v4",
    "M12 17h.01",
  ],
  paleta: [
    "M12 22a10 10 0 1 1 10-10c0 2.5-2 4-4.5 4H15a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 22Z",
    circulo(7.5, 10.5, 1),
    circulo(12, 7, 1),
    circulo(16.5, 10.5, 1),
  ],
};

export const NOMBRES_DE_ICONOS = Object.keys(ICONOS);

export default function Icono({ nombre, className = "" }) {
  const trazos = ICONOS[nombre];
  if (!trazos) return null;
  return (
    <svg
      className={`icono ${className}`.trim()}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {trazos.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

Icono.propTypes = {
  nombre: PropTypes.oneOf(NOMBRES_DE_ICONOS).isRequired,
  className: PropTypes.string,
};
