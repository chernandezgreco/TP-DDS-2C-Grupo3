import { EstadoColaboracion } from "../domain/Colaboracion/EstadoColaboracion.js";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import {
  ColaboracionModel,
  ColaboradoraModel,
  ProyectoModel,
} from "../models/indexModel.js";
import {
  LinkedInConnectionModel,
  LinkedInOAuthStateModel,
} from "../models/LinkedInModel.js";
import {
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnavailableError,
} from "../domain/errores.js";

const stateDigest = (state) => createHash("sha256").update(state).digest("hex");
const scopes = ["openid", "profile", "email", "w_member_social"];
const frontUrl = () => process.env.PUBLIC_APP_URL || "http://localhost:3000";

function config() {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI } = process.env;
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_REDIRECT_URI)
    throw new UnavailableError(
      "La integración con LinkedIn requiere LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET y LINKEDIN_REDIRECT_URI en el backend.",
    );
  return { clientId: LINKEDIN_CLIENT_ID, clientSecret: LINKEDIN_CLIENT_SECRET, redirectUri: LINKEDIN_REDIRECT_URI };
}

function encryptionKey() {
  const key = Buffer.from(process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32)
    throw new UnavailableError(
      "Configurá LINKEDIN_TOKEN_ENCRYPTION_KEY como una clave Base64 de 32 bytes.",
    );
  return key;
}

function encryptToken(token) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    tokenCifrado: encrypted.toString("base64"),
    tokenIv: iv.toString("base64"),
    tokenTag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptToken(connection) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(connection.tokenIv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(connection.tokenTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(connection.tokenCifrado, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function linkedinErrorMessage(response) {
  const body = await readJson(response);
  const details = body.message || body.error_description || body.error;
  return details
    ? `LinkedIn rechazó la solicitud: ${details}`
    : `LinkedIn rechazó la solicitud (HTTP ${response.status}). Verificá los permisos habilitados para la aplicación.`;
}

export class LinkedInService {
  static async crearUrlAutorizacion(cuentaId) {
    const { clientId, redirectUri } = config();
    const state = randomBytes(32).toString("base64url");
    await LinkedInOAuthStateModel.create({
      stateHash: stateDigest(state),
      cuentaId,
      expira: new Date(Date.now() + 10 * 60 * 1000),
    });
    const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: scopes.join(" "),
    });
    return url.toString();
  }

  static async completarAutorizacion(code, state) {
    if (!code || !state) throw new DomainError("LinkedIn devolvió una autorización incompleta.");
    const { clientId, clientSecret, redirectUri } = config();
    const pending = await LinkedInOAuthStateModel.findOneAndDelete({
      stateHash: stateDigest(state),
      expira: { $gt: new Date() },
    });
    if (!pending) throw new DomainError("La autorización de LinkedIn venció o no es válida. Volvé a conectar la cuenta.");

    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!tokenResponse.ok) throw new DomainError(await linkedinErrorMessage(tokenResponse));
    const tokenData = await readJson(tokenResponse);
    if (!tokenData.access_token || !Number.isFinite(Number(tokenData.expires_in)))
      throw new DomainError("LinkedIn no devolvió un token de acceso válido.");

    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileResponse.ok) throw new DomainError(await linkedinErrorMessage(profileResponse));
    const profile = await readJson(profileResponse);
    if (!profile.sub) throw new DomainError("LinkedIn no devolvió el identificador del perfil.");

    const token = encryptToken(tokenData.access_token);
    await LinkedInConnectionModel.findOneAndUpdate(
      { cuentaId: pending.cuentaId },
      {
        $set: {
          cuentaId: pending.cuentaId,
          memberId: profile.sub,
          nombre: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" "),
          nombrePila: profile.given_name || "",
          apellido: profile.family_name || "",
          foto: typeof profile.picture === "string" && profile.picture.startsWith("https://") ? profile.picture : "",
          ...token,
          tokenExpira: new Date(Date.now() + Number(tokenData.expires_in) * 1000),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    return { cuentaId: pending.cuentaId };
  }

  static async estado(cuentaId) {
    const connection = await LinkedInConnectionModel.findOne({ cuentaId }).lean();
    return connection
      ? {
          connected: true,
          nombre: connection.nombre,
          foto: connection.foto,
          expira: connection.tokenExpira,
        }
      : { connected: false };
  }

  static async desconectar(cuentaId) {
    await Promise.all([
      LinkedInConnectionModel.deleteOne({ cuentaId }),
      LinkedInOAuthStateModel.deleteMany({ cuentaId }),
    ]);
  }

  static async importarPerfil(cuentaId, actor) {
    if (actor.type !== "colaboradoras")
      throw new ForbiddenError("La importación de perfil está disponible para personas colaboradoras.");
    const connection = await LinkedInConnectionModel.findOne({ cuentaId });
    if (!connection) throw new DomainError("Conectá LinkedIn antes de importar el perfil.");
    const nombre = connection.nombre.trim();
    const actualizacion = {
      nombreFantasia: nombre || "Perfil de LinkedIn",
      nombreApellido:
        [connection.nombrePila, connection.apellido].filter(Boolean).join(" ") || nombre,
      linkedinFoto: connection.foto,
    };
    const profile = await ColaboradoraModel.findByIdAndUpdate(
      actor.id,
      { $set: actualizacion },
      { new: true, runValidators: true },
    );
    if (!profile) throw new NotFoundError("No se encontró el perfil colaborador.");
    return {
      id: profile.id,
      nombreFantasia: profile.nombreFantasia,
      nombreApellido: profile.nombreApellido,
      linkedinFoto: profile.linkedinFoto,
    };
  }

  static async publicarLogro(cuentaId, actor, { proyectoId, logroId }) {
    const connection = await LinkedInConnectionModel.findOne({ cuentaId }).select(
      "+tokenCifrado +tokenIv +tokenTag",
    );
    if (!connection) throw new DomainError("Conectá LinkedIn antes de publicar.");
    if (connection.tokenExpira <= new Date())
      throw new DomainError("La autorización de LinkedIn venció. Volvé a conectar la cuenta.");
    const proyecto = await ProyectoModel.findById(proyectoId);
    if (!proyecto) throw new NotFoundError("Proyecto no encontrado.");
    if (actor.type === "colectivos" && proyecto.colectivoId !== actor.id)
      throw new ForbiddenError("Sólo el colectivo propietario puede compartir este logro.");
    if (actor.type === "colaboradoras") {
      const participacion = await ColaboracionModel.exists({
        proyectoId,
        colaboradoraId: actor.id,
        estado: EstadoColaboracion.ACTIVA,
      });
      if (!participacion)
        throw new ForbiddenError("Sólo podés compartir logros de proyectos en los que colaborás.");
    }
    // los logros guardados antes de persistir `id` sólo tienen `_id`
    const logro = proyecto.logros.find(
      (item) => (item.id || item._id?.toString()) === logroId,
    );
    if (!logro) throw new NotFoundError("Logro no encontrado.");

    const apiVersion = process.env.LINKEDIN_API_VERSION || "202610";
    if (!/^\d{6}$/.test(apiVersion))
      throw new UnavailableError("LINKEDIN_API_VERSION debe tener el formato AAAAMM.");
    const token = decryptToken(connection);
    const cleanDescription = String(logro.descripcion)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 ($2)")
      .replace(/[>*_`#]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const appLink = new URL(frontUrl());
    appLink.hash = `proyectos/${encodeURIComponent(proyecto.id)}`;
    const appUrl = appLink.toString();
    const commentary = `Nuevo logro en ${proyecto.titulo}: ${cleanDescription} (${logro.porcentajeCompletitud}% completado). ${appUrl}`.slice(0, 2900);
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": apiVersion,
      },
      body: JSON.stringify({
        author: `urn:li:person:${connection.memberId}`,
        commentary,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!response.ok) throw new DomainError(await linkedinErrorMessage(response));
    return { publicado: true, id: response.headers.get("x-restli-id") || null };
  }
}
