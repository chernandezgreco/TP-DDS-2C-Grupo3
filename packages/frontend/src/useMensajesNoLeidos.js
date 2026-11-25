import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export const INTERVALO_MENSAJES_MS = 60000;

// Contador de mensajes no leídos de la colaboradora de la sesión.
// El servidor no avisa cuando llega un mensaje: el navegador pregunta (polling) al cambiar de
// sección, cada minuto mientras la pestaña está visible y al volver a la pestaña.
// En la bandeja no pregunta al entrar: la bandeja misma carga el número junto con los mensajes.
export default function useMensajesNoLeidos(actor, page) {
  const [cantidad, setCantidad] = useState(0);
  const habilitado = actor?.type === "colaboradoras";

  const refrescar = useCallback(async () => {
    if (!habilitado) return;
    try {
      const { cantidad: nueva } = await api.get("/mi/mensajes/no-leidos");
      setCantidad(nueva);
    } catch {
      // un fallo del contador no interrumpe la página: se reintenta en la próxima consulta.
      // Si la sesión venció, el interceptor de api ya avisa con "sesion-expirada".
    }
  }, [habilitado]);

  // sin sesión de colaboradora no hay contador
  useEffect(() => {
    if (!habilitado) setCantidad(0);
  }, [habilitado]);

  // al iniciar sesión y en cada cambio de sección
  useEffect(() => {
    if (page !== "mensajes") refrescar();
  }, [page, refrescar]);

  // cada minuto con la pestaña visible, y enseguida al volver a ella
  useEffect(() => {
    if (!habilitado) return undefined;
    const intervalo = setInterval(() => {
      if (!document.hidden) refrescar();
    }, INTERVALO_MENSAJES_MS);
    const alVolver = () => {
      if (!document.hidden) refrescar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [habilitado, refrescar]);

  const marcarLeidos = useCallback(() => setCantidad(0), []);

  return { cantidad, marcarLeidos };
}

// el número del círculo: más de 9 se muestra como 9+
export const textoContador = (cantidad) => (cantidad > 9 ? "9+" : String(cantidad));

export const descripcionNoLeidos = (cantidad) =>
  cantidad === 1 ? "1 mensaje sin leer" : `${cantidad} mensajes sin leer`;
