import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { api, idOf } from "./api";
import Icono from "./Icono";
import { tiempoRelativo } from "./tiempo";

const iniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toLocaleUpperCase("es-AR"))
    .join("") || "C";

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

// la fecha más nueva de la lista (las fechas ISO se comparan bien como texto)
const fechaMasNueva = (mensajes) =>
  mensajes.reduce((max, m) => (m.fecha > max ? m.fecha : max), mensajes[0].fecha);

// Bandeja de la colaboradora: los mensajes se agrupan por colectivo, así quien escribió varias
// veces aparece una sola vez. Los grupos y los mensajes van del más nuevo al más viejo.
// Al cargar marca como vistos los mensajes mostrados; los que eran nuevos quedan resaltados
// mientras dure la visita.
export default function BandejaMensajes({ actorId, cantidadNoLeidos, onLeidos, colectivos, proyectos }) {
  const [mensajes, setMensajes] = useState(null);
  const [nuevos, setNuevos] = useState(() => new Set());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const cargadaRef = useRef(false);
  const cargandoRef = useRef(false);

  const cargar = useCallback(async () => {
    // si ya hay una carga en curso, otro clic en "Actualizar" no dispara un segundo pedido
    if (cargandoRef.current) return;
    cargandoRef.current = true;
    setCargando(true);
    setError("");
    try {
      // el número se pide junto con la lista: los primeros N (los más nuevos) son los no leídos
      const [lista, { cantidad }] = await Promise.all([
        api.get(`/colaboradoras/${actorId}/notificaciones`),
        api.get("/mi/mensajes/no-leidos"),
      ]);
      setMensajes(lista);
      if (cantidad > 0 && lista.length > 0) {
        setNuevos((previos) => new Set([...previos, ...lista.slice(0, cantidad).map(idOf)]));
        // se marca hasta el mensaje más nuevo que se mostró, no hasta "ahora"
        await api.post("/mi/mensajes/vistos", { hasta: fechaMasNueva(lista) });
      }
      onLeidos();
    } catch (e) {
      setError(e.message);
    } finally {
      cargandoRef.current = false;
      setCargando(false);
    }
  }, [actorId, onLeidos]);

  // carga al entrar y otra vez si el polling detecta mensajes nuevos con la bandeja abierta
  useEffect(() => {
    if (cargadaRef.current && cantidadNoLeidos === 0) return;
    cargadaRef.current = true;
    cargar();
  }, [cantidadNoLeidos, cargar]);

  const grupos = useMemo(() => {
    const porColectivo = new Map();
    for (const mensaje of mensajes ?? []) {
      if (!porColectivo.has(mensaje.colectivoId)) porColectivo.set(mensaje.colectivoId, []);
      porColectivo.get(mensaje.colectivoId).push(mensaje);
    }
    return [...porColectivo.entries()].map(([colectivoId, items]) => ({
      colectivoId,
      nombre: colectivos.find((c) => idOf(c) === colectivoId)?.nombre || "Colectivo",
      items,
    }));
  }, [mensajes, colectivos]);

  const tituloProyecto = (proyectoId) => proyectos.find((p) => idOf(p) === proyectoId)?.titulo;

  return (
    <section className="panel bandeja" aria-busy={cargando}>
      <div className="bandeja-encabezado">
        <h2>Tu bandeja de entrada</h2>
        {/* mientras carga no se deshabilita: el ícono gira y aria-busy lo anuncia */}
        <button type="button" className="text-button" onClick={cargar} aria-busy={cargando}>
          <Icono nombre="recargar" className={cargando ? "girando" : ""} />
          Actualizar
        </button>
      </div>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {mensajes === null && cargando && <p className="loading">Cargando mensajes…</p>}
      {mensajes?.length === 0 && <p>No tenés mensajes.</p>}
      {grupos.length > 0 && (
        <ul className="bandeja-grupos">
          {grupos.map(({ colectivoId, nombre, items }) => {
            const cantidadNuevos = items.filter((m) => nuevos.has(idOf(m))).length;
            return (
              <li key={colectivoId} className="bandeja-grupo">
                <div className="bandeja-remitente">
                  <span className="bandeja-avatar" aria-hidden="true">
                    {iniciales(nombre)}
                  </span>
                  <div>
                    <h3>{nombre}</h3>
                    <small>
                      {plural(items.length, "mensaje", "mensajes")}
                      {cantidadNuevos > 0 && ` · ${plural(cantidadNuevos, "nuevo", "nuevos")}`}
                    </small>
                  </div>
                </div>
                <ol className="bandeja-mensajes">
                  {items.map((m) => {
                    const esNuevo = nuevos.has(idOf(m));
                    const proyecto = tituloProyecto(m.proyectoId);
                    return (
                      <li key={idOf(m)} className={esNuevo ? "bandeja-mensaje es-nuevo" : "bandeja-mensaje"}>
                        <p>{m.texto}</p>
                        <div className="bandeja-meta">
                          {esNuevo && <span className="badge badge-nuevo">Nuevo</span>}
                          {proyecto && <span className="bandeja-proyecto">Sobre {proyecto}</span>}
                          <time dateTime={m.fecha} title={new Date(m.fecha).toLocaleString("es-AR")}>
                            {tiempoRelativo(m.fecha)}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

BandejaMensajes.propTypes = {
  actorId: PropTypes.string.isRequired,
  cantidadNoLeidos: PropTypes.number.isRequired,
  onLeidos: PropTypes.func.isRequired,
  colectivos: PropTypes.array.isRequired,
  proyectos: PropTypes.array.isRequired,
};
