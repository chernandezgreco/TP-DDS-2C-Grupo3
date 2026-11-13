import React from "react";
export default function HuellaIA({ values, onChange }) {
  const uses = values.usosIA || [];
  const update = (i, key, value) =>
    onChange({
      ...values,
      usosIA: uses.map((u, index) =>
        index === i ? { ...u, [key]: value } : u,
      ),
    });
  return (
    <fieldset className="ia-fields">
      <legend>Declaración de uso de IA</legend>
      <p>
        Declaración estimativa del colectivo. No representa una medición de agua
        o energía.
      </p>
      <label>
        ¿El proyecto requiere plataformas de IA generativa?
        <select
          required
          value={values.requiereIA == null ? "" : String(values.requiereIA)}
          onChange={(e) =>
            onChange({
              ...values,
              requiereIA: e.target.value === "true",
              usosIA: e.target.value === "false" ? [] : uses,
            })
          }
        >
          <option value="">Seleccionar…</option>
          <option value="false">No requiere IA generativa</option>
          <option value="true">Sí requiere IA generativa</option>
        </select>
      </label>
      {values.requiereIA === true && (
        <>
          {uses.map((u, i) => (
            <fieldset key={i}>
              <legend>Uso {i + 1}</legend>
              <label>
                Descripción del uso
                <input
                  required
                  maxLength={500}
                  value={u.descripcion}
                  onChange={(e) => update(i, "descripcion", e.target.value)}
                />
              </label>
              <label>
                Justificación
                <textarea
                  required
                  maxLength={2000}
                  value={u.justificacion}
                  onChange={(e) => update(i, "justificacion", e.target.value)}
                />
              </label>
              <label>
                Grado estimado
                <select
                  required
                  value={u.grado}
                  onChange={(e) => update(i, "grado", e.target.value)}
                >
                  {["BAJO", "MEDIO", "ALTO"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="danger"
                onClick={() =>
                  onChange({
                    ...values,
                    usosIA: uses.filter((_, index) => index !== i),
                  })
                }
              >
                Quitar uso {i + 1}
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="secondary"
            disabled={uses.length >= 50}
            onClick={() =>
              onChange({
                ...values,
                usosIA: [
                  ...uses,
                  { descripcion: "", justificacion: "", grado: "BAJO" },
                ],
              })
            }
          >
            + Agregar uso de IA
          </button>
        </>
      )}
    </fieldset>
  );
}
