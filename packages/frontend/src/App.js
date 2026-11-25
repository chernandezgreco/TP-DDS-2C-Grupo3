import CatalogoHabilidades from "./CatalogoHabilidades";
import AuthPanel from "./AuthPanel";
import PublicProfile from "./PublicProfile";
import Markdown from "./Markdown";
import Terminos from "./Terminos";
import DenunciaForm from "./DenunciaForm";
import DenunciasAdmin from "./DenunciasAdmin";
import ExperienciaHabilidades from "./ExperienciaHabilidades";
import LinkedInIntegration from "./LinkedInIntegration";
import PortabilidadDatos from "./PortabilidadDatos";
import TareasProyecto from "./TareasProyecto";
import ListaEtiquetas from "./ListaEtiquetas";
import BotonModoDaltonico from "./BotonModoDaltonico";
import EstadoBadge from "./EstadoBadge";
import AvisoFlotante from "./AvisoFlotante";
import Icono from "./Icono";
import BandejaMensajes from "./BandejaMensajes";
import useMensajesNoLeidos, { descripcionNoLeidos, textoContador } from "./useMensajesNoLeidos";
import React, { useEffect, useRef, useState } from "react";
import { api, idOf } from "./api";
import {
  ResourceForm,
  projectFields,
  profileFields,
  collectiveFields,
  personFields,
  achievementFields,
} from "./forms";
import {
  MAX_ETIQUETAS,
  etiquetasEnUso,
  sinAcentos,
  textoDeEtiquetas,
} from "./etiquetas";
import "./App.css";
const sections = {
  proyectos: "Explorar proyectos",
  colectivos: "Colectivos",
  colaboradoras: "Colaboradoras",
  espacio: "Mi espacio",
  mensajes: "Mensajes",
  terminos: "Términos y condiciones",
  habilidades: "Habilidades",
  denuncias: "Administrar denuncias",
};
// grupos del menú lateral, en orden; "terminos" no va en el menú (está en el pie de página)
const gruposMenu = [
  { id: "explorar", titulo: "Explorar", secciones: ["proyectos", "colectivos", "colaboradoras", "habilidades"] },
  { id: "cuenta", titulo: "Tu cuenta", secciones: ["espacio", "mensajes"] },
  { id: "administracion", titulo: "Administración", secciones: ["denuncias"], soloConSesion: true },
];
const iconosMenu = {
  proyectos: "proyectos",
  colectivos: "colectivos",
  colaboradoras: "corazon",
  espacio: "inicio",
  mensajes: "correo",
  habilidades: "codigo",
  denuncias: "bandera",
};
const title = (x) =>
  x?.titulo || x?.nombre || x?.nombreFantasia || "Sin nombre";
const initials = (label) =>
  label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase("es-AR"))
    .join("") || "U";
const initial = {
  proyectos: [],
  colectivos: [],
  colaboradoras: [],
  habilidades: [],
  colaboraciones: [],
};
export default function App() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const [publicProfile, setPublicProfile] = useState(null);
  const [ownPosts, setOwnPosts] = useState([]);
  const [ownContacts, setOwnContacts] = useState(null);
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
    // filtro por etiquetas (proyectos y colectivos): se consulta al backend con ?etiquetas=
    [filtroEtiquetas, setFiltroEtiquetas] = useState([]),
    [idsPorEtiquetas, setIdsPorEtiquetas] = useState(null),
    [extras, setExtras] = useState({}),
    [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [anonymous, setAnonymous] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { cantidad: noLeidos, marcarLeidos } = useMensajesNoLeidos(actor, page);
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const cerrarFuera = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };
    const cerrarEscape = (event) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [userMenuOpen]);
  async function refresh() {
    setLoading(true);
    try {
      const keys = Object.keys(initial);
      const results = await Promise.allSettled(
        keys.map((k) => api.get("/" + k)),
      );
      const updates = {};
      const failures = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") updates[keys[index]] = result.value;
        else failures.push(result.reason.message);
      });
      setData((old) => ({ ...old, ...updates }));
      if (failures.length) setError([...new Set(failures)].join(" "));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    async function initialize() {
      try {
        const session = await api.get("/auth/sesion");
        setActor(session.actor || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setSessionLoading(false);
      }
      await refresh();
    }
    initialize();
    const expired = () => {
      setActor(null);
      setData(initial);
      setSelected(null);
      setForm(null);
      setExtras({});
      setOwnPosts([]);
      setOwnContacts(null);
      setFiltroEtiquetas([]);
      setNotice("Tu sesión venció. Iniciá sesión nuevamente.");
      refresh();
    };
    window.addEventListener("sesion-expirada", expired);
    const change = () => {
      if (window.location.hash === "#main") return;
      setRoute(window.location.hash);
      setPage(window.location.hash.slice(1).split("/")[0] || "proyectos");
      setSelected(null);
      setPublicProfile(null);
      setExtras({});
      setQuery("");
      setMatches(null);
      setFiltroEtiquetas([]);
    };
    window.addEventListener("hashchange", change);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("sesion-expirada", expired);
    };
  }, []);
  useEffect(() => {
    if (!form) return;
    const previous = document.activeElement;
    const dialog = document.querySelector('[role="dialog"]');
    const controls = () =>
      Array.from(
        dialog.querySelectorAll(
          "button, input, select, textarea, a[href], summary",
        ),
      ).filter((el) => !el.matches(":disabled") && el.tabIndex !== -1);
    controls()[0]?.focus();
    const trap = (event) => {
      if (event.key !== "Tab") return;
      const items = controls();
      if (!items.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
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
  async function edit(
    name,
    fields,
    path,
    method = "post",
    values = {},
    extra = {},
  ) {
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
    } else
      setForm({ name, fields, path, method, initial: initialValues, ...extra });
  }
  const pid = idOf(selected),
    isOwner =
      actor?.type === "colectivos" && selected?.colectivoId === actor.id;
  const participaEnProyecto = (proyectoId) =>
    actor?.type === "colaboradoras" &&
    data.colaboraciones.some(
      (c) => c.proyectoId === proyectoId && c.colaboradoraId === actor.id,
    );
  const base = `/colectivos/${actor?.id}/proyectos/${pid}`;
  const skill = (c) =>
    data.habilidades.find((h) => h.codigo === c)?.titulo || c;
  function iniciarDenuncia(tipo, recurso) {
    if (!actor) {
      setForm({ name: "Iniciá sesión para denunciar", auth: true });
      return;
    }
    setError("");
    setForm({
      name: "Enviar denuncia",
      denuncia: {
        targetType: tipo,
        targetId: idOf(recurso),
        targetName: title(recurso),
      },
    });
  }
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
  useEffect(() => {
    let active = true;
    if (actor?.type !== "colaboradoras") {
      setOwnPosts([]);
      setOwnContacts(null);
      return;
    }
    setAccountLoading(true);
    Promise.all([
      api.get("/mi/postulaciones"),
      page === "espacio"
        ? api.get(`/colaboradoras/${actor.id}/contactos`)
        : Promise.resolve(null),
    ])
      .then(([posts, contacts]) => {
        if (active) {
          setOwnPosts(posts);
          setOwnContacts(contacts);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setAccountLoading(false);
      });
    return () => {
      active = false;
    };
  }, [actor, page, data.proyectos, data.colaboraciones]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    api
      .get(`/proyectos/${idOf(selected)}/logros`)
      .then((logros) => {
        if (active) setExtras((old) => ({ ...old, logros }));
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [selected]);
  const filtraPorEtiquetas =
    ["proyectos", "colectivos"].includes(page) && filtroEtiquetas.length > 0;
  // el backend devuelve los que tienen todas las etiquetas; se vuelve a pedir si cambian los datos
  useEffect(() => {
    setIdsPorEtiquetas(null);
    if (!filtraPorEtiquetas) return;
    let active = true;
    api
      .get(`/${page}?etiquetas=${encodeURIComponent(filtroEtiquetas.join(","))}`)
      .then((result) => {
        if (active) setIdsPorEtiquetas(new Set(result.map(idOf)));
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [
    filtraPorEtiquetas,
    filtroEtiquetas,
    page,
    data.proyectos,
    data.colectivos,
  ]);
  const filtrarPorEtiqueta = (etiqueta) => {
    setQuery("");
    setFiltroEtiquetas((actuales) =>
      actuales.includes(etiqueta) || actuales.length >= MAX_ETIQUETAS
        ? actuales
        : [...actuales, etiqueta],
    );
  };
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
    .filter(
      (x) =>
        !filtraPorEtiquetas ||
        (idsPorEtiquetas
          ? idsPorEtiquetas.has(idOf(x))
          : filtroEtiquetas.every((e) => (x.etiquetas || []).includes(e))),
    )
    .filter((x) =>
      sinAcentos(
        `${title(x)} ${x.descripcion || ""} ${(x.habilidades || (x.perfiles || []).flatMap((p) => p.habilidadesRequeridas)).map(skill).join(" ")} ${textoDeEtiquetas(x.etiquetas)}`,
      ).includes(sinAcentos(query)),
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
        <nav aria-label="Navegación principal">
          {gruposMenu
            .filter((grupo) => !grupo.soloConSesion || actor)
            .map((grupo) => (
              <div
                className="nav-grupo"
                role="group"
                aria-labelledby={`nav-${grupo.id}`}
                key={grupo.id}
              >
                <p className="nav-titulo" id={`nav-${grupo.id}`}>
                  {grupo.titulo}
                </p>
                {grupo.secciones.map((k) => (
                  <a
                    href={"#" + k}
                    key={k}
                    aria-current={page === k ? "page" : undefined}
                  >
                    <span aria-hidden="true">
                      <Icono nombre={iconosMenu[k] || "documento"} />
                    </span>
                    {sections[k]}
                    {k === "mensajes" && noLeidos > 0 && (
                      <span className="contador-mensajes">
                        <span aria-hidden="true">{textoContador(noLeidos)}</span>
                        <span className="visually-hidden">{descripcionNoLeidos(noLeidos)}</span>
                      </span>
                    )}
                  </a>
                ))}
              </div>
            ))}
        </nav>
        <footer className="aside-pie">
          <b>Código a Voluntad</b>
          <small>UTN · Desarrollo de Software</small>
          <small>2026</small>
        </footer>
      </aside>
      <div className="workspace">
        <header>
          <span>Una comunidad. Muchas posibilidades.</span>
          <div className="toolbar">
            <BotonModoDaltonico />
            {sessionLoading ? (
              <span role="status">Comprobando sesión…</span>
            ) : actor ? (
              <>
                <div className="user-menu" ref={userMenuRef}>
                  <button
                    className="user-menu-trigger"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label={
                      `Abrir menú de ${title(data[actor.type].find((x) => idOf(x) === actor.id))}` +
                      (noLeidos > 0 ? ` (${descripcionNoLeidos(noLeidos)})` : "")
                    }
                    onClick={() => setUserMenuOpen((abierto) => !abierto)}
                  >
                    <span className="user-avatar" aria-hidden="true">
                      {initials(title(data[actor.type].find((x) => idOf(x) === actor.id)))}
                      {noLeidos > 0 && (
                        <span className="contador-mensajes contador-avatar">
                          {textoContador(noLeidos)}
                        </span>
                      )}
                    </span>
                    <span className="user-menu-name">
                      {title(data[actor.type].find((x) => idOf(x) === actor.id))}
                    </span>
                    <Icono nombre="abajo" />
                  </button>
                  {userMenuOpen && (
                    <div className="user-menu-panel">
                      <b>{title(data[actor.type].find((x) => idOf(x) === actor.id))}</b>
                      <small>{actor.email}</small>
                      <a href="#espacio" onClick={() => setUserMenuOpen(false)}>Mi espacio</a>
                      <a href="#mensajes" onClick={() => setUserMenuOpen(false)}>
                        Mensajes
                        {noLeidos > 0 && (
                          <span className="contador-mensajes">
                            <span aria-hidden="true">{textoContador(noLeidos)}</span>
                            <span className="visually-hidden">{descripcionNoLeidos(noLeidos)}</span>
                          </span>
                        )}
                      </a>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            await api.post("/auth/logout");
                            setActor(null);
                            setExtras({});
                            setOwnPosts([]);
                            setOwnContacts(null);
                            setUserMenuOpen(false);
                            window.location.hash = "proyectos";
                          }, "Sesión cerrada.")
                        }
                      >
                        <Icono nombre="salir" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                className="secondary"
                onClick={() =>
                  setForm({ name: "Acceder a Código a Voluntad", auth: true })
                }
              >
                <Icono nombre="entrar" />
                Iniciar sesión / Registrarme
              </button>
            )}
          </div>
        </header>
        <main id="main">
          <div className="breadcrumb">
            Comunidad / {sections[page] || "Proyectos"}
            {selected ? " / Detalle" : ""}
          </div>
          <div role="status" aria-live="polite">
            {(loading || busy) && (
              <p className="loading">
                {page === "mensajes" ? "Cargando mensajes…" : "Cargando información…"}
              </p>
            )}
          </div>
          <AvisoFlotante mensaje={notice} onCerrar={() => setNotice("")} />
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
                <Icono nombre="recargar" />
                Reintentar carga
              </button>
            </div>
          )}
          {!Object.keys(sections).includes(page) ? (
            <section className="empty">
              <h1>Página no encontrada</h1>
              <a href="#proyectos">Volver a explorar proyectos</a>
            </section>
          ) : page === "terminos" ? (
            <Terminos />
          ) : page === "habilidades" ? (
            <CatalogoHabilidades skills={data.habilidades} onSaved={refresh} />
          ) : page === "denuncias" && !actor ? (
            <section className="empty">
              <h1>Administrar denuncias</h1>
              <p>Iniciá sesión para abrir la sección administrativa.</p>
              <button
                onClick={() =>
                  setForm({ name: "Iniciar sesión", auth: true })
                }
              >
                <Icono nombre="entrar" />
                Iniciar sesión
              </button>
            </section>
          ) : page === "denuncias" ? (
            <DenunciasAdmin />
          ) : ["espacio", "mensajes"].includes(page) && !actor ? (
            <section className="empty">
              <h1>{sections[page]}</h1>
              <p>
                Iniciá sesión para ver tus proyectos, postulaciones y mensajes.
              </p>
              <button
                onClick={() =>
                  setForm({ name: "Acceder a Código a Voluntad", auth: true })
                }
              >
                <Icono nombre="entrar" />
                Iniciar sesión
              </button>
            </section>
          ) : publicProfile ? (
            <PublicProfile
              profile={publicProfile}
              type={page}
              skillName={skill}
              onClose={() => setPublicProfile(null)}
              onEtiqueta={
                page === "colectivos"
                  ? (e) => {
                      setPublicProfile(null);
                      filtrarPorEtiqueta(e);
                    }
                  : undefined
              }
              onContacts={(profile) =>
                actor
                  ? load(
                      "contactos",
                      `/colaboradoras/${idOf(profile)}/contactos`,
                    )
                  : setForm({
                      name: "Iniciar sesión para consultar contactos",
                      auth: true,
                    })
              }
            />
          ) : selected ? (
            <>
              <button
                className="text-button"
                onClick={() => {
                  setSelected(null);
                  setExtras({});
                }}
              >
                <Icono nombre="volver" />
                Volver al listado
              </button>
              <p className="eyebrow">PROYECTO DE LA COMUNIDAD</p>
              <h1>{selected.titulo}</h1>
              <p>
                {
                  data.colectivos.find((c) => idOf(c) === selected.colectivoId)
                    ?.nombre
                }{" "}
                · <EstadoBadge estado={selected.estado} />
              </p>
              {selected.fechaCierre && (
                <p className="hint">
                  Fecha de cierre programada:{" "}
                  <time dateTime={selected.fechaCierre}>
                    {new Date(selected.fechaCierre).toLocaleString("es-AR")}
                  </time>
                  {" "}(hora local)
                </p>
              )}
              <Markdown className="description">
                {selected.descripcion}
              </Markdown>
              <ListaEtiquetas
                etiquetas={selected.etiquetas}
                alElegir={
                  page === "proyectos"
                    ? (e) => {
                        setSelected(null);
                        setExtras({});
                        filtrarPorEtiqueta(e);
                      }
                    : undefined
                }
              />
              {!isOwner && actor?.type !== "colectivos" && (
                <button
                  className="secondary"
                  onClick={() => iniciarDenuncia("proyecto", selected)}
                >
                  <Icono nombre="bandera" />
                  Denunciar proyecto
                </button>
              )}
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
                    <Icono nombre="editar" />
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
                    <Icono nombre="eliminar" />
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
                    <Icono nombre="mas" />
                    Agregar perfil
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
                    <Icono nombre={selected.estaBuscando ? "pausa" : "reanudar"} />
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
                    <Icono nombre="finalizar" />
                    Finalizar proyecto
                  </button>
                </div>
              )}
              <h2>
                Perfiles que hacen falta{" "}
                <span className="count">{selected.perfiles?.length || 0}</span>
              </h2>
              {!selected.perfiles?.length && (
                <p className="empty">
                  Este proyecto todavía no tiene perfiles publicados.
                </p>
              )}
              <div className="grid">
                {(selected.perfiles || []).map((p) => (
                  <article className="card padded" key={idOf(p)}>
                    <EstadoBadge
                      estado={
                        selected.estaBuscando && selected.estado === "ACTIVO"
                          ? "BUSCANDO"
                          : "BUSQUEDA_CERRADA"
                      }
                    />
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
                      <b>Ocupantes:</b>{" "}
                      {data.colaboraciones
                        .filter(
                          (c) =>
                            c.proyectoId === pid &&
                            c.perfilId === idOf(p) &&
                            c.estado === "ACTIVA",
                        )
                        .map((c) =>
                          c.colaboradoraId === "Anonimo"
                            ? "Contribución anónima"
                            : title(
                                data.colaboradoras.find(
                                  (x) => idOf(x) === c.colaboradoraId,
                                ),
                              ),
                        )
                        .join(", ") ||
                        "Todavía no hay colaboraciones aceptadas"}
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
                          selected.estado !== "ACTIVO" ||
                          (p.fechaLimite &&
                            new Date(p.fechaLimite) < new Date()) ||
                          !p.habilidadesRequeridas.some((h) =>
                            person?.habilidades.includes(h),
                          ) ||
                          ownPosts.some(
                            (post) =>
                              post.proyectoId === pid &&
                              post.perfilId === idOf(p),
                          ) ||
                          (p.cantidadLimite != null &&
                            data.colaboraciones.filter(
                              (c) =>
                                c.proyectoId === pid &&
                                c.perfilId === idOf(p) &&
                                c.estado === "ACTIVA",
                            ).length >= p.cantidadLimite)
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
                        <Icono
                          nombre={
                            ownPosts.some(
                              (post) =>
                                post.proyectoId === pid &&
                                post.perfilId === idOf(p),
                            )
                              ? "check"
                              : "enviar"
                          }
                        />
                        {ownPosts.some(
                          (post) =>
                            post.proyectoId === pid &&
                            post.perfilId === idOf(p),
                        )
                          ? "Ya te postulaste"
                          : "Postularme"}
                      </button>
                    )}
                    {actor?.type === "colaboradoras" &&
                      !p.habilidadesRequeridas.some((h) =>
                        person?.habilidades.includes(h),
                      ) && (
                        <p className="hint">
                          Necesitás registrar al menos una de las habilidades
                          requeridas para este perfil.
                        </p>
                      )}
                    {actor?.type === "colaboradoras" &&
                      (!selected.estaBuscando || selected.estado !== "ACTIVO") && (
                        <p className="hint">Este proyecto ya no está recibiendo postulaciones.</p>
                      )}
                    {actor?.type === "colaboradoras" &&
                      p.cantidadLimite != null &&
                      data.colaboraciones.filter(
                        (c) =>
                          c.proyectoId === pid &&
                          c.perfilId === idOf(p) &&
                          c.estado === "ACTIVA",
                      ).length >= p.cantidadLimite && (
                        <p className="hint">Este perfil ya completó sus vacantes.</p>
                      )}
                    {p.fechaLimite && new Date(p.fechaLimite) < new Date() && (
                      <p className="hint">La fecha de postulación ya venció.</p>
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
                          <Icono nombre="buscar" />
                          Buscar colaboradoras
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            edit(
                              "Editar perfil",
                              profileFields(data.habilidades),
                              `/proyectos/${pid}/perfiles/${idOf(p)}`,
                              "put",
                              p,
                            )
                          }
                        >
                          <Icono nombre="editar" />
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
                          <Icono nombre="eliminar" />
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
                        <Icono nombre="enviar" />
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
                      <Icono nombre="ver" />
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
                        <Icono nombre="logro" />
                        Publicar logro
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
                                ? "Ver sistema"
                                : "Código fuente"}
                              <Icono nombre="externo" />
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
                            <Icono nombre="editar" />
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
                            <Icono nombre="eliminar" />
                            Eliminar
                          </button>
                        </>
                      )}
                      {(isOwner || participaEnProyecto(pid)) && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() =>
                            run(
                              () =>
                                api.post("/integraciones/linkedin/publicar-logro", {
                                  proyectoId: pid,
                                  logroId: idOf(l),
                                }),
                              "Logro compartido en LinkedIn.",
                            )
                          }
                        >
                          <Icono nombre="compartir" />
                          Compartir en LinkedIn
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
              <TareasProyecto
                pid={pid}
                proyecto={selected}
                isOwner={isOwner}
                colaboradoras={data.colaboradoras}
                colaboraciones={data.colaboraciones.filter(
                  (c) => c.proyectoId === pid,
                )}
                edit={edit}
                run={run}
                busy={busy}
              />
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
                      <Icono nombre="reloj" />
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
                      <Icono nombre="check-doble" />
                      Procesadas
                    </button>
                  </div>
                  {extras.postulaciones?.length === 0 && (
                    <p>No hay postulaciones.</p>
                  )}
                  {extras.postulaciones?.map((p) => (
                    <div className="list-row" key={idOf(p)}>
                      <b>
                        Postulación · <EstadoBadge estado={p.estado} />
                      </b>
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
                              <Icono nombre={estado === "ACEPTADA" ? "check" : "cruz"} />
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
                {!data.colaboraciones.some((c) => c.proyectoId === pid) && (
                  <p>Aún no hay colaboraciones aceptadas.</p>
                )}
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
                      <div className="toolbar">
                        {isOwner && c.colaboradoraId !== "Anonimo" && (
                          <button
                            className="secondary"
                            onClick={() =>
                              load(
                                "contactos",
                                `/colaboradoras/${c.colaboradoraId}/contactos`,
                              )
                            }
                          >
                            <Icono nombre="correo" />
                            Consultar contactos
                          </button>
                        )}
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
                            <Icono nombre="persona-baja" />
                            Dar de baja permanentemente
                          </button>
                        )}
                      </div>
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
                    <Icono nombre="mas" />
                    Crear proyecto
                  </button>
                )}
                {["colectivos", "colaboradoras"].includes(page) && (
                  <button
                    onClick={() =>
                      setForm({
                        name: "Crear cuenta",
                        auth: true,
                        initialMode: "registro",
                        initialType: page,
                      })
                    }
                  >
                    <Icono nombre="persona-mas" />
                    Registrarme
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
                    <a href="#colectivos">
                      Conocé a los colectivos
                      <Icono nombre="ir" />
                    </a>
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
                actor?.type === "colaboradoras" ? (
                  <BandejaMensajes
                    actorId={actor.id}
                    cantidadNoLeidos={noLeidos}
                    onLeidos={marcarLeidos}
                    colectivos={data.colectivos}
                    proyectos={data.proyectos}
                  />
                ) : (
                  <section className="panel">
                    <h2>Tu bandeja de entrada</h2>
                    <p>
                      Las cuentas de colectivos envían mensajes desde la
                      búsqueda de colaboradoras de cada perfil. La bandeja de
                      recepción corresponde a las cuentas colaboradoras.
                    </p>
                  </section>
                )
              ) : (
                <>
                  {page === "espacio" && (
                    <section className="panel">
                      <h2>Mi perfil y mis proyectos</h2>
                      {accountLoading && (
                        <p role="status">Actualizando tus datos…</p>
                      )}
                      <p>Correo de acceso: {actor?.email}</p>
                      <LinkedInIntegration
                        actorType={actor?.type}
                        onImported={refresh}
                      />
                      <PortabilidadDatos actorType={actor?.type} />
                      {person && (
                        <ExperienciaHabilidades
                          person={person}
                          skills={data.habilidades}
                          busy={busy}
                          onSave={(experienciaHabilidades) =>
                            run(
                              () =>
                                api.put(
                                  `/colaboradoras/${actor.id}/experiencia-habilidades`,
                                  { experienciaHabilidades },
                                ),
                              "Experiencia por habilidad actualizada.",
                            )
                          }
                        />
                      )}
                      {actor?.type === "colaboradoras" && (
                        <>
                          <h3>Mis datos de contacto privados</h3>
                          {ownContacts === null ? (
                            <p>Cargando contactos…</p>
                          ) : ownContacts.length ? (
                            ownContacts.map((c) => (
                              <div className="list-row" key={c.tipo + c.valor}>
                                <p>
                                  {c.tipo}: {c.valor}
                                </p>
                                <div className="toolbar">
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() =>
                                      setForm({
                                        name: "Editar contacto",
                                        path: `/colaboradoras/${actor.id}/medios-contacto`,
                                        method: "put",
                                        initial: c,
                                        fields: [
                                          {
                                            name: "tipo",
                                            label: "Tipo",
                                            type: "select",
                                            required: true,
                                            options: [
                                              "EMAIL",
                                              "WHATSAPP",
                                              "SMS",
                                            ],
                                          },
                                          {
                                            name: "valor",
                                            label: "Contacto",
                                            type: "text",
                                            required: true,
                                          },
                                        ],
                                        transform: (values) => ({
                                          mediosContacto: ownContacts.map(
                                            (m) =>
                                              m.tipo === c.tipo &&
                                              m.valor === c.valor
                                                ? values
                                                : m,
                                          ),
                                        }),
                                      })
                                    }
                                  >
                                    <Icono nombre="editar" />
                                    Editar contacto
                                  </button>
                                  <button
                                    className="danger"
                                    disabled={busy}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "¿Quitar este medio de contacto?",
                                        )
                                      )
                                        run(() =>
                                          api.put(
                                            `/colaboradoras/${actor.id}/medios-contacto`,
                                            {
                                              mediosContacto:
                                                ownContacts.filter(
                                                  (m) =>
                                                    m.tipo !== c.tipo ||
                                                    m.valor !== c.valor,
                                                ),
                                            },
                                          ),
                                        );
                                    }}
                                  >
                                    <Icono nombre="eliminar" />
                                    Quitar contacto
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p>Todavía no agregaste contactos.</p>
                          )}
                          <h3>Mis postulaciones</h3>
                          {!ownPosts.length ? (
                            <p>Todavía no realizaste postulaciones.</p>
                          ) : (
                            ownPosts.map((p) => (
                              <div className="list-row" key={idOf(p)}>
                                <b>
                                  {data.proyectos.find(
                                    (x) => idOf(x) === p.proyectoId,
                                  )?.titulo || "Proyecto no disponible"}
                                </b>
                                <p>
                                  {p.estado}{" "}
                                  {p.anonimidad
                                    ? "· Contribución pública anónima"
                                    : ""}
                                </p>
                                {data.proyectos.some(
                                  (x) => idOf(x) === p.proyectoId,
                                ) && (
                                  <button
                                    className="text-button"
                                    onClick={() => {
                                      setSelected(
                                        data.proyectos.find(
                                          (x) => idOf(x) === p.proyectoId,
                                        ),
                                      );
                                      setExtras({});
                                    }}
                                  >
                                    Ver proyecto
                                    <Icono nombre="ir" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </>
                      )}
                      <p>
                        Administrá tus datos y seguí tus colaboraciones desde tu
                        cuenta.
                      </p>
                      <div className="toolbar">
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
                            <Icono nombre="editar" />
                            Editar mis datos
                          </button>
                        )}
                        {person && (
                          <>
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
                              <Icono nombre="mas" />
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
                              <Icono nombre="mas" />
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
                              <Icono nombre="correo" />
                              {person.aceptaMensajeria ? "Desactivar" : "Activar"}{" "}
                              mensajes de colectivos
                            </button>
                          </>
                        )}
                        {actor?.type === "colectivos" && (
                          <button
                            className="danger"
                            disabled={busy}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "¿Eliminar la cuenta del colectivo? No podrás volver a iniciar sesión. Se conservará el historial, se quitará la ubicación de contacto, se cerrarán las búsquedas y se rechazarán las postulaciones pendientes. Si querés conservar una copia, descargá antes tus datos desde «Tus datos».",
                                )
                              )
                                run(async () => {
                                  await api.delete(`/colectivos/${actor.id}/cuenta`);
                                  setActor(null);
                                  setOwnPosts([]);
                                  setOwnContacts(null);
                                  window.location.hash = "proyectos";
                                }, "Cuenta eliminada. El historial del colectivo se conserva.");
                            }}
                          >
                            <Icono nombre="eliminar" />
                            Eliminar cuenta del colectivo
                          </button>
                        )}
                        {actor?.type === "colaboradoras" && (
                          <button
                            className="danger"
                            disabled={busy}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  "¿Eliminar tu cuenta permanentemente? Se borrarán tus datos personales, contactos y credenciales. Tus participaciones conservarán el historial como Persona eliminada y tus postulaciones pendientes serán rechazadas. Esta acción no se puede deshacer. Si querés conservar una copia, descargá antes tus datos desde «Tus datos».",
                                )
                              ) {
                                return;
                              }
  
                              run(async () => {
                                await api.delete(
                                  `/colaboradoras/${actor.id}/cuenta`,
                                );
  
                                setActor(null);
                                setExtras({});
                                setOwnPosts([]);
                                setOwnContacts(null);
                                setPublicProfile(null);
                                setMatches(null);
                                setSelected(null);
                                setForm(null);
                                setData(initial);
                                window.location.hash = "proyectos";
                              }, "Cuenta eliminada. Tus participaciones conservan el historial sin tus datos personales.");
                            }}
                          >
                            <Icono nombre="eliminar" />
                            Eliminar mi cuenta
                          </button>
                        )}
                      </div>
                    </section>
                  )}
                  <div className="filters">
                    <label className="search">
                      <Icono nombre="buscar" />
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
                            <Icono nombre="codigo" />
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
                  {filtraPorEtiquetas && (
                    <div
                      className="filtro-etiquetas"
                      role="group"
                      aria-label="Filtro por etiquetas"
                    >
                      <span>Con las etiquetas:</span>
                      <ul className="etiquetas">
                        {filtroEtiquetas.map((e) => (
                          <li key={e}>
                            <span>#{e}</span>
                            <button
                              type="button"
                              className="etiqueta-quitar"
                              aria-label={`Quitar etiqueta ${e} del filtro`}
                              onClick={() =>
                                setFiltroEtiquetas((actuales) =>
                                  actuales.filter((x) => x !== e),
                                )
                              }
                            >
                              <Icono nombre="cruz" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setFiltroEtiquetas([])}
                      >
                        <Icono nombre="cruz" />
                        Limpiar etiquetas
                      </button>
                    </div>
                  )}
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
                          {x.titulo ? (
                            <EstadoBadge
                              estado={
                                x.estaBuscando && x.estado === "ACTIVO"
                                  ? "BUSCANDO"
                                  : "BUSQUEDA_CERRADA"
                              }
                            />
                          ) : (
                            <span className="badge">
                              {x.tipo?.replaceAll("_", " ") || "Colaboradora"}
                            </span>
                          )}
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
                          <ListaEtiquetas
                            etiquetas={x.etiquetas}
                            alElegir={
                              ["proyectos", "colectivos"].includes(page)
                                ? filtrarPorEtiqueta
                                : undefined
                            }
                          />
                          <footer>
                            <small>
                              {x.titulo
                                ? `${x.perfiles?.length || 0} ${x.perfiles?.length === 1 ? "perfil" : "perfiles"}`
                                : x.ubicacion ||
                                  x.pronombres ||
                                  "Código a Voluntad"}
                            </small>
                            {!x.titulo && (
                              <button
                                className="text-button"
                                onClick={() => {
                                  setPublicProfile(x);
                                  setExtras({});
                                }}
                              >
                                Ver perfil
                                <Icono nombre="ir" />
                              </button>
                            )}
                            {x.titulo && (
                              <button
                                className="text-button"
                                onClick={() => {
                                  setSelected(x);
                                  setExtras({});
                                }}
                              >
                                Ver proyecto
                                <Icono nombre="ir" />
                              </button>
                            )}
                          </footer>
                          {page === "proyectos" &&
                            x.colectivoId !== actor?.id &&
                            actor?.type !== "colectivos" && (
                              <button
                                className="text-button"
                                onClick={() => iniciarDenuncia("proyecto", x)}
                              >
                                <Icono nombre="bandera" />
                                Denunciar proyecto
                              </button>
                            )}
                          {page === "colectivos" &&
                            idOf(x) !== actor?.id &&
                            actor?.type !== "colectivos" && (
                            <button
                              className="text-button"
                              onClick={() => iniciarDenuncia("colectivo", x)}
                            >
                              <Icono nombre="bandera" />
                              Denunciar colectivo
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {extras.contactos && (
            <section className="panel">
              <h2>Contactos autorizados</h2>
              {extras.contactos.length ? (
                extras.contactos.map((c) => (
                  <p key={c.tipo + c.valor}>
                    {c.tipo}: {c.valor}
                  </p>
                ))
              ) : (
                <p>Esta persona no registró medios de contacto.</p>
              )}
            </section>
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
            tabIndex={-1}
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
              <Icono nombre="cruz" />
            </button>
            <h2>{form.name}</h2>
            {form.auth ? (
              <AuthPanel
                skills={data.habilidades}
                initialMode={form.initialMode}
                initialType={form.initialType}
                onCancel={() => setForm(null)}
                onSuccess={async (result) => {
                  setActor(result.actor);
                  setForm(null);
                  setExtras({});
                  await refresh();
                  setNotice("Sesión iniciada.");
                }}
              />
            ) : form.denuncia ? (
              <>
                {/* el servidor rechaza con 403 a quien no participó: el motivo se ve dentro del modal */}
                <p role="alert" className={error ? "error" : ""}>
                  {error}
                </p>
                <DenunciaForm
                  {...form.denuncia}
                  busy={busy}
                  onCancel={() => setForm(null)}
                  onSubmit={async (values) => {
                    const ok = await run(
                      () => api.post("/denuncias", values),
                      "Denuncia enviada para revisión.",
                    );
                    if (ok) setForm(null);
                  }}
                />
              </>
            ) : form.path ? (
              <>
                <p role="alert" className={error ? "error" : ""}>
                  {error}
                </p>
                <ResourceForm
                  {...form}
                  sugerenciasEtiquetas={
                    form.fields === projectFields
                      ? etiquetasEnUso(data.proyectos)
                      : form.fields === collectiveFields
                        ? etiquetasEnUso(data.colectivos)
                        : []
                  }
                  busy={busy}
                  onCancel={() => setForm(null)}
                  onSubmit={async (values) => {
                    const ok = await run(async () => {
                      await api[form.method](
                        form.path,
                        form.transform ? form.transform(values) : values,
                      );
                      if (pid) await updateSelected();
                    });
                    if (ok) setForm(null);
                  }}
                />
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
