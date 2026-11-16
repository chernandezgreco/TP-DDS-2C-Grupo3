export const esUrlWebValida = (valor) => {
    if (typeof valor !== "string") {
        return false;
    }

    try {
        const url = new URL(valor);

        return (
            ["http:", "https:"].includes(url.protocol) &&
            url.username === "" &&
            url.password === ""
        );
    } catch {
        return false;
    }
};
export const esCuentaCodigoValida = (valor) => {
    if (typeof valor !== "string") {
        return false;
    }

    const cuenta = valor.trim();

    if (/^https?:\/\//i.test(cuenta)) {
        return esUrlWebValida(cuenta);
    }

    return /^[a-z\d_.-]+(?:\/[a-z\d_.-]+)*$/i.test(cuenta);
};
