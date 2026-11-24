import PropTypes from "prop-types";
import Markdown from "./Markdown";
import HuellaIA from "./HuellaIA";
import React, { useState } from "react";
import { estadosPermitidos } from "./tareas";
import EtiquetasInput from "./EtiquetasInput";
import Icono from "./Icono";
import { normalizarEtiqueta, problemaEtiqueta } from "./etiquetas";

export const fechaCierreParaFormulario = (valor) => {
  if (!valor) {
    return "";
  }

  const fecha = new Date(valor);

  if (!Number.isFinite(fecha.getTime())) {
    return "";
  }

  const fechaLocal = new Date(
    fecha.getTime() - fecha.getTimezoneOffset() * 60000,
  );

  return fechaLocal.toISOString().slice(0, 16);
};

const field = (name, label, type = "text", extra = {}) => ({
  name,
  label,
  type,
  ...extra,
});
export const projectFields = [
  field("titulo", "Título", "text", { required: true }),
  field("descripcion", "Descripción", "textarea", { required: true }),
  field("fechaCierre", "Cierre automático (hora local, opcional)", "datetime-local"),
  field("etiquetas", "Etiquetas (opcional)", "etiquetas"),
];
export const collectiveFields = [
  field("nombre", "Nombre", "text", { required: true }),
  field("descripcion", "Descripción", "textarea", { required: true }),
  field("tipo", "Tipo", "select", {
    options: ["FUNDACION", "ASOCIACION_BARRIAL", "ONG", "ASAMBLEA"],
    required: true,
  }),
  field("ubicacion", "Ubicación"),
  field("etiquetas", "Etiquetas (opcional)", "etiquetas"),
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
  field("cantidadLimite", "Cupo de colaboraciones (opcional)", "number", {
    min: 1,
    required: false,
  }),
  field("fechaLimite", "Fecha límite de búsqueda (opcional)", "date"),
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
const estadosTarea = [
  ["PENDIENTE", "Pendiente"],
  ["EN_CURSO", "En curso"],
  ["FINALIZADA", "Finalizada"],
];
// responsables: [[id, nombre]] de quienes ya colaboran en el proyecto.
// Al editar se puede cambiar el estado, pero sólo a los que permite pasar desde el actual.
export const taskFields = (
  responsables,
  { conEstado = false, estadoActual } = {},
) => [
  field("nombre", "Nombre de la tarea", "text", {
    required: true,
    maxLength: 100,
  }),
  field("descripcion", "Descripción (opcional)", "textarea"),
  field("fechaInicio", "Fecha de inicio", "date", {
    required: true,
    min: "2020-01-01",
    max: "2050-12-31",
  }),
  field("fechaFin", "Fecha de fin", "date", {
    required: true,
    min: "2020-01-01",
    max: "2050-12-31",
  }),
  field("responsableId", "Responsable (opcional)", "select", {
    options: responsables,
    emptyLabel: "Sin responsable",
  }),
  ...(conEstado
    ? [
        field("estado", "Estado", "select", {
          options: estadoActual
            ? estadosTarea.filter(([valor]) =>
                estadosPermitidos(estadoActual).includes(valor),
              )
            : estadosTarea,
          required: true,
        }),
      ]
    : []),
];
export function ResourceForm({
  fields,
  initial = {},
  busy,
  onSubmit,
  onCancel,
  terms,
  project = false,
  submitLabel = "Guardar",
  submitIcon = "guardar",
  sugerenciasEtiquetas = [],
}) {
  const [values, setValues] = useState(() => ({
    ...initial,
    ...initial.compromiso,
    ...initial.modalidad,
    fechaLimite: initial.fechaLimite?.slice(0, 10),
    ...(fields.some((f) => f.name === "fechaCierre")
      ? { fechaCierre: fechaCierreParaFormulario(initial.fechaCierre) }
      : {}),
  }));
  const [error, setError] = useState("");
  // texto escrito en un campo de etiquetas que todavía no se confirmó con Enter o coma
  const [pendientes, setPendientes] = useState({});
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
      if (typeof result[f.name] === "string" && f.type !== "password")
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
    for (const f of fields.filter((campo) => campo.type === "etiquetas")) {
      const texto = (pendientes[f.name] || "").trim();
      if (!texto) continue;
      const actuales = values[f.name] || [];
      const etiqueta = normalizarEtiqueta(texto);
      const motivo = problemaEtiqueta(etiqueta, actuales);
      if (motivo) {
        setError(motivo);
        return;
      }
      result[f.name] = actuales.includes(etiqueta)
        ? actuales
        : [...actuales, etiqueta];
    }
    if (fields.some((f) => f.name === "fechaCierre")) {
      const valor = result.fechaCierre ?? "";
      const original = fechaCierreParaFormulario(initial.fechaCierre);

      if (valor === original) {
        delete result.fechaCierre;
      } else if (valor === "") {
        result.fechaCierre = null;
      } else {
        const fecha = new Date(valor);

        if (
          !Number.isFinite(fecha.getTime()) ||
          fecha.getTime() <= Date.now()
        ) {
          setError("La fecha de cierre debe ser válida y futura.");
          return;
        }

        result.fechaCierre = fecha.toISOString();
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
      result.fechaLimite = values.fechaLimite || null;
      result.cantidadLimite =
        values.cantidadLimite === "" || values.cantidadLimite == null
          ? null
          : values.cantidadLimite;
      for (const key of [
        "cantidadHoras",
        "tipo",
        "gratuita",
        "incentivoEconomico",
        "contratacionEventual",
      ])
        delete result[key];
    }
    if (project) {
      if (!values.aceptaTerminos) {
        setError("Debés aceptar los términos vigentes.");
        return;
      }
      if (values.requiereIA == null) {
        setError("Indicá si el proyecto requiere IA generativa.");
        return;
      }
      if (values.requiereIA && !(values.usosIA || []).length) {
        setError("Agregá al menos un uso de IA con su justificación.");
        return;
      }
      result.versionTerminosAceptada = terms.version;
      result.requiereIA = values.requiereIA;
      result.usosIA = values.requiereIA ? values.usosIA || [] : [];
      delete result.aceptaTerminos;
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
      <fieldset disabled={busy} className="form-fields">
        {fields.filter((f) => f.type !== "etiquetas").map((f) => (
          <label className={f.type === "checkbox" ? "check" : ""} key={f.name}>
            {f.type !== "checkbox" && f.label}
            {["select", "multi"].includes(f.type) ? (
              <select
                aria-label={f.label}
                required={f.required}
                multiple={f.type === "multi"}
                value={values[f.name] || (f.type === "multi" ? [] : "")}
                onChange={(e) => update(f, e)}
              >
                {f.type === "select" && (
                  <option value="">{f.emptyLabel ?? "Seleccionar…"}</option>
                )}
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
              <>
                <textarea
                  aria-label={f.label}
                  required={f.required}
                  value={values[f.name] || ""}
                  onChange={(e) => update(f, e)}
                />
                <span className="markdown-help">
                  Admite Markdown: **negrita**, listas y enlaces.
                </span>
              </>
            ) : (
              <input
                aria-label={f.type === "checkbox" ? undefined : f.label}
                type={
                  f.name === "valor" && values.tipo === "EMAIL"
                    ? "email"
                    : f.type
                }
                required={f.required}
                min={f.min}
                max={f.max}
                minLength={f.minLength}
                maxLength={f.maxLength}
                autoComplete={
                  f.type === "password"
                    ? "off"
                    : f.type === "email"
                      ? "email"
                      : undefined
                }
                checked={f.type === "checkbox" ? !!values[f.name] : undefined}
                value={
                  f.type === "checkbox" ? undefined : (values[f.name] ?? "")
                }
                onChange={(e) => update(f, e)}
              />
            )}
            {f.type === "checkbox" && f.label}
            {f.type === "multi" && (
              <small>Podés seleccionar varias con Ctrl o Cmd.</small>
            )}
          </label>
        ))}
        {/* las etiquetas van al final y fuera de un <label>: tienen varios controles */}
        {fields
          .filter((f) => f.type === "etiquetas")
          .map((f) => (
            <EtiquetasInput
              key={f.name}
              label={f.label}
              value={values[f.name] || []}
              pendiente={pendientes[f.name] || ""}
              sugerencias={sugerenciasEtiquetas}
              onChange={(lista) =>
                setValues((v) => ({ ...v, [f.name]: lista }))
              }
              onPendienteChange={(texto) =>
                setPendientes((p) => ({ ...p, [f.name]: texto }))
              }
            />
          ))}
        {fields
          .filter((f) => f.type === "textarea" && values[f.name])
          .map((f) => (
            <details key={"preview-" + f.name}>
              <summary>Vista previa de {f.label.toLowerCase()}</summary>
              <Markdown>{values[f.name]}</Markdown>
            </details>
          ))}
        {project && (
          <>
            <HuellaIA values={values} onChange={setValues} />
            <details>
              <summary>Leer términos y condiciones vigentes</summary>
              <p>Versión: {terms.version}</p>
              <Markdown>{terms.contenido}</Markdown>
            </details>
            <label className="check">
              <input
                type="checkbox"
                required
                checked={!!values.aceptaTerminos}
                onChange={(e) =>
                  setValues((v) => ({ ...v, aceptaTerminos: e.target.checked }))
                }
              />
              Leí y acepto los términos y condiciones vigentes para este
              proyecto
            </label>
          </>
        )}
      </fieldset>
      <div className="toolbar">
        <button disabled={busy} type="submit">
          <Icono nombre={submitIcon} />
          {busy ? "Procesando…" : submitLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          className="secondary"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

ResourceForm.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
      required: PropTypes.bool,
      options: PropTypes.array,
      min: PropTypes.number,
      max: PropTypes.number,
      minLength: PropTypes.number,
    }),
  ).isRequired,
  initial: PropTypes.object,
  busy: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  terms: PropTypes.shape({
    version: PropTypes.string,
    contenido: PropTypes.string,
  }),
  project: PropTypes.bool,
  submitLabel: PropTypes.string,
  submitIcon: PropTypes.string,
  sugerenciasEtiquetas: PropTypes.arrayOf(PropTypes.string),
};
