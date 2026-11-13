import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { api } from "./api";
import Markdown from "./Markdown";
export default function Terminos() {
  const [terms, setTerms] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/terminos/actual")
      .then(setTerms)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="panel">
      <h1>Términos y condiciones</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {terms ? (
        <>
          <p>
            Versión vigente: <b>{terms.version}</b>
          </p>
          <h2>{terms.titulo}</h2>
          <Markdown>{terms.contenido}</Markdown>
        </>
      ) : (
        !error && <p role="status">Cargando condiciones…</p>
      )}
      <details>
        <summary>Administrar condiciones y cumplimiento</summary>
        <AdministracionTerminos onPublish={setTerms} />
      </details>
    </section>
  );
}
function AdministracionTerminos({ onPublish }) {
  const [key, setKey] = useState(""),
    [state, setState] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [titulo, setTitulo] = useState(""),
    [contenido, setContenido] = useState("");
  const [recurso, setRecurso] = useState("proyectos"),
    [resourceId, setResourceId] = useState(""),
    [motivo, setMotivo] = useState(""),
    [suspended, setSuspended] = useState(true);
  const config = { headers: { Authorization: "Bearer " + key } };
  async function execute(fn) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const read = async () =>
    setState(await api.get("/admin/terminos/estado", config));
  return (
    <div className="admin-terms">
      <p>
        Acceso exclusivo del equipo administrador. La credencial se mantiene
        únicamente mientras esta pantalla esté abierta.
      </p>
      <label>
        Credencial administrativa
        <input
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setState(null);
          }}
        />
      </label>
      <button disabled={busy || !key} onClick={() => execute(read)}>
        Consultar cumplimiento
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="success">
          {notice}
        </p>
      )}
      {state && (
        <>
          <h2>Evaluación de proyectos</h2>
          {state.proyectos.map((p) => (
            <div className="list-row" key={p._id}>
              <b>{p.titulo}</b>
              <p>
                {p.moderacionTerminos?.suspendido ? "Suspendido" : "Publicado"}{" "}
                ·{" "}
                {p.terminosVigentes
                  ? "Aceptó términos vigentes"
                  : "Requiere aceptar términos vigentes"}
              </p>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              execute(async () => {
                const result = await api.post(
                  "/admin/terminos",
                  { titulo, contenido },
                  config,
                );
                onPublish(result);
                setTitulo("");
                setContenido("");
                await read();
                setNotice(
                  "Nueva versión publicada. Los proyectos deben aceptarla en su próxima actualización.",
                );
              });
            }}
          >
            <h2>Publicar una nueva versión</h2>
            <label>
              Título
              <input
                required
                maxLength={200}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </label>
            <label>
              Contenido en Markdown
              <textarea
                required
                maxLength={50000}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
              />
            </label>
            {contenido && <Markdown>{contenido}</Markdown>}
            <button disabled={busy}>Publicar condiciones</button>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              execute(async () => {
                await api.post(
                  "/admin/terminos/revisiones",
                  {
                    recurso,
                    recursoId: resourceId,
                    suspendido: suspended,
                    motivo,
                  },
                  config,
                );
                await read();
                setMotivo("");
                setNotice(
                  "Revisión registrada. La suspensión conserva el historial y bloquea la publicación y nuevas postulaciones.",
                );
              });
            }}
          >
            <h2>Evaluar cumplimiento</h2>
            <label>
              Tipo de recurso
              <select
                value={recurso}
                onChange={(e) => {
                  setRecurso(e.target.value);
                  setResourceId("");
                }}
              >
                <option value="proyectos">Proyecto</option>
                <option value="colectivos">Colectivo</option>
              </select>
            </label>
            <label>
              Recurso
              <select
                required
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {state[recurso].map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.titulo || r.nombre}
                    {r.moderacionTerminos?.suspendido ? " (suspendido)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Decisión
              <select
                value={String(suspended)}
                onChange={(e) => setSuspended(e.target.value === "true")}
              >
                <option value="true">Suspender por incumplimiento</option>
                <option value="false">Rehabilitar recurso</option>
              </select>
            </label>
            <label>
              Motivo de la evaluación
              <textarea
                required
                maxLength={2000}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
            <button disabled={busy}>Registrar evaluación</button>
          </form>
          <h2>Historial de revisiones</h2>
          {state.revisiones.map((r) => (
            <div className="list-row" key={r._id}>
              <b>
                {r.suspendido ? "Suspensión" : "Rehabilitación"} · {r.recurso}
              </b>
              <p>{r.motivo}</p>
              <small>{new Date(r.createdAt).toLocaleString("es-AR")}</small>
            </div>
          ))}
          <button
            className="secondary"
            onClick={() => {
              setKey("");
              setState(null);
            }}
          >
            Cerrar acceso administrativo
          </button>
        </>
      )}
    </div>
  );
}

AdministracionTerminos.propTypes = { onPublish: PropTypes.func.isRequired };
