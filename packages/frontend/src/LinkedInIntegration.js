import React, { useEffect, useState } from "react";
import { api } from "./api";

export default function LinkedInIntegration({ actorType, onImported }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function cargarEstado() {
    setBusy(true);
    setError("");
    try {
      setStatus(await api.get("/integraciones/linkedin"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("linkedin");
    if (result === "conectado") setNotice("LinkedIn quedó conectado.");
    if (result === "error") setError("No se pudo conectar LinkedIn. Revisá la configuración y volvé a intentar.");
    cargarEstado();
  }, []);

  async function importar() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post("/integraciones/linkedin/importar");
      await onImported();
      setNotice("Nombre y foto del perfil importados.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function desconectar() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.delete("/integraciones/linkedin");
      setStatus({ connected: false });
      setNotice("LinkedIn desconectado.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const conectar = () => {
    const base = (api.defaults.baseURL || "http://localhost:8000/api").replace(/\/$/, "");
    window.location.assign(`${base}/integraciones/linkedin/conectar`);
  };

  return (
    <section className="panel">
      <h3>Redes sociales · LinkedIn</h3>
      {status === null ? (
        <p role="status">Comprobando conexión…</p>
      ) : status.connected ? (
        <>
          <p>
            Cuenta conectada{status.nombre ? `: ${status.nombre}` : ""}.
            {status.expira && (
              <> Autorización vigente hasta {new Date(status.expira).toLocaleDateString("es-AR")}.</>
            )}
          </p>
          <p className="hint">
            Podés importar el nombre y la foto del perfil, y compartir logros de proyectos en LinkedIn.
          </p>
          <div className="toolbar">
            {actorType === "colaboradoras" && (
              <button disabled={busy} onClick={importar}>
                Importar perfil
              </button>
            )}
            <button className="secondary" disabled={busy} onClick={desconectar}>
              Desconectar LinkedIn
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Conectá tu cuenta para importar datos básicos del perfil o compartir logros.
          </p>
          <button disabled={busy} onClick={conectar}>
            Conectar LinkedIn
          </button>
        </>
      )}
      {error && <p role="alert" className="error">{error}</p>}
      {notice && <p role="status" className="success">{notice}</p>}
    </section>
  );
}
