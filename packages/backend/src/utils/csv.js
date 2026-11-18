// Generación de CSV (RFC 4180) segura para abrir en planillas de cálculo

// Una celda que empieza con estos caracteres se interpreta como fórmula (inyección CSV)
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;
const REQUIERE_COMILLAS = /[",\r\n]/;

// BOM para que Excel reconozca la codificación UTF-8 y muestre bien los acentos
const BOM = "\uFEFF";

export const escaparCeldaCsv = (valor) => {
    let texto = valor === null || valor === undefined ? "" : String(valor);
    if (INICIO_DE_FORMULA.test(texto)) {
        texto = `'${texto}`;
    }
    return REQUIERE_COMILLAS.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

export const aCsv = (encabezados, filas) =>
    BOM +
    [encabezados, ...filas]
        .map((fila) => fila.map(escaparCeldaCsv).join(","))
        .join("\r\n") +
    "\r\n";
