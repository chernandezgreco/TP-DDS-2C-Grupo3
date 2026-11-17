import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const niveles = [
  ["INICIAL", "Inicial"],
  ["INTERMEDIO", "Intermedio"],
  ["AVANZADO", "Avanzado"],
];

export default function ExperienciaHabilidades({ person, skills, busy, onSave }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const actual = new Map(
      (person.experienciaHabilidades || []).map((item) => [item.codigo, item]),
    );
    setItems(
      (person.habilidades || []).map((codigo) => ({
        codigo,
        nivel: actual.get(codigo)?.nivel || "INICIAL",
        anios: actual.get(codigo)?.anios ?? 0,
        descripcion: actual.get(codigo)?.descripcion || "",
      })),
    );
  }, [person.habilidades, person.experienciaHabilidades]);

  function cambiar(codigo, campo, valor) {
    setItems((actuales) =>
      actuales.map((item) =>
        item.codigo === codigo ? { ...item, [campo]: valor } : item,
      ),
    );
  }

  return (
    <section className="panel">
      <h3>Experiencia por habilidad</h3>
      <p>Indicá tu nivel y años de experiencia en cada habilidad de tu perfil.</p>
      {!items.length ? (
        <p>Agregá habilidades a tu perfil para registrar tu experiencia.</p>
      ) : (
        items.map((item) => (
          <div className="skill-experience-row" key={item.codigo}>
            <b>{skills.find((skill) => skill.codigo === item.codigo)?.titulo || item.codigo}</b>
            <label>
              Nivel
              <select
                value={item.nivel}
                onChange={(event) => cambiar(item.codigo, "nivel", event.target.value)}
                disabled={busy}
              >
                {niveles.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Años de experiencia
              <input
                type="number"
                min="0"
                max="60"
                step="1"
                value={item.anios}
                onChange={(event) => cambiar(item.codigo, "anios", Number(event.target.value))}
                disabled={busy}
              />
            </label>
            <label>
              Descripción (opcional)
              <textarea
                maxLength={500}
                rows={2}
                value={item.descripcion}
                onChange={(event) => cambiar(item.codigo, "descripcion", event.target.value)}
                disabled={busy}
              />
            </label>
          </div>
        ))
      )}
      {!!items.length && (
        <button disabled={busy} onClick={() => onSave(items)}>
          Guardar experiencia
        </button>
      )}
    </section>
  );
}

ExperienciaHabilidades.propTypes = {
  person: PropTypes.object.isRequired,
  skills: PropTypes.array.isRequired,
  busy: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
};
