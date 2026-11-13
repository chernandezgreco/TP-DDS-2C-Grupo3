import React from "react";
import PropTypes from "prop-types";
import Markdown from "./Markdown";
export default function PublicProfile({
  profile,
  type,
  skillName,
  onClose,
  onContacts,
}) {
  return (
    <section className="panel">
      <button className="text-button" onClick={onClose}>
        ← Volver al listado
      </button>
      <h1>{profile.nombre || profile.nombreFantasia}</h1>
      <p>
        {profile.tipo?.replaceAll("_", " ") ||
          profile.pronombres ||
          "Persona colaboradora"}
      </p>
      <Markdown>
        {profile.descripcion ||
          profile.presentacion ||
          "Sin presentación todavía."}
      </Markdown>
      {profile.ubicacion && <p>Ubicación: {profile.ubicacion}</p>}
      {type === "colaboradoras" && (
        <>
          <h2>Habilidades</h2>
          <div className="tags">
            {profile.habilidades.map((h) => (
              <span key={h}>{skillName(h)}</span>
            ))}
          </div>
          {profile.github && (
            <p>
              GitHub / GitLab:{" "}
              {/^https?:\/\//i.test(profile.github) ? (
                <a href={profile.github} target="_blank" rel="noreferrer">
                  {profile.github}
                </a>
              ) : (
                profile.github
              )}
            </p>
          )}
          <button className="secondary" onClick={() => onContacts(profile)}>
            Consultar contactos
          </button>
          <p className="hint">
            Los contactos sólo están disponibles para su titular y para los
            colectivos con una colaboración aceptada.
          </p>
        </>
      )}
    </section>
  );
}
PublicProfile.propTypes = {
  profile: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  skillName: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onContacts: PropTypes.func.isRequired,
};
