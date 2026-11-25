const INTERVALO_MS = 10 * 60 * 1000;

// Render gratis apaga el servicio a los 15 min sin pedidos; con uno cada 10 min nunca se duerme
export const iniciarMantenerDespierto = ({
    url = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL,
    intervaloMs = INTERVALO_MS,
    hacerPedido = fetch,
} = {}) => {
    // en local no hay url publica, asi que no hace nada
    if (!url) {
        return () => {};
    }

    const pinguear = async () => {
        try {
            await hacerPedido(`${url}/health`, { signal: AbortSignal.timeout(10000) });
        } catch (error) {
            console.error("No se pudo pinguear el servidor:", error.message);
        }
    };

    const temporizador = setInterval(pinguear, intervaloMs);
    temporizador.unref();

    return () => clearInterval(temporizador);
};
