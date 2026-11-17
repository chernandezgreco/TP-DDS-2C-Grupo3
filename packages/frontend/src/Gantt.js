import React from "react";
import PropTypes from "prop-types";
import {
  ESTADOS_TAREA,
  diaComoNumero,
  etiquetaDia,
  hoyComoNumero,
  textoDuracion,
} from "./tareas";

// Ancho mínimo de un día en la escala: con 12 px un plan de unos dos meses entra en una pantalla de escritorio sin scroll.
const PX_POR_DIA = 12;
// Cada cuántos días se marca la escala para que las etiquetas dd/mm no se pisen.
const pasoDeEscala = (dias) => (dias <= 14 ? 1 : dias <= 28 ? 2 : dias <= 120 ? 7 : 30);

// Diagrama de tiempo de las tareas. Es sólo visual (aria-hidden): la tabla de TareasProyecto es su versión accesible.
// El estado no depende del color: cada uno tiene su patrón y su texto.
export default function Gantt({
  tareas,
  nombreResponsable,
  hoy = hoyComoNumero(),
}) {
  if (!tareas.length) return null;

  const inicios = tareas.map((t) => diaComoNumero(t.fechaInicio));
  const fines = tareas.map((t) => diaComoNumero(t.fechaFin));
  const desde = Math.min(...inicios);
  const hasta = Math.max(...fines);
  const total = hasta - desde + 1;
  const paso = pasoDeEscala(total);
  const porcentaje = (dias) => (dias / total) * 100;
  const hoyEnRango = hoy >= desde && hoy <= hasta;

  const marcas = [];
  for (let i = 0; i < total; i += paso) marcas.push(desde + i);

  return (
    <div className="gantt" aria-hidden="true" data-testid="gantt">
      <div className="gantt-scroll">
        <div
          className="gantt-grid"
          style={{
            "--gantt-ancho": `${Math.min(Math.max(total * PX_POR_DIA, 480), 4000)}px`,
          }}
        >
          <div className="gantt-label gantt-head">Tarea</div>
          <div className="gantt-track gantt-head">
            {marcas.map((marca) => (
              <span
                key={marca}
                className="gantt-tick"
                style={{ left: `${porcentaje(marca - desde)}%` }}
              >
                {etiquetaDia(marca)}
              </span>
            ))}
          </div>
          {tareas.map((t, i) => {
            const estado = ESTADOS_TAREA[t.estado] || ESTADOS_TAREA.PENDIENTE;
            const clase = `estado-${t.estado.toLowerCase().replace("_", "-")}`;
            return (
              <React.Fragment key={t.id}>
                <div className="gantt-label">
                  <span className="gantt-nombre" title={t.nombre}>
                    {t.nombre}
                  </span>
                  <span className={`estado-chip ${clase}`}>
                    <span aria-hidden="true">{estado.icono}</span> {estado.texto}
                  </span>
                </div>
                <div className="gantt-track">
                  {hoyEnRango && (
                    <span
                      className="gantt-hoy"
                      style={{ left: `${porcentaje(hoy - desde + 0.5)}%` }}
                    />
                  )}
                  <span
                    className={`gantt-bar ${clase}`}
                    data-testid={`barra-${i}`}
                    style={{
                      left: `${porcentaje(inicios[i] - desde)}%`,
                      width: `${porcentaje(t.duracion)}%`,
                    }}
                    title={`${t.nombre}: ${etiquetaDia(inicios[i])} al ${etiquetaDia(fines[i])} (${textoDuracion(t.duracion)}) · ${estado.texto}${
                      nombreResponsable ? " · " + nombreResponsable(t.responsableId) : ""
                    }`}
                  />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Gantt.propTypes = {
  tareas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
      fechaInicio: PropTypes.string.isRequired,
      fechaFin: PropTypes.string.isRequired,
      duracion: PropTypes.number.isRequired,
      estado: PropTypes.string.isRequired,
      responsableId: PropTypes.string,
    }),
  ).isRequired,
  nombreResponsable: PropTypes.func,
  hoy: PropTypes.number,
};
