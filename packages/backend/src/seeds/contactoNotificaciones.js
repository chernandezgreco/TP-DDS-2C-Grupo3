// Datos iniciales de contacto y notificaciones. Solo datos, sin logica.
// Los usa db.js (memoria) y despues el script semilla general (Mongo).

export const CONTACTO_INICIAL = [
    {
        colaboradoraId: "colaboradora-1",
        aceptaMensajeria: true,
        medios: [
            { tipo: "EMAIL", valor: "ada@mail.com" },
            { tipo: "WHATSAPP", valor: "+5491157612305" },
        ],
    },
    {
        colaboradoraId: "colaboradora-2",
        aceptaMensajeria: true,
        medios: [{ tipo: "SMS", valor: "+5491144556677" }],
    },
    {
        colaboradoraId: "colaboradora-3",
        aceptaMensajeria: false,
        medios: [{ tipo: "EMAIL", valor: "lu@mail.com" }],
    },
];

export const NOTIFICACIONES_INICIALES = [
    {
        colaboradoraId: "colaboradora-1",
        colectivoId: "colectivo-1",
        proyectoId: "proyecto-1",
        texto: "Tenemos un proyecto nuevo que encaja con tus habilidades",
    },
];
