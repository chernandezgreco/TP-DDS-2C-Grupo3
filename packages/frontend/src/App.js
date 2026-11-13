import Markdown from "./Markdown";
import Terminos from "./Terminos";
import React, { useEffect, useState } from "react";
import { api, idOf } from "./api";
import {
  ResourceForm,
  projectFields,
  profileFields,
  collectiveFields,
  personFields,
  achievementFields,
} from "./forms";
import "./App.css";
const sections = {
  proyectos: "Explorar proyectos",
  colectivos: "Colectivos",
  colaboradoras: "Colaboradoras",
  espacio: "Mi espacio",
  mensajes: "Mensajes",
  terminos: "Términos y condiciones",
  habilidades: "Habilidades",
};
const title = (x) =>
  x?.titulo || x?.nombre || x?.nombreFantasia || "Sin nombre";
const initial = {
  proyectos: [],
  colectivos: [],
  colaboradoras: [],
  habilidades: [],
  colaboraciones: [],
};
export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const [data, setData] = useState(initial),
    [page, setPage] = useState(
      window.location.hash.slice(1).split("/")[0] || "proyectos",
    ),
    [selected, setSelected] = useState(null),
    [actor, setActor] = useState(null);
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [matches, setMatches] = useState(null),
    [extras, setExtras] = useState({}),
    [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [anonymous, setAnonymous] = useState(false);
  async function refresh() {
    setLoading(true);
    try {
      const entries = await Promise.all(
        Object.keys(initial).map(async (k) => [k, await api.get("/" + k)]),
      );
      setData(Object.fromEntries(entries));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    const change = () => {
      if (window.location.hash === "#main") return;
      setRoute(window.location.hash);
      setPage(window.location.hash.slice(1).split("/")[0] || "proyectos");
      setSelected(null);
      setExtras({});
      setQuery("");
      setMatches(null);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (!form) return;
    const previous = document.activeElement;
    const dialog = document.querySelector('[role="dialog"]');
    const controls = () =>
      Array.from(
        dialog.querySelectorAll(
          "button:not(:disabled), input, select, textarea, a[href]",
        ),
      );
    controls()[0]?.focus();
    const trap = (event) => {
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener("keydown", trap);
    return () => {
      dialog.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [form]);
  async function run(fn, message = "Cambios guardados.") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await refresh();
      setNotice(message);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function load(key, path) {
    setBusy(true);
    setError("");
    try {
      const result = await api.get(path);
      setExtras((v) => ({ ...v, [key]: result }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function edit(name, fields, path, method = "post", values = {}) {
    const initialValues =
      method === "patch" || fields === projectFields
        ? Object.fromEntries(
            fields
              .filter((f) => values[f.name] !== undefined)
              .map((f) => [f.name, values[f.name]]),
          )
        : values;
    if (fields === projectFields) {
      setBusy(true);
      setError("");
      try {
        const terms = await api.get("/terminos/actual");
        setForm({
          name,
          fields,
          path,
          method,
          project: true,
          terms,
          initial: {
            ...initialValues,
            requiereIA: values.requiereIA ?? null,
            usosIA: values.usosIA || [],
          },
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    } else setForm({ name, fields, path, method, initial: initialValues });
  }
  const pid = idOf(selected),
    isOwner =
      actor?.type === "colectivos" && selected?.colectivoId === actor.id;
  const base = `/colectivos/${actor?.id}/proyectos/${pid}`;
  const skill = (c) =>
    data.habilidades.find((h) => h.codigo === c)?.titulo || c;
  async function updateSelected() {
    setSelected(await api.get("/proyectos/" + pid));
    setExtras({});
  }
  useEffect(() => {
    const resourceId = window.location.hash.slice(1).split("/")[1];
    if (!resourceId) return;
    if (page === "proyectos")
      setSelected(data.proyectos.find((p) => idOf(p) === resourceId) || null);
    if (page === "colectivos")
      setQuery(
        data.colectivos.find((c) => idOf(c) === resourceId)?.nombre || "",
      );
  }, [data.proyectos, data.colectivos, page, route]);
  const person = data.colaboradoras.find((x) => idOf(x) === actor?.id);
  const list = (
    page === "espacio"
      ? data.proyectos.filter((p) =>
          actor?.type === "colectivos"
            ? p.colectivoId === actor.id
            : data.colaboraciones.some(
                (c) =>
                  c.proyectoId === idOf(p) && c.colaboradoraId === actor?.id,
              ),
        )
      : page === "proyectos"
        ? matches || data.proyectos
        : data[page] || []
  )
    .filter((x) =>
      `${title(x)} ${x.descripcion || ""} ${(x.habilidades || (x.perfiles || []).flatMap((p) => p.habilidadesRequeridas)).map(skill).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter(
      (x) =>
        page !== "proyectos" ||
        !open ||
        (x.estaBuscando && x.estado === "ACTIVO"),
    );
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <aside>
        <a href="#proyectos" className="brand">
          <span>{"{ }"}</span>
          <strong>
            Código a<br />
            Voluntad
          </strong>
        </a>
        <p className="eyebrow">CONSTRUIR EN COMUNIDAD</p>
        <nav aria-label="Navegación principal">
          {Object.entries(sections).map(([k, v], i) => (
            <a
              href={"#" + k}
              key={k}
              aria-current={page === k ? "page" : undefined}
            >
              <span aria-hidden="true">
                {["▦", "◎", "♧", "⌂", "✉", "§", "✳"][i]}
              </span>
              {v}
            </a>
          ))}
        </nav>
        <div className="aside-note">
          <b>
            Tu código puede
            <br />
            cambiar las cosas.
          </b>
          <p>Conectá tus habilidades con una causa que te importe.</p>
          <small>Hecho para compartir ↗</small>
        </div>
        <small>UTN · Desarrollo de Software · 2026</small>
      </aside>
      <div className="workspace">
        <header>
          <span>Una comunidad. Muchas posibilidades.</span>
          <button
            className="secondary"
            onClick={() => setForm({ name: "Elegir perfil de trabajo" })}
          >
            {actor
              ? title(data[actor.type].find((x) => idOf(x) === actor.id))
              : "Elegir perfil"}{" "}
            ▾
          </button>
        </header>
        <main id="main">
          <div className="breadcrumb">
            Comunidad / {sections[page] || "Proyectos"}
            {selected ? " / Detalle" : ""}
          </div>
          <div role="status" aria-live="polite">
            {(loading || busy) && (
              <p className="loading">Cargando información…</p>
            )}
            {notice && <div className="success">✓ {notice}</div>}
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
              <button
                className="secondary"
                onClick={() => {
                  setError("");
                  refresh();
                }}
              >
                Reintentar carga
              </button>
            </div>
          )}
          {page === "terminos" ? (
            <Terminos />
          ) : page === "habilidades" ? (
            <section>
              <h1>Habilidades de la comunidad</h1>
              <div className="grid">
                {data.habilidades.map((h) => (
                  <article className="card padded" key={h.codigo}>
                    <h2>{h.titulo}</h2>
                    <Markdown>{h.descripcion}</Markdown>
                  </article>
                ))}
              </div>
            </section>
          ) : selected ? (
            <>
              <button
                className="text-button"
                onClick={() => {
                  setSelected(null);
                  setExtras({});
                }}
              >
                ← Volver al listado
              </button>
              <p className="eyebrow">PROYECTO DE LA COMUNIDAD</p>
              <h1>{selected.titulo}</h1>
              <p>
                {
                  data.colectivos.find((c) => idOf(c) === selected.colectivoId)
                    ?.nombre
                }{" "}
                · <span className="badge">{selected.estado}</span>
              </p>
              <Markdown className="description">
                {selected.descripcion}
              </Markdown>
              <section className="panel">
                <h2>Huella hídrica / IA</h2>
                <p>
                  {selected.requiereIA === false
                    ? "Este proyecto declara no requerir IA generativa."
                    : selected.requiereIA === true
                      ? "Este proyecto declara requerir IA generativa."
                      : "Este proyecto todavía no declaró su uso de IA."}
                </p>
                <small>
                  Declaración del colectivo, sin medición ni monitoreo del
                  consumo de agua o energía.
                </small>
                {(selected.usosIA || []).map((u, i) => (
                  <div className="list-row" key={i}>
                    <b>
                      {u.descripcion} · Uso {u.grado.toLowerCase()}
                    </b>
                    <p>{u.justificacion}</p>
                  </div>
                ))}
              </section>
              {isOwner && (
                <div className="toolbar">
                  <button
                    className="secondary"
                    onClick={() =>
                      edit(
                        "Editar proyecto",
                        projectFields,
                        base,
                        "put",
                        selected,
                      )
                    }
                  >
                    Editar proyecto
                  </button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "¿Eliminar este proyecto permanentemente? Si tiene postulaciones, colaboraciones o logros, deberás finalizarlo para conservar su historial.",
                        )
                      )
                        run(async () => {
                          await api.delete(base);
                          setSelected(null);
                          setExtras({});
                        }, "Proyecto eliminado.");
                    }}
                  >
                    Eliminar proyecto
                  </button>
                  <button
                    onClick={() =>
                      edit(
                        "Agregar perfil",
                        profileFields(data.habilidades),
                        `/proyectos/${pid}/perfiles`,
                      )
                    }
                  >
                    + Agregar perfil
                  </button>
                  <button
                    className="secondary"
                    disabled={busy || selected.estado !== "ACTIVO"}
                    onClick={() =>
                      run(async () => {
                        await api.patch(base + "/busqueda", {
                          estaBuscando: !selected.estaBuscando,
                        });
                        await updateSelected();
                      })
                    }
                  >
                    {selected.estaBuscando
                      ? "Pausar búsqueda"
                      : "Abrir búsqueda"}
                  </button>
                  <button
                    className="danger"
                    disabled={busy || selected.estado !== "ACTIVO"}
                    onClick={() => {
                      if (
                        window.confirm(
                          "¿Finalizar el proyecto? Ya no admitirá nuevas postulaciones.",
                        )
                      )
                        run(async () => {
                          await api.patch(base, { estado: "FINALIZADO" });
                          await updateSelected();
                        });
                    }}
                  >
                    Finalizar proyecto
                  </button>
                </div>
              )}
              <h2>
                Perfiles que hacen falta{" "}
                <span className="count">{selected.perfiles?.length || 0}</span>
              </h2>
              <div className="grid">
                {(selected.perfiles || []).map((p) => (
                  <article className="card padded" key={idOf(p)}>
                    <span className="badge">
                      {selected.estaBuscando && selected.estado === "ACTIVO"
                        ? "Búsqueda abierta"
                        : "Búsqueda cerrada"}
                    </span>
                    <Markdown className="profile-description">
                      {p.descripcionPerfil}
                    </Markdown>
                    <p>
                      {p.compromiso?.cantidadHoras} horas{" "}
                      {p.compromiso?.tipo?.toLowerCase()}
                    </p>
                    <div className="tags">
                      {p.habilidadesRequeridas.map((h) => (
                        <span key={h}>{skill(h)}</span>
                      ))}
                    </div>
                    <p>
                      Opcionales:{" "}
                      {(p.habilidadesOpcionales || []).map(skill).join(", ") ||
                        "Ninguna"}
                    </p>
                    <p>
                      {p.modalidad?.gratuita ? "Voluntariado " : ""}
                      {p.modalidad?.incentivoEconomico
                        ? " · Incentivo económico "
                        : ""}
                      {p.modalidad?.contratacionEventual
                        ? " · Posible contratación"
                        : ""}
                    </p>
                    <p>
                      Cupo: {p.cantidadLimite || "Sin límite"}
                      {p.fechaLimite
                        ? " · Hasta " +
                          new Date(p.fechaLimite).toLocaleDateString("es-AR")
                        : ""}
                    </p>
                    {actor?.type === "colaboradoras" && (
                      <button
                        disabled={
                          busy ||
                          !selected.estaBuscando ||
                          selected.estado !== "ACTIVO"
                        }
                        onClick={() =>
                          run(
                            () =>
                              api.post(`/proyectos/${pid}/postularse`, {
                                colaboradoraId: actor.id,
                                perfilId: idOf(p),
                                anonimidad: anonymous,
                              }),
                            "Postulación enviada para revisión del colectivo.",
                          )
                        }
                      >
                        Postularme ↗
                      </button>
                    )}
                    {isOwner && (
                      <div className="toolbar">
                        <button
                          className="secondary"
                          onClick={() =>
                            load(
                              "candidatas",
                              `/proyectos/${pid}/perfiles/${idOf(p)}/colaboradoras-potenciales`,
                            )
                          }
                        >
                          Buscar colaboradoras
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            edit(
                              "Editar perfil",
                              profileFields(data.habilidades).filter(
                                (f) =>
                                  !["fechaLimite", "cantidadLimite"].includes(
                                    f.name,
                                  ),
                              ),
                              `/proyectos/${pid}/perfiles/${idOf(p)}`,
                              "put",
                              p,
                            )
                          }
                        >
                          Editar
                        </button>
                        <button
                          className="danger"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm("¿Eliminar este perfil?"))
                              run(async () => {
                                await api.delete(
                                  `/proyectos/${pid}/perfiles/${idOf(p)}`,
                                );
                                await updateSelected();
                              });
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              {actor?.type === "colaboradoras" && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                  />{" "}
                  Registrar públicamente mi contribución como anónima
                </label>
              )}
              {extras.candidatas && (
                <section className="panel">
                  <h2>Personas compatibles</h2>
                  {!extras.candidatas.length && (
                    <p>No hay candidatas para este perfil.</p>
                  )}
                  {extras.candidatas.map((c) => (
                    <div className="list-row" key={idOf(c)}>
                      <b>{title(c)}</b>
                      <Markdown>{c.presentacion}</Markdown>
                      <button
                        onClick={() =>
                          edit(
                            "Contactar colaboradora",
                            [
                              {
                                name: "texto",
                                label: "Mensaje",
                                type: "textarea",
                                required: true,
                              },
                            ],
                            "/notificaciones",
                            "post",
                            {
                              colaboradoraId: idOf(c),
                              colectivoId: actor.id,
                              proyectoId: pid,
                            },
                          )
                        }
                      >
                        Enviar mensaje
                      </button>
                    </div>
                  ))}
                </section>
              )}
              <section className="panel">
                <div className="title-row">
                  <h2>Avances y logros</h2>
                  <div className="toolbar">
                    <button
                      className="secondary"
                      onClick={() => load("logros", `/proyectos/${pid}/logros`)}
                    >
                      Ver avances
                    </button>
                    {isOwner && (
                      <button
                        onClick={() =>
                          edit(
                            "Publicar logro",
                            achievementFields,
                            `/proyectos/${pid}/logros`,
                          )
                        }
                      >
                        + Publicar logro
                      </button>
                    )}
                  </div>
                </div>
                {extras.logros?.length === 0 && (
                  <p>Todavía no hay logros publicados.</p>
                )}
                {extras.logros?.map((l) => (
                  <div className="list-row" key={idOf(l)}>
                    <Markdown>{l.descripcion}</Markdown>
                    <progress
                      aria-label="Porcentaje completado"
                      max="100"
                      value={l.porcentajeCompletitud}
                    />{" "}
                    <b>{l.porcentajeCompletitud}%</b>
                    <div className="toolbar">
                      {["enlaceSistema", "enlaceFuentePublica"].map(
                        (k) =>
                          /^https?:\/\//i.test(l[k] || "") && (
                            <a
                              key={k}
                              href={l[k]}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {k === "enlaceSistema"
                                ? "Ver sistema ↗"
                                : "Código fuente ↗"}
                            </a>
                          ),
                      )}
                      {isOwner && (
                        <>
                          <button
                            className="secondary"
                            onClick={() =>
                              edit(
                                "Editar logro",
                                achievementFields,
                                `/proyectos/${pid}/logros/${idOf(l)}`,
                                "put",
                                l,
                              )
                            }
                          >
                            Editar
                          </button>
                          <button
                            className="danger"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm("¿Eliminar logro?"))
                                run(async () => {
                                  await api.delete(
                                    `/proyectos/${pid}/logros/${idOf(l)}`,
                                  );
                                  setExtras({});
                                });
                            }}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </section>
              {isOwner && (
                <section className="panel">
                  <h2>Postulaciones</h2>
                  <div className="toolbar">
                    <button
                      onClick={() =>
                        load(
                          "postulaciones",
                          base + "/postulaciones/pendientes",
                        )
                      }
                    >
                      Pendientes
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        load(
                          "postulaciones",
                          base + "/postulaciones/procesadas",
                        )
                      }
                    >
                      Procesadas
                    </button>
                  </div>
                  {extras.postulaciones?.length === 0 && (
                    <p>No hay postulaciones.</p>
                  )}
                  {extras.postulaciones?.map((p) => (
                    <div className="list-row" key={idOf(p)}>
                      <b>Postulación · {p.estado}</b>
                      <p>
                        Perfil:{" "}
                        {selected.perfiles.find((f) => idOf(f) === p.perfilId)
                          ?.descripcionPerfil || p.perfilId}
                      </p>
                      {p.estado === "PENDIENTE" && (
                        <div className="toolbar">
                          {["ACEPTADA", "RECHAZADA"].map((estado) => (
                            <button
                              key={estado}
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  await api.patch(
                                    base + "/postulaciones/" + idOf(p),
                                    { estado },
                                  );
                                  setExtras({});
                                })
                              }
                            >
                              {estado === "ACEPTADA" ? "Aceptar" : "Rechazar"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}
              <section className="panel">
                <h2>Colaboraciones actuales</h2>
                {data.colaboraciones
                  .filter((c) => c.proyectoId === pid)
                  .map((c) => (
                    <div className="list-row" key={idOf(c)}>
                      <b>
                        {c.colaboradoraId === "Anonimo"
                          ? "Contribución anónima"
                          : title(
                              data.colaboradoras.find(
                                (x) => idOf(x) === c.colaboradoraId,
                              ),
                            )}
                      </b>
                      <p>
                        {
                          selected.perfiles.find((p) => idOf(p) === c.perfilId)
                            ?.descripcionPerfil
                        }
                      </p>
                      {(isOwner || actor?.id === c.colaboradoraId) && (
                        <button
                          className="danger"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Esta baja es permanente y no se puede deshacer. ¿Continuar?",
                              )
                            )
                              run(() =>
                                api.delete(
                                  isOwner
                                    ? "/colectivos/colaboraciones/" + idOf(c)
                                    : `/colaboradoras/${actor.id}/proyectos/${pid}/baja`,
                                ),
                              );
                          }}
                        >
                          Dar de baja permanentemente
                        </button>
                      )}
                    </div>
                  ))}
              </section>
            </>
          ) : (
            <>
              <div className="title-row">
                <div>
                  <p className="eyebrow">CÓDIGO CON PROPÓSITO</p>
                  <h1>{sections[page] || sections.proyectos}</h1>
                  <p className="subtitle">
                    {page === "proyectos"
                      ? "Encontrá una causa. Sumá lo que sabés."
                      : "Las buenas ideas crecen cuando nos conectamos."}
                  </p>
                </div>
                {page === "proyectos" && actor?.type === "colectivos" && (
                  <button
                    onClick={() =>
                      edit(
                        "Crear proyecto",
                        projectFields,
                        `/colectivos/${actor.id}/proyectos`,
                      )
                    }
                  >
                    + Crear proyecto
                  </button>
                )}
                {["colectivos", "colaboradoras"].includes(page) && (
                  <button
                    onClick={() =>
                      edit(
                        "Registrar " +
                          (page === "colectivos"
                            ? "colectivo"
                            : "colaboradora"),
                        page === "colectivos"
                          ? collectiveFields
                          : personFields(data.habilidades),
                        "/" + page,
                      )
                    }
                  >
                    + Registrarme
                  </button>
                )}
              </div>
              {page === "proyectos" && (
                <section className="hero">
                  <div>
                    <span className="badge">TECNOLOGÍA QUE TRANSFORMA</span>
                    <h2>
                      Un poco de tu tiempo.
                      <br />
                      Un gran cambio para alguien.
                    </h2>
                    <p>
                      Proyectos abiertos, causas reales y personas como vos.
                      <br />
                      El próximo aporte puede ser el tuyo.
                    </p>
                    <a href="#colectivos">Conocé a los colectivos ↗</a>
                  </div>
                  <div className="hero-art" aria-hidden="true">
                    <span>{"</>"}</span>
                    <i>+</i>
                    <b>↗</b>
                    <small>construimos juntos</small>
                  </div>
                </section>
              )}
              {page === "mensajes" ? (
                <section className="panel">
                  <h2>Tu bandeja de entrada</h2>
                  {actor?.type !== "colaboradoras" ? (
                    <p>
                      Elegí un perfil de colaboradora para consultar sus
                      mensajes.
                    </p>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          load(
                            "mensajes",
                            `/colaboradoras/${actor.id}/notificaciones`,
                          )
                        }
                      >
                        Cargar mensajes
                      </button>
                      {extras.mensajes?.length === 0 && (
                        <p>No tenés mensajes.</p>
                      )}
                      {extras.mensajes?.map((m) => (
                        <div className="list-row" key={idOf(m)}>
                          <b>
                            {data.colectivos.find(
                              (c) => idOf(c) === m.colectivoId,
                            )?.nombre || "Colectivo"}
                          </b>
                          <p>{m.texto}</p>
                          <small>
                            {new Date(m.fecha).toLocaleString("es-AR")}
                          </small>
                        </div>
                      ))}
                    </>
                  )}
                </section>
              ) : (
                <>
                  {page === "espacio" && (
                    <section className="panel">
                      <h2>Mi perfil y mis proyectos</h2>
                      <p>
                        Seleccioná un perfil para gestionar sus recursos. El
                        backend aún debe incorporar autenticación y permisos.
                      </p>
                      {actor && (
                        <button
                          className="secondary"
                          onClick={() =>
                            edit(
                              actor.type === "colectivos"
                                ? "Editar colectivo"
                                : "Editar mi perfil",
                              actor.type === "colectivos"
                                ? collectiveFields
                                : personFields(data.habilidades),
                              `/${actor.type}/${actor.id}`,
                              "patch",
                              data[actor.type].find(
                                (x) => idOf(x) === actor.id,
                              ),
                            )
                          }
                        >
                          Editar mis datos
                        </button>
                      )}
                      {person && (
                        <div className="toolbar">
                          <button
                            onClick={() =>
                              edit(
                                "Agregar habilidad",
                                [
                                  {
                                    name: "codigo",
                                    label: "Habilidad",
                                    type: "select",
                                    options: data.habilidades.map((h) => [
                                      h.codigo,
                                      h.titulo,
                                    ]),
                                    required: true,
                                  },
                                ],
                                `/colaboradoras/${actor.id}/habilidades`,
                              )
                            }
                          >
                            Agregar habilidad
                          </button>
                          <button
                            onClick={() =>
                              edit(
                                "Agregar contacto privado",
                                [
                                  {
                                    name: "tipo",
                                    label: "Tipo",
                                    type: "select",
                                    options: ["EMAIL", "WHATSAPP", "SMS"],
                                    required: true,
                                  },
                                  {
                                    name: "valor",
                                    label: "Contacto",
                                    type: "text",
                                    required: true,
                                  },
                                ],
                                `/colaboradoras/${actor.id}/medios-contacto`,
                              )
                            }
                          >
                            Agregar contacto
                          </button>
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              run(() =>
                                api.patch(
                                  `/colaboradoras/${actor.id}/preferencias`,
                                  {
                                    aceptaMensajeria: !person.aceptaMensajeria,
                                  },
                                ),
                              )
                            }
                          >
                            {person.aceptaMensajeria ? "Desactivar" : "Activar"}{" "}
                            mensajes de colectivos
                          </button>
                        </div>
                      )}
                    </section>
                  )}
                  <div className="filters">
                    <label className="search">
                      <span aria-hidden="true">⌕</span>
                      <input
                        aria-label="Buscar por nombre o habilidad"
                        placeholder="Buscar por nombre, causa o habilidad…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    {page === "proyectos" && (
                      <>
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={open}
                            onChange={(e) => setOpen(e.target.checked)}
                          />{" "}
                          Solo búsquedas abiertas
                        </label>
                        {actor?.type === "colaboradoras" && (
                          <button
                            className="secondary"
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                const result = await api.get(
                                  `/colaboradoras/${actor.id}/proyectos-potenciales`,
                                );
                                setMatches(result.map((x) => x.proyecto || x));
                              }, "Mostrando proyectos compatibles.")
                            }
                          >
                            Para mis habilidades
                          </button>
                        )}
                        {matches && (
                          <button
                            className="text-button"
                            onClick={() => setMatches(null)}
                          >
                            Ver todos
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="results">
                    <b>
                      {list.length}{" "}
                      {["proyectos", "espacio"].includes(page)
                        ? "proyectos"
                        : "resultados"}
                    </b>
                    <span>Una oportunidad para aportar</span>
                  </div>
                  {!loading && !list.length && (
                    <div className="empty">
                      <h2>
                        {error
                          ? "No pudimos cargar los datos"
                          : "Todavía no hay resultados"}
                      </h2>
                      <p>
                        {error
                          ? "Verificá que el backend y MongoDB estén encendidos."
                          : "Probá otra búsqueda o registrá el primer recurso."}
                      </p>
                    </div>
                  )}
                  <div className="grid">
                    {list.map((x, i) => (
                      <article className="card" key={idOf(x)}>
                        <div
                          className={"card-art tone-" + (i % 4)}
                          aria-hidden="true"
                        >
                          {x.titulo
                            ? ["{ }", "↗", "✳", "⌘"][i % 4]
                            : title(x).slice(0, 2).toUpperCase()}
                          <span>COMUNIDAD ABIERTA</span>
                        </div>
                        <div className="card-body">
                          <span className="badge">
                            {x.titulo
                              ? x.estaBuscando && x.estado === "ACTIVO"
                                ? "● Buscando colaboraciones"
                                : "Búsqueda cerrada"
                              : x.tipo?.replaceAll("_", " ") || "Colaboradora"}
                          </span>
                          <h2>{title(x)}</h2>
                          {x.requiereIA === false && (
                            <span className="badge">Sin IA generativa</span>
                          )}
                          <Markdown className="card-copy">
                            {x.descripcion ||
                              x.presentacion ||
                              "Con ganas de aportar a la comunidad."}
                          </Markdown>
                          <div className="tags">
                            {[
                              ...new Set(
                                x.habilidades ||
                                  (x.perfiles || []).flatMap(
                                    (p) => p.habilidadesRequeridas,
                                  ),
                              ),
                            ]
                              .slice(0, 4)
                              .map((h) => (
                                <span key={h}>{skill(h)}</span>
                              ))}
                          </div>
                          <footer>
                            <small>
                              {x.titulo
                                ? `${x.perfiles?.length || 0} perfiles`
                                : x.ubicacion ||
                                  x.pronombres ||
                                  "Código a Voluntad"}
                            </small>
                            {x.titulo && (
                              <button
                                className="text-button"
                                onClick={() => {
                                  setSelected(x);
                                  setExtras({});
                                }}
                              >
                                Ver proyecto ↗
                              </button>
                            )}
                          </footer>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <footer className="page-footer">
            Código a Voluntad<span>Software libre, impacto compartido.</span>
            <a href="#terminos">Términos</a>
            <a
              href={
                (api.defaults?.baseURL ||
                  process.env.REACT_APP_API_URL ||
                  "http://localhost:8000/api") + "/rss/proyectos.xml"
              }
            >
              RSS de proyectos
            </a>
            <a
              href={
                (api.defaults?.baseURL ||
                  process.env.REACT_APP_API_URL ||
                  "http://localhost:8000/api") + "/rss/colectivos.xml"
              }
            >
              RSS de colectivos
            </a>
          </footer>
        </main>
      </div>
      {form && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={form.name}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !busy) setForm(null);
            }}
          >
            <button
              className="modal-close secondary"
              aria-label="Cerrar formulario"
              disabled={busy}
              onClick={() => setForm(null)}
            >
              ×
            </button>
            <h2>{form.name}</h2>
            {form.path ? (
              <>
                <p role="alert" className={error ? "error" : ""}>
                  {error}
                </p>
                <ResourceForm
                  {...form}
                  busy={busy}
                  onCancel={() => setForm(null)}
                  onSubmit={async (values) => {
                    const ok = await run(async () => {
                      await api[form.method](form.path, values);
                      if (pid) await updateSelected();
                    });
                    if (ok) setForm(null);
                  }}
                />
              </>
            ) : (
              <>
                <p>
                  Entorno de desarrollo: esta selección permite probar los
                  flujos y no inicia una sesión autenticada.
                </p>
                {["colaboradoras", "colectivos"].map((type) => (
                  <label key={type}>
                    {type === "colectivos" ? "Colectivo" : "Colaboradora"}
                    <select
                      autoFocus={type === "colaboradoras"}
                      value={actor?.type === type ? actor.id : ""}
                      onChange={(e) => {
                        setActor(
                          e.target.value ? { type, id: e.target.value } : null,
                        );
                        setMatches(null);
                        setExtras({});
                        setForm(null);
                      }}
                    >
                      <option value="">Seleccionar…</option>
                      {data[type].map((x) => (
                        <option key={idOf(x)} value={idOf(x)}>
                          {title(x)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <button
                  className="secondary"
                  onClick={() => {
                    setActor(null);
                    setForm(null);
                  }}
                >
                  Continuar como visitante
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
