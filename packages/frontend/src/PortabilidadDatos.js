import React, { useState } from "react";
import PropTypes from "prop-types";
import { api } from "./api";
import Icono from "./Icono";

export const FORMATOS = {
  json: "JSON (para otros sistemas)",
  csv: "CSV (para planillas de cálculo)",
};

export const nombreArchivoExportacion = (actorType, formato, fecha = new Date()) =>
  `codigo-a-voluntad-datos-${actorType === "colectivos" ? "colectivo" : "colaboradora"}-${fecha
    .toISOString()
    .slice(0, 10)}.${formato}`;

// la respuesta es un Blob: el mensaje del backend no llega legible, se explica por status
export const mensajeDeError = (error) => {
  if (error.status === 429)
    return "Alcanzaste el límite de descargas. Esperá unos minutos y volvé a intentar.";
  if (error.status === 401) return "Tu sesión venció. Iniciá sesión nuevamente.";
  return "No se pudo generar el archivo. Intentá de nuevo en unos minutos.";
};

function guardarArchivo(blob, nombre) {
  const href = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = href;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // revocar en el mismo ciclo puede cancelar la descarga en Safari y algunos Firefox
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default function PortabilidadDatos({ actorType }) {
  const [formato, setFormato] = useState("json");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function descargar() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const archivo = await api.get("/mi/exportacion", {
        params: { formato },
        responseType: "blob",
      });
      guardarArchivo(archivo, nombreArchivoExportacion(actorType, formato));
      setNotice("Descarga lista. Guardá el archivo en un lugar seguro: contiene tus datos personales.");
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="portabilidad-titulo">
      <h3 id="portabilidad-titulo">Tus datos</h3>
      <p>
        Descargá una copia de toda la información personal que guardamos sobre tu cuenta.
      </p>
      <p className="hint">
        {actorType === "colectivos"
          ? "Incluye tu cuenta, tu perfil, tus proyectos con sus perfiles, logros y tareas, las postulaciones y colaboraciones recibidas, y los mensajes enviados. De las personas colaboradoras sólo figura su nombre de fantasía: sus contactos no se exportan."
          : "Incluye tu cuenta, tu perfil con tus contactos, tus habilidades, postulaciones, colaboraciones, mensajes recibidos y tareas asignadas."}{" "}
        Nunca se incluyen contraseñas ni los contactos de otras personas.
      </p>
      {formato === "csv" && (
        <p className="hint">
          En el CSV, los valores que empiezan con =, +, - o @ llevan un apóstrofo adelante
          para que la planilla no los ejecute como fórmula.
        </p>
      )}
      <label>
        Formato
        <select
          value={formato}
          onChange={(event) => setFormato(event.target.value)}
          disabled={busy}
        >
          {Object.entries(FORMATOS).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>
      <div className="toolbar">
        <button disabled={busy} onClick={descargar}>
          <Icono nombre="descargar" />
          {busy ? "Preparando archivo…" : "Descargar mis datos"}
        </button>
      </div>
      {/* status siempre presente: los lectores de pantalla anuncian el cambio de texto.
          role="alert" se anuncia al insertarse, por eso aparece sólo con un error */}
      <p role="status" aria-live="polite" className={notice ? "success" : undefined}>
        {busy ? "Generando tu archivo…" : notice}
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}

PortabilidadDatos.propTypes = {
  actorType: PropTypes.oneOf(["colectivos", "colaboradoras"]),
};
