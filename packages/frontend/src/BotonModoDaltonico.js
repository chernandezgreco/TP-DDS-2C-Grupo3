import React, { useEffect, useState } from "react";
import {
  aplicarModoDaltonico,
  guardarModoDaltonico,
  leerModoDaltonico,
} from "./vision";

// Interruptor del modo daltónico. El estado se anuncia con aria-pressed (lectores de pantalla)
// y se ve con la marca ✓ y el borde, no sólo con el color.
export default function BotonModoDaltonico() {
  const [activo, setActivo] = useState(leerModoDaltonico);

  // aplicar es idempotente; guardar sólo ocurre cuando la persona cambia el modo
  useEffect(() => {
    aplicarModoDaltonico(activo);
  }, [activo]);

  const alternar = () => {
    const nuevo = !activo;
    setActivo(nuevo);
    guardarModoDaltonico(nuevo);
  };

  return (
    <button
      type="button"
      className="secondary vision-toggle"
      aria-pressed={activo}
      title="Cambia a una paleta de colores distinguible con daltonismo"
      onClick={alternar}
    >
      <span className="vision-toggle-marca" aria-hidden="true">
        {activo ? "✓" : ""}
      </span>
      Modo daltónico
    </button>
  );
}
