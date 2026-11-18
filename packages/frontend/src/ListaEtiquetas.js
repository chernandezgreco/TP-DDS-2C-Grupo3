import React from "react";
import PropTypes from "prop-types";

// Etiquetas de un proyecto o colectivo. Con alElegir cada una es un botón que filtra por ella;
// sin alElegir se muestran como texto (por ejemplo, en "Mi espacio", donde no hay filtro).
export default function ListaEtiquetas({ etiquetas = [], alElegir }) {
  if (!etiquetas.length) return null;
  return (
    <ul className="etiquetas" aria-label="Etiquetas">
      {etiquetas.map((e) => (
        <li key={e}>
          {alElegir ? (
            <button
              type="button"
              aria-label={`Filtrar por etiqueta ${e}`}
              onClick={() => alElegir(e)}
            >
              #{e}
            </button>
          ) : (
            <span>#{e}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

ListaEtiquetas.propTypes = {
  etiquetas: PropTypes.arrayOf(PropTypes.string),
  alElegir: PropTypes.func,
};
