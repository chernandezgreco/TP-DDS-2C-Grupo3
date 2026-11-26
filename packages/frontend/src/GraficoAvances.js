import React, { useId, useState } from "react";
import PropTypes from "prop-types";
import Markdown from "./Markdown";

const fechaCorta = (fecha) => new Date(fecha).toLocaleDateString("es-AR");
const fechaCompleta = (fecha) => new Date(fecha).toLocaleString("es-AR");

export function prepararAvances(logros) {
  return logros
    .filter((logro) => logro.fechaCreacion &&
      Number.isFinite(new Date(logro.fechaCreacion).getTime()) &&
      Number.isFinite(logro.porcentajeCompletitud) &&
      logro.porcentajeCompletitud >= 0 && logro.porcentajeCompletitud <= 100)
    .slice()
    .sort((a, b) => new Date(a.fechaCreacion) - new Date(b.fechaCreacion));
}

export default function GraficoAvances({ logros }) {
  const selectorId = useId();
  const [seleccion, setSeleccion] = useState(null);
  const avances = prepararAvances(logros);
  const clave = (logro) => logro.id || logro._id;
  const actual = avances.find((logro) => clave(logro) === seleccion) || avances[avances.length - 1];
  const desde = avances.length ? new Date(avances[0].fechaCreacion).getTime() : 0;
  const hasta = avances.length ? new Date(avances[avances.length - 1].fechaCreacion).getTime() : 0;
  const x = (logro, indice) => hasta === desde
    ? (avances.length === 1 ? 390 : 70 + indice * 640 / (avances.length - 1))
    : 70 + (new Date(logro.fechaCreacion).getTime() - desde) * 640 / (hasta - desde);
  const y = (logro) => 240 - logro.porcentajeCompletitud * 2;

  return (
    <section className="grafico-avances" aria-label="Gráfico de avances del proyecto">
      <h3>Avance total acumulado</h3>
      <p>Cada punto muestra el porcentaje total registrado en un logro; los porcentajes no se suman.</p>
      {avances.length < logros.length && <p role="status">Hay logros sin fecha o porcentaje válido que no se pueden representar.</p>}
      {!avances.length ? <p>Todavía no hay logros con fecha para mostrar en el gráfico.</p> : (
        <>
          <div className="grafico-avances-scroll">
            {/* El selector y el detalle son la alternativa accesible al dibujo. */}
            <svg viewBox="0 0 750 300" aria-hidden="true" focusable="false">
              {[0, 25, 50, 75, 100].map((porcentaje) => (
                <g key={porcentaje}>
                  <line className="avance-guia" x1="70" x2="710" y1={240 - porcentaje * 2} y2={240 - porcentaje * 2} />
                  <text x="58" y={246 - porcentaje * 2} textAnchor="end">{porcentaje}%</text>
                </g>
              ))}
              {avances.length > 1 && <polyline className="avance-linea" points={avances.map((logro, indice) => `${x(logro, indice)},${y(logro)}`).join(" ")} />}
              {avances.map((logro, indice) => (
                <g key={clave(logro)} onClick={() => setSeleccion(clave(logro))} className="avance-punto">
                  <title>{fechaCompleta(logro.fechaCreacion)}: {logro.porcentajeCompletitud}%</title>
                  <circle className="avance-area" cx={x(logro, indice)} cy={y(logro)} r="24" />
                  <circle className={logro === actual ? "avance-marca seleccionada" : "avance-marca"} cx={x(logro, indice)} cy={y(logro)} r={logro === actual ? 8 : 6} />
                </g>
              ))}
              <text x={avances.length === 1 ? 390 : 70} y="273" textAnchor={avances.length === 1 ? "middle" : "start"}>{fechaCorta(avances[0].fechaCreacion)}</text>
              {avances.length > 1 && <text x="710" y="273" textAnchor="end">{fechaCorta(avances[avances.length - 1].fechaCreacion)}</text>}
              <text x="390" y="296" textAnchor="middle">Fecha del logro</text>
            </svg>
          </div>
          {avances.length === 1 && <p>Hay un solo logro: se muestra su porcentaje, sin una línea de evolución.</p>}
          <label htmlFor={selectorId}>Logro a consultar</label>
          <select id={selectorId} value={clave(actual)} onChange={(event) => setSeleccion(event.target.value)}>
            {avances.map((logro, indice) => <option key={clave(logro)} value={clave(logro)}>{indice + 1}. {fechaCompleta(logro.fechaCreacion)} — {logro.porcentajeCompletitud}%</option>)}
          </select>
          <div className="avance-detalle" aria-live="polite">
            <p><time dateTime={new Date(actual.fechaCreacion).toISOString()}>{fechaCompleta(actual.fechaCreacion)}</time> · <strong>{actual.porcentajeCompletitud}% del proyecto</strong></p>
            <Markdown>{actual.descripcion}</Markdown>
          </div>
        </>
      )}
    </section>
  );
}

GraficoAvances.propTypes = {
  logros: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    descripcion: PropTypes.string,
    fechaCreacion: PropTypes.string,
    porcentajeCompletitud: PropTypes.number,
  })).isRequired,
};
