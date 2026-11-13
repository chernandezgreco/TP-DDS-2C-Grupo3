import React, { useState } from "react";
import PropTypes from "prop-types";
import { api } from "./api";
import { ResourceForm, collectiveFields, personFields } from "./forms";
export default function AuthPanel({
  skills,
  onSuccess,
  onCancel,
  initialMode = "login",
  initialType = "colaboradoras",
}) {
  const [mode, setMode] = useState(initialMode),
    [type, setType] = useState(initialType),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const credentials = [
    { name: "email", label: "Correo de acceso", type: "email", required: true },
    {
      name: "password",
      label: "Contraseña (mínimo 10 caracteres)",
      type: "password",
      minLength: 10,
      maxLength: 128,
      required: true,
    },
  ];
  const fields =
    mode === "login"
      ? credentials
      : [
          ...credentials,
          {
            name: "confirmarPassword",
            label: "Repetir contraseña",
            type: "password",
            required: true,
          },
          ...(type === "colectivos" ? collectiveFields : personFields(skills)),
        ];
  async function submit(values) {
    setError("");
    if (mode === "registro" && values.password !== values.confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const { email, password, ...rest } = values;
      const perfil = Object.fromEntries(
        Object.entries(rest).filter(
          ([key, value]) => key !== "confirmarPassword" && value !== undefined,
        ),
      );
      const result = await api.post(
        mode === "login" ? "/auth/login" : "/auth/registro",
        mode === "login"
          ? { email, password }
          : { email, password, tipo: type, perfil },
      );
      await onSuccess(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="toolbar" role="group" aria-label="Acceso">
        <button
          type="button"
          className={mode === "login" ? "" : "secondary"}
          disabled={busy}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={mode === "registro" ? "" : "secondary"}
          disabled={busy}
          onClick={() => {
            setMode("registro");
            setError("");
          }}
        >
          Crear cuenta
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {mode === "registro" && (
        <>
          <label>
            Tipo de cuenta
            <select
              disabled={busy}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="colaboradoras">Persona colaboradora</option>
              <option value="colectivos">Colectivo</option>
            </select>
          </label>
          <p>
            Tu nombre público puede ser de fantasía. El correo de acceso y los
            datos de contacto no se publican.
          </p>
          {type === "colaboradoras" && !skills.length && (
            <p className="error">
              Todavía no hay habilidades cargadas. El equipo administrador debe
              cargar el catálogo antes del registro de colaboradoras.
            </p>
          )}
        </>
      )}
      <ResourceForm
        key={mode + type}
        fields={fields}
        submitLabel={mode === "login" ? "Ingresar" : "Crear mi cuenta"}
        busy={busy}
        onSubmit={submit}
        onCancel={onCancel}
      />
    </>
  );
}
AuthPanel.propTypes = {
  skills: PropTypes.array.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialMode: PropTypes.string,
  initialType: PropTypes.string,
};
