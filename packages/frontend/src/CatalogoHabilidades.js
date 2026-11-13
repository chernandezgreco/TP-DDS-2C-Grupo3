import React, { useState } from "react";
import PropTypes from "prop-types";
import Markdown from "./Markdown";
import { ResourceForm } from "./forms";
import { api } from "./api";
export default function CatalogoHabilidades({ skills, onSaved }) {
  const [key, setKey] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  return (
    <section>
      <h1>Habilidades de la comunidad</h1>
      {!skills.length && (
        <p className="empty">
          El equipo administrador todavía no cargó el catálogo de habilidades.
        </p>
      )}
      <div className="grid">
        {skills.map((h) => (
          <article className="card padded" key={h.codigo}>
            <h2>{h.titulo}</h2>
            <Markdown>{h.descripcion}</Markdown>
          </article>
        ))}
      </div>
      <details className="panel">
        <summary>Administrar catálogo de habilidades</summary>
        <p>La carga está reservada al equipo administrador.</p>
        <label>
          Credencial administrativa
          <input
            type="password"
            autoComplete="off"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="success">
            {notice}
          </p>
        )}
        <ResourceForm
          fields={[
            {
              name: "titulo",
              label: "Título de la habilidad",
              type: "text",
              required: true,
            },
            {
              name: "descripcion",
              label: "Descripción",
              type: "textarea",
              required: true,
            },
          ]}
          busy={busy}
          onCancel={() => {
            setKey("");
            setError("");
          }}
          onSubmit={async (values) => {
            setBusy(true);
            setError("");
            setNotice("");
            try {
              await api.post("/habilidades", values, {
                headers: { Authorization: "Bearer " + key },
              });
              await onSaved();
              setNotice(
                "Habilidad creada. Ya puede seleccionarse en registros y perfiles.",
              );
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </details>
    </section>
  );
}
CatalogoHabilidades.propTypes = {
  skills: PropTypes.array.isRequired,
  onSaved: PropTypes.func.isRequired,
};
