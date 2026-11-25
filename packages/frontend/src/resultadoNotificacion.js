const nombres = { EMAIL: "email", SMS: "SMS", WHATSAPP: "WhatsApp" };
const listarMedios = (medios) =>
  [...new Set(medios)].map((medio) => nombres[medio] || medio).join(", ");

// La API confirma que guardó el mensaje interno. Un canal externo aceptado
// confirma la solicitud de envío, no la recepción en el teléfono.
export function resumirEnvioNotificacion({
  mediosUsados = [],
  mediosSimulados = [],
  mediosFallidos = [],
} = {}) {
  if (!mediosSimulados.length && !mediosFallidos.length) {
    return { mensaje: "Mensaje enviado.", tipo: "exito" };
  }

  const partes = ["Mensaje guardado en la bandeja interna."];
  const reales = mediosUsados.filter(
    (medio) => !mediosSimulados.includes(medio) && !mediosFallidos.includes(medio),
  );
  if (reales.length) {
    partes.push(`Se solicitó el envío externo por ${listarMedios(reales)}.`);
  }
  if (mediosFallidos.length) {
    partes.push(`No se pudo enviar por ${listarMedios(mediosFallidos)}.`);
  }
  if (mediosSimulados.length) {
    partes.push(
      `Envío simulado por ${listarMedios(mediosSimulados)}; no se realizó un envío real por esos canales.`,
    );
  }
  return { mensaje: partes.join(" "), tipo: "advertencia" };
}
