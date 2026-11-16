import React, { useState } from "react";
import PropTypes from "prop-types";

const motivos = [
  "Contenido inapropiado",
  "Acoso o discurso de odio",
  "Información engañosa",
  "Exposición de datos personales",
  "Otro",
];

export default function DenunciaForm({
  targetType,
  targetName,
  targetId,
  busy,
  onCancel,
  onSubmit,
}) {
  const [motivo, setMotivo] = useState(motivos[0]);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const detalle = descripcion.trim();
    if (detalle.length < 10) {
      setError("Contanos un poco más para que podamos revisar la denuncia.");
      return;
    }
    setError("");
    await onSubmit({
      tipoEntidadDenunciada: targetType,
      entidadDenunciadaId: targetId,
      motivo,
      descripcion: detalle,
    });
  }

  return (
    <form onSubmit={submit}>
      <p>
        Vas a denunciar {targetType === "proyecto" ? "el proyecto" : "el colectivo"}{" "}
        <b>{targetName}</b>. La denuncia será revisada por administración.
      </p>
      <label>
        Motivo
        <select
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          disabled={busy}
        >
          {motivos.map((opcion) => (
            <option key={opcion} value={opcion}>
              {opcion}
            </option>
          ))}
        </select>
      </label>
      <label>
        Descripción
        <textarea
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          minLength={10}
          maxLength={1000}
          required
          disabled={busy}
          placeholder="Explicá qué pasó y por qué lo reportás."
        />
        <small>{descripcion.trim().length}/1000 caracteres</small>
      </label>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="toolbar">
        <button type="submit" disabled={busy}>
          Enviar denuncia
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

DenunciaForm.propTypes = {
  targetType: PropTypes.oneOf(["colectivo", "proyecto"]).isRequired,
  targetName: PropTypes.string.isRequired,
  targetId: PropTypes.string.isRequired,
  busy: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
