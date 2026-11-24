import React, { useState } from "react";
import { api } from "./api";
import EstadoBadge from "./EstadoBadge";
import AvisoFlotante from "./AvisoFlotante";

const estados = ["pendiente", "en_revision", "resuelta", "desestimada"];
const idOf = (denuncia) => denuncia?._id || denuncia?.id;

export default function DenunciasAdmin() {
  const [draftKey, setDraftKey] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [denuncias, setDenuncias] = useState([]);
  const [estadosEditados, setEstadosEditados] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function cargar(event) {
    event?.preventDefault();
    const key = draftKey.trim();
    if (!key) {
      setError("Ingresá la clave administrativa configurada en el backend.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const rows = await api.get("/admin/denuncias", {
        headers: { Authorization: `Bearer ${key}` },
      });
      setAdminKey(key);
      setDenuncias(rows);
      setEstadosEditados({});
      setNotice("Denuncias cargadas.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function cambiarEstado(denuncia) {
    const id = idOf(denuncia);
    const estado = estadosEditados[id] || denuncia.estado;
    if (!adminKey || estado === denuncia.estado) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const actualizada = await api.patch(
        `/admin/denuncias/${id}/estado`,
        { estado },
        { headers: { Authorization: `Bearer ${adminKey}` } },
      );
      setDenuncias((actuales) =>
        actuales.map((item) => (idOf(item) === id ? actualizada : item)),
      );
      setEstadosEditados((actuales) => {
        const copia = { ...actuales };
        delete copia[id];
        return copia;
      });
      setNotice("Estado de la denuncia actualizado.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function olvidarClave() {
    setAdminKey("");
    setDraftKey("");
    setDenuncias([]);
    setEstadosEditados({});
    setError("");
    setNotice("");
  }

  return (
    <section>
      <div className="title-row">
        <div>
          <p className="eyebrow">MODERACIÓN</p>
          <h1>Administrar denuncias</h1>
          <p className="subtitle">
            Revisá los reportes de la comunidad y registrá su resolución.
          </p>
        </div>
        {adminKey && (
          <button className="secondary" onClick={olvidarClave}>
            Cerrar administración
          </button>
        )}
      </div>

      {!adminKey && (
        <form className="panel" onSubmit={cargar}>
          <label>
            Clave administrativa
            <input
              type="password"
              autoComplete="off"
              value={draftKey}
              onChange={(event) => setDraftKey(event.target.value)}
              required
              disabled={busy}
            />
            <small>
              Es la ADMIN_API_KEY configurada en el backend. Se mantiene en
              memoria mientras esta pantalla está abierta.
            </small>
          </label>
          <button type="submit" disabled={busy}>
            Cargar denuncias
          </button>
        </form>
      )}

      {error && <p role="alert" className="error">{error}</p>}
      <AvisoFlotante mensaje={notice} onCerrar={() => setNotice("")} />

      {adminKey && !denuncias.length && !busy && !error && (
        <div className="empty">
          <h2>No hay denuncias pendientes de revisión</h2>
          <p>Cuando alguien envíe una denuncia, aparecerá en esta sección.</p>
        </div>
      )}

      {denuncias.map((denuncia) => {
        const id = idOf(denuncia);
        const denunciante = denuncia.cuentaDenuncianteId;
        const estado = estadosEditados[id] || denuncia.estado;
        return (
          <article className="panel" key={id}>
            <div className="title-row">
              <div>
                <EstadoBadge estado={denuncia.estado} />
                <h2>{denuncia.motivo}</h2>
              </div>
              <small>
                {denuncia.fechaCreacion
                  ? new Date(denuncia.fechaCreacion).toLocaleString("es-AR")
                  : "Fecha no disponible"}
              </small>
            </div>
            <p>{denuncia.descripcion}</p>
            <p>
              <b>Entidad:</b> {denuncia.tipoEntidadDenunciada} · ID {denuncia.entidadDenunciadaId}
            </p>
            <p>
              <b>Denunciante:</b> {denunciante?.email || "Cuenta no disponible"}
            </p>
            <div className="toolbar">
              <label>
                Estado
                <select
                  value={estado}
                  onChange={(event) =>
                    setEstadosEditados((actuales) => ({
                      ...actuales,
                      [id]: event.target.value,
                    }))
                  }
                  disabled={busy}
                >
                  {estados.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={busy || estado === denuncia.estado}
                onClick={() => cambiarEstado(denuncia)}
              >
                Guardar estado
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
