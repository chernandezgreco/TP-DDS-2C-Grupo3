import React from "react";

const ESTADOS = {
  ACTIVO: ["Activo", "✓"],
  ACTIVA: ["Activa", "✓"],
  FINALIZADO: ["Finalizado", "■"],
  FINALIZADA: ["Finalizada", "■"],
  CERRADO: ["Cerrado", "×"],
  CERRADA: ["Cerrada", "×"],
  BUSCANDO: ["Buscando colaboraciones", "＋"],
  BUSQUEDA_CERRADA: ["Búsqueda cerrada", "—"],
  PENDIENTE: ["Pendiente", "○"],
  ACEPTADA: ["Aceptada", "✓"],
  RECHAZADA: ["Rechazada", "×"],
  EN_REVISION: ["En revisión", "◷"],
  RESUELTA: ["Resuelta", "✓"],
  DESESTIMADA: ["Desestimada", "×"],
};

export default function EstadoBadge({ estado }) {
  const clave = String(estado || "DESCONOCIDO").toUpperCase();
  const [texto, simbolo] = ESTADOS[clave] || [clave.replaceAll("_", " "), "•"];
  return (
    <span className={`badge status-badge status-${clave.toLowerCase()}`}>
      <span className="status-symbol" aria-hidden="true">
        {simbolo}
      </span>
      {texto}
    </span>
  );
}
