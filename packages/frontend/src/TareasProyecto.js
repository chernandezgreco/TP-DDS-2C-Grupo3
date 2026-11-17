import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { api, idOf } from "./api";
import { taskFields } from "./forms";
import Gantt from "./Gantt";
import Markdown from "./Markdown";
import {
  ESTADOS_TAREA,
  MENSAJE_PROYECTO_FINALIZADO,
  RESPONSABLE_ANONIMO,
  formatearDia,
  tareaAPayload,
  textoDuracion,
} from "./tareas";

// Planificación del proyecto: Gantt y tabla de tareas. Maneja su propia carga para no depender del estado general de App.
export default function TareasProyecto({
  pid,
  proyecto,
  isOwner,
  colaboradoras,
  colaboraciones,
  edit,
  run,
  busy,
}) {
  const [tareas, setTareas] = useState(null);
  const [error, setError] = useState("");
  const bloqueado = proyecto?.estado !== "ACTIVO";
  const path = `/proyectos/${pid}/tareas`;

  async function recargar() {
    const resultado = await api.get(path);
    setTareas(Array.isArray(resultado) ? resultado : []);
    setError("");
  }

  // `proyecto` se vuelve a pedir después de cada alta, edición o cierre: ahí también se actualizan las tareas
  useEffect(() => {
    let activo = true;
    api
      .get(path)
      .then((resultado) => {
        if (!activo) return;
        setTareas(Array.isArray(resultado) ? resultado : []);
        setError("");
      })
      .catch((e) => {
        if (activo) setError(e.message);
      });
    return () => {
      activo = false;
    };
  }, [path, proyecto]);

  const nombreDe = (id) => {
    if (!id) return "Sin responsable";
    if (id === RESPONSABLE_ANONIMO) return "Contribución anónima";
    return (
      colaboradoras.find((c) => idOf(c) === id)?.nombreFantasia ||
      "Colaboradora que ya no participa"
    );
  };

  // sólo quienes ya figuran colaborando en el proyecto pueden ser responsables
  const opcionesResponsable = (tarea) => {
    const ids = [
      ...new Set(
        colaboraciones
          .map((c) => c.colaboradoraId)
          .filter((id) => id && id !== RESPONSABLE_ANONIMO),
      ),
    ];
    const opciones = ids
      .map((id) => [id, nombreDe(id)])
      .sort((a, b) => a[1].localeCompare(b[1]));
    const actual = tarea?.responsableId;
    if (actual && actual !== RESPONSABLE_ANONIMO && !ids.includes(actual))
      opciones.push([actual, `${nombreDe(actual)} (ya no participa)`]);
    return opciones;
  };

  const agregar = () => {
    if (bloqueado) return;
    edit("Agregar tarea", taskFields(opcionesResponsable()), path, "post", {}, {
      transform: tareaAPayload,
    });
  };
  const editar = (tarea) => {
    if (bloqueado) return;
    edit(
      "Editar tarea",
      taskFields(opcionesResponsable(tarea), {
        conEstado: true,
        estadoActual: tarea.estado,
      }),
      `${path}/${idOf(tarea)}`,
      "put",
      tarea,
      { transform: tareaAPayload },
    );
  };
  const eliminar = (tarea) => {
    if (bloqueado) return;
    if (window.confirm(`¿Eliminar la tarea "${tarea.nombre}"? No se puede deshacer.`))
      run(async () => {
        await api.delete(`${path}/${idOf(tarea)}`);
        await recargar();
      }, "Tarea eliminada.");
  };

  const controlBloqueado = (extra = {}) => ({
    "aria-disabled": bloqueado || undefined,
    "aria-describedby": bloqueado ? "tareas-bloqueadas" : undefined,
    title: bloqueado ? MENSAJE_PROYECTO_FINALIZADO : undefined,
    disabled: busy,
    ...extra,
  });

  return (
    <section className="panel" aria-labelledby="titulo-tareas">
      <div className="title-row">
        <h2 id="titulo-tareas">Planificación y tareas</h2>
        {isOwner && (
          <div className="toolbar">
            <button {...controlBloqueado()} onClick={agregar}>
              + Agregar tarea
            </button>
          </div>
        )}
      </div>
      {isOwner && bloqueado && (
        <p className="hint" role="note" id="tareas-bloqueadas">
          {MENSAJE_PROYECTO_FINALIZADO}. Las tareas que no se terminaron
          quedaron cerradas junto con el proyecto.
        </p>
      )}
      {error && (
        <div role="alert" className="error">
          <p>{error}</p>
          <button
            className="secondary"
            onClick={() => recargar().catch((e) => setError(e.message))}
          >
            Reintentar
          </button>
        </div>
      )}
      {!error && tareas === null && <p role="status">Cargando tareas…</p>}
      {tareas?.length === 0 && (
        <p>
          Todavía no hay tareas planificadas.
          {isOwner && !bloqueado && " Agregá la primera para armar el Gantt."}
        </p>
      )}
      {tareas?.length > 0 && (
        <>
          <Gantt tareas={tareas} nombreResponsable={nombreDe} />
          <div className="tabla-scroll">
            <table className="tareas-tabla" role="table">
              <caption>Detalle de las tareas del proyecto</caption>
              <thead>
                <tr role="row">
                  <th scope="col" role="columnheader">Tarea</th>
                  <th scope="col" role="columnheader">Responsable</th>
                  <th scope="col" role="columnheader">Inicio</th>
                  <th scope="col" role="columnheader">Fin</th>
                  <th scope="col" role="columnheader">Duración</th>
                  <th scope="col" role="columnheader">Estado</th>
                  {isOwner && <th scope="col" role="columnheader">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {tareas.map((t) => {
                  const estado = ESTADOS_TAREA[t.estado] || ESTADOS_TAREA.PENDIENTE;
                  return (
                    <tr key={idOf(t)} role="row">
                      <th scope="row" role="rowheader">
                        {t.nombre}
                        {t.descripcion && <Markdown>{t.descripcion}</Markdown>}
                      </th>
                      <td role="cell" data-label="Responsable">
                        {nombreDe(t.responsableId)}
                      </td>
                      <td role="cell" data-label="Inicio">
                        {formatearDia(t.fechaInicio)}
                      </td>
                      <td role="cell" data-label="Fin">
                        {formatearDia(t.fechaFin)}
                      </td>
                      <td role="cell" data-label="Duración">
                        {textoDuracion(t.duracion)}
                      </td>
                      <td role="cell" data-label="Estado">
                        <span
                          className={`estado-chip estado-${t.estado.toLowerCase().replace("_", "-")}`}
                        >
                          <span aria-hidden="true">{estado.icono}</span>{" "}
                          {estado.texto}
                        </span>
                      </td>
                      {isOwner && (
                        <td role="cell">
                          <div className="toolbar">
                            <button
                              className="secondary"
                              {...controlBloqueado()}
                              aria-label={`Editar la tarea ${t.nombre}`}
                              onClick={() => editar(t)}
                            >
                              Editar
                            </button>
                            <button
                              className="danger"
                              {...controlBloqueado()}
                              aria-label={`Eliminar la tarea ${t.nombre}`}
                              onClick={() => eliminar(t)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

TareasProyecto.propTypes = {
  pid: PropTypes.string.isRequired,
  proyecto: PropTypes.shape({ estado: PropTypes.string }),
  isOwner: PropTypes.bool,
  colaboradoras: PropTypes.array,
  colaboraciones: PropTypes.array,
  edit: PropTypes.func.isRequired,
  run: PropTypes.func.isRequired,
  busy: PropTypes.bool,
};
