import React, { useEffect, useState } from "react";
import {
  aplicarPreferenciaColor,
  guardarPreferenciaColor,
  leerPreferenciaColor,
} from "./vision";

const MODOS = [
  ["normal", "Paleta estándar"],
  ["protanopia", "Protanopia · azul y naranja"],
  ["deuteranopia", "Deuteranopia · violeta y ámbar"],
  ["tritanopia", "Tritanopia · carmín y verde azulado"],
];

const PARES = {
  normal: ["#236b55", "#8a3800"],
  protanopia: ["#004b87", "#8a3400"],
  deuteranopia: ["#4b1f73", "#684000"],
  tritanopia: ["#8a1024", "#005344"],
};

// Ofrece paletas con pares de alto contraste, no una simulación universal de daltonismo.
export default function BotonModoDaltonico() {
  const [modo, setModo] = useState(leerPreferenciaColor);

  useEffect(() => {
    aplicarPreferenciaColor(modo);
  }, [modo]);

  const cambiar = (event) => {
    const nuevoModo = event.target.value;
    setModo(nuevoModo);
    guardarPreferenciaColor(nuevoModo);
  };

  return (
    <div className="vision-controls">
      <label htmlFor="vision-mode">Paleta de color</label>
      <select id="vision-mode" value={modo} onChange={cambiar}>
        {MODOS.map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>
      <div className="vision-pair" aria-hidden="true">
        {PARES[modo].map((color) => (
          <span key={color} style={{ backgroundColor: color }} />
        ))}
        <b>Par de alto contraste</b>
      </div>
      <small>
        Es una ayuda visual. Elegí la combinación que te resulte más clara; los estados también usan texto, símbolos y patrones.
      </small>
    </div>
  );
}
