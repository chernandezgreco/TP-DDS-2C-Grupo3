import { resumirEnvioNotificacion } from "./resultadoNotificacion";

test.each([undefined, {}, { mediosUsados: [] }, { mediosUsados: ["WHATSAPP"] }])(
  "confirma el mensaje cuando no hay canales fallidos ni simulados (%j)",
  (resultado) => {
    expect(resumirEnvioNotificacion(resultado)).toEqual({
      mensaje: "Mensaje enviado.",
      tipo: "exito",
    });
  },
);

test("distingue un fallo externo del mensaje interno guardado", () => {
  expect(resumirEnvioNotificacion({ mediosFallidos: ["WHATSAPP"] })).toEqual({
    mensaje: "Mensaje guardado en la bandeja interna. No se pudo enviar por WhatsApp.",
    tipo: "advertencia",
  });
});

test("aclara cuándo un canal solamente fue simulado", () => {
  expect(
    resumirEnvioNotificacion({ mediosUsados: ["SMS"], mediosSimulados: ["SMS"] }),
  ).toEqual({
    mensaje: "Mensaje guardado en la bandeja interna. Envío simulado por SMS; no se realizó un envío real por esos canales.",
    tipo: "advertencia",
  });
});

test("explica juntos los canales solicitados, fallidos y simulados sin repetirlos", () => {
  expect(
    resumirEnvioNotificacion({
      mediosUsados: ["EMAIL", "EMAIL", "SMS"],
      mediosSimulados: ["SMS", "SMS"],
      mediosFallidos: ["WHATSAPP", "WHATSAPP"],
    }),
  ).toEqual({
    mensaje: "Mensaje guardado en la bandeja interna. Se solicitó el envío externo por email. No se pudo enviar por WhatsApp. Envío simulado por SMS; no se realizó un envío real por esos canales.",
    tipo: "advertencia",
  });
});
