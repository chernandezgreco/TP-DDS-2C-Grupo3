import sanitizeHtml from "sanitize-html";
import { DomainError } from "../domain/errores.js";

export const sanitizarTexto = (valor) => {
    if (typeof valor !== "string") {
        return valor;
    }

    let texto = valor;

    for (let intento = 0; intento < 5; intento++) {
        let tieneEtiquetas = false;

        const limpio = sanitizeHtml(texto, {
            allowedTags: [],
            allowedAttributes: {},
            onOpenTag: () => {
                tieneEtiquetas = true;
            },
        });

        if (!tieneEtiquetas) {
            return texto;
        }

        texto = limpio
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&");
    }

    throw new DomainError(
        "El texto contiene demasiadas capas de HTML",
    );
};