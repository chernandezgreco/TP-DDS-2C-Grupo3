import React, { useState } from "react";
const field = (name, label, type = "text", extra = {}) => ({
  name,
  label,
  type,
  ...extra,
});
export const projectFields = [
  field("titulo", "Título", "text", { required: true }),
  field("descripcion", "Descripción", "textarea", { required: true }),
];
export const collectiveFields = [
  field("nombre", "Nombre", "text", { required: true }),
  field("descripcion", "Descripción", "textarea", { required: true }),
  field("tipo", "Tipo", "select", {
    options: ["FUNDACION", "ASOCIACION_BARRIAL", "ONG", "ASAMBLEA"],
    required: true,
  }),
  field("ubicacion", "Ubicación"),
];
export const personFields = (skills) => [
  field("nombreFantasia", "Nombre público", "text", { required: true }),
  field("github", "Cuenta de GitHub o GitLab", "text", { required: true }),
  field("nombreApellido", "Nombre y apellido"),
  field("pronombres", "Pronombres"),
  field("presentacion", "Presentación", "textarea"),
  field("habilidades", "Habilidades", "multi", {
    options: skills.map((h) => [h.codigo, h.titulo]),
    required: true,
  }),
];
export const profileFields = (skills) => [
  field("descripcionPerfil", "Descripción del perfil", "text", {
    required: true,
  }),
  field("habilidadesRequeridas", "Habilidades requeridas", "multi", {
    options: skills.map((h) => [h.codigo, h.titulo]),
    required: true,
  }),
  field("habilidadesOpcionales", "Habilidades opcionales", "multi", {
    options: skills.map((h) => [h.codigo, h.titulo]),
  }),
  field("cantidadHoras", "Horas de compromiso", "number", {
    min: 1,
    required: true,
  }),
  field("tipo", "Frecuencia", "select", {
    options: ["TOTALES", "SEMANALES", "MENSUALES"],
    required: true,
  }),
  field("cantidadLimite", "Cupo de colaboraciones", "number", {
    min: 1,
    required: true,
  }),
  field("fechaLimite", "Fecha límite de búsqueda", "date", { required: true }),
  field("gratuita", "Colaboración gratuita", "checkbox"),
  field("incentivoEconomico", "Ofrece incentivo económico", "checkbox"),
  field("contratacionEventual", "Posibilidad de contratación", "checkbox"),
];
export const achievementFields = [
  field("descripcion", "Descripción del logro", "textarea", { required: true }),
  field("porcentajeCompletitud", "Avance (%)", "number", {
    min: 0,
    max: 100,
    required: true,
  }),
  field("enlaceSistema", "Enlace al sistema", "url"),
  field("enlaceFuentePublica", "Repositorio público", "url"),
];
export function ResourceForm({
  fields,
  initial = {},
  busy,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => ({
    ...initial,
    ...initial.compromiso,
    ...initial.modalidad,
    fechaLimite: initial.fechaLimite?.slice(0, 10),
  }));
  const [error, setError] = useState("");
  const update = (f, e) =>
    setValues((v) => ({
      ...v,
      [f.name]:
        f.type === "checkbox"
          ? e.target.checked
          : f.type === "multi"
            ? Array.from(e.target.selectedOptions, (o) => o.value)
            : f.type === "number"
              ? e.target.value === ""
                ? ""
                : Number(e.target.value)
              : e.target.value,
    }));
  async function submit(e) {
    e.preventDefault();
    setError("");
    let result = { ...values };
    for (const f of fields) {
      if (typeof result[f.name] === "string")
        result[f.name] = result[f.name].trim();
      if (
        f.required &&
        (result[f.name] === undefined ||
          result[f.name] === "" ||
          (Array.isArray(result[f.name]) && !result[f.name].length))
      ) {
        setError("Completá " + f.label.toLowerCase());
        return;
      }
    }
    if (fields.some((f) => f.name === "cantidadHoras")) {
      result = {
        ...result,
        compromiso: { cantidadHoras: values.cantidadHoras, tipo: values.tipo },
        modalidad: {
          gratuita: !!values.gratuita,
          incentivoEconomico: !!values.incentivoEconomico,
          contratacionEventual: !!values.contratacionEventual,
        },
        habilidadesOpcionales: values.habilidadesOpcionales || [],
      };
      if (values.fechaLimite)
        result.fechaLimite = values.fechaLimite.split("-").reverse().join("");
      for (const key of [
        "cantidadHoras",
        "tipo",
        "gratuita",
        "incentivoEconomico",
        "contratacionEventual",
      ])
        delete result[key];
    }
    await onSubmit(result);
  }
  return (
    <form onSubmit={submit}>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {fields.map((f) => (
        <label className={f.type === "checkbox" ? "check" : ""} key={f.name}>
          {f.type !== "checkbox" && f.label}
          {["select", "multi"].includes(f.type) ? (
            <select
              required={f.required}
              multiple={f.type === "multi"}
              value={values[f.name] || (f.type === "multi" ? [] : "")}
              onChange={(e) => update(f, e)}
            >
              {f.type === "select" && <option value="">Seleccionar…</option>}
              {f.options.map((o) => (
                <option
                  key={Array.isArray(o) ? o[0] : o}
                  value={Array.isArray(o) ? o[0] : o}
                >
                  {Array.isArray(o) ? o[1] : o.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              required={f.required}
              value={values[f.name] || ""}
              onChange={(e) => update(f, e)}
            />
          ) : (
            <input
              type={f.type}
              required={f.required}
              min={f.min}
              max={f.max}
              checked={f.type === "checkbox" ? !!values[f.name] : undefined}
              value={f.type === "checkbox" ? undefined : (values[f.name] ?? "")}
              onChange={(e) => update(f, e)}
            />
          )}
          {f.type === "checkbox" && f.label}
          {f.type === "multi" && (
            <small>Podés seleccionar varias con Ctrl o Cmd.</small>
          )}
        </label>
      ))}
      <div className="toolbar">
        <button disabled={busy} type="submit">
          {busy ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
