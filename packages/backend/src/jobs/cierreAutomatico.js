import { ProyectoService } from "../services/ProyectoService.js";

export const iniciarCierreAutomatico = async ({
    intervaloMs = 60000,
} = {}) => {
    if (!Number.isInteger(intervaloMs) || intervaloMs < 1000) {
        throw new Error(
            "El intervalo de cierre automático debe ser de al menos 1000 ms",
        );
    }

    let enEjecucion = false;

    const revisar = async () => {
        if (enEjecucion) {
            return;
        }

        enEjecucion = true;

        try {
            const { cerrados, errores } =
                await ProyectoService.cerrarVencidos();

            if (cerrados > 0) {
                console.log(
                    `Cierre automático: ${cerrados} proyecto(s) finalizado(s).`,
                );
            }

            for (const { proyectoId, error } of errores) {
                console.error(
                    `No se pudo cerrar el proyecto ${proyectoId}:`,
                    error.message,
                );
            }
        } catch (error) {
            console.error(
                "Falló la revisión de cierres automáticos:",
                error.message,
            );
        } finally {
            enEjecucion = false;
        }
    };

    await revisar();

    const temporizador = setInterval(revisar, intervaloMs);
    temporizador.unref();

    return () => clearInterval(temporizador);
};