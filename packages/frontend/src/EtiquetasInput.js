import React, { useId, useState } from "react";
import PropTypes from "prop-types";
import Icono from "./Icono";
import {
  MAX_ETIQUETAS,
  normalizarEtiqueta,
  problemaEtiqueta,
} from "./etiquetas";

// Carga de etiquetas libres. Es un componente controlado: la lista y el texto que se está
// escribiendo los guarda el formulario, así al enviar se suma lo que quedó sin confirmar.
// Las sugerencias llegan por prop; el componente no consulta la API.
export default function EtiquetasInput({
  label,
  value = [],
  pendiente = "",
  onChange,
  onPendienteChange,
  sugerencias = [],
}) {
  const id = useId();
  const [problema, setProblema] = useState("");
  const vistaPrevia = normalizarEtiqueta(pendiente);

  const agregar = (textos) => {
    let lista = value;
    for (const texto of textos) {
      if (!texto.trim()) continue;
      const etiqueta = normalizarEtiqueta(texto);
      const motivo = problemaEtiqueta(etiqueta, lista);
      if (motivo) {
        setProblema(motivo);
        return false;
      }
      if (!lista.includes(etiqueta)) lista = [...lista, etiqueta];
    }
    setProblema("");
    if (lista !== value) onChange(lista);
    return true;
  };

  const quitar = (etiqueta) => {
    setProblema("");
    onChange(value.filter((e) => e !== etiqueta));
  };

  const teclas = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      // Enter no tiene que enviar el formulario
      e.preventDefault();
      if (agregar([pendiente])) onPendienteChange("");
    } else if (e.key === "Backspace" && !pendiente && value.length) {
      quitar(value[value.length - 1]);
    }
  };

  // al pegar "salud, educación" se agregan las que quedaron antes de la última coma
  const escribir = (texto) => {
    if (!texto.includes(",")) {
      onPendienteChange(texto);
      return;
    }
    const partes = texto.split(",");
    const resto = partes.pop();
    onPendienteChange(agregar(partes) ? resto : texto);
  };

  return (
    <div
      className="etiquetas-input"
      role="group"
      aria-labelledby={`${id}-titulo`}
    >
      <span id={`${id}-titulo`}>{label}</span>
      {value.length > 0 && (
        <ul className="etiquetas" aria-label="Etiquetas cargadas">
          {value.map((etiqueta) => (
            <li key={etiqueta}>
              <span>#{etiqueta}</span>
              <button
                type="button"
                className="etiqueta-quitar"
                aria-label={`Quitar etiqueta ${etiqueta}`}
                onClick={() => quitar(etiqueta)}
              >
                <Icono nombre="cruz" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        aria-label="Nueva etiqueta"
        aria-describedby={`${id}-ayuda`}
        list={sugerencias.length ? `${id}-sugerencias` : undefined}
        value={pendiente}
        disabled={value.length >= MAX_ETIQUETAS && !pendiente}
        placeholder={
          value.length >= MAX_ETIQUETAS
            ? "Llegaste al máximo de etiquetas"
            : "Escribí una etiqueta y presioná Enter"
        }
        onKeyDown={teclas}
        onChange={(e) => escribir(e.target.value)}
      />
      {sugerencias.length > 0 && (
        <datalist id={`${id}-sugerencias`}>
          {sugerencias
            .filter((s) => !value.includes(s))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      )}
      <small id={`${id}-ayuda`}>
        Enter o coma para agregar. Hasta {MAX_ETIQUETAS}; sirven para encontrar
        el recurso en las búsquedas.
        {vistaPrevia && vistaPrevia !== pendiente.trim() && (
          <> Se guardará como #{vistaPrevia}.</>
        )}
      </small>
      {problema && (
        <p className="error" role="alert">
          {problema}
        </p>
      )}
    </div>
  );
}

EtiquetasInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.string),
  pendiente: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onPendienteChange: PropTypes.func.isRequired,
  sugerencias: PropTypes.arrayOf(PropTypes.string),
};
