// Fechas y estados de las tareas de un proyecto.
// Una tarea dura días de calendario: llegan como "AAAA-MM-DD" y se muestran sin pasar por Date,
// así la zona horaria (Argentina es UTC-3) nunca corre un día.

export const ESTADOS_TAREA = {
  PENDIENTE: { texto: "Pendiente", icono: "○" },
  EN_CURSO: { texto: "En curso", icono: "◐" },
  FINALIZADA: { texto: "Finalizada", icono: "●" },
  CERRADA: { texto: "Cerrada con el proyecto", icono: "✕" },
};

// A qué estados puede pasar una tarea desde cada uno (el servidor aplica la misma regla). CERRADA no se elige.
const TRANSICIONES = {
  PENDIENTE: ["EN_CURSO", "FINALIZADA"],
  EN_CURSO: ["PENDIENTE", "FINALIZADA"],
  FINALIZADA: ["EN_CURSO"],
  CERRADA: [],
};
export const estadosPermitidos = (actual) => [
  actual,
  ...(TRANSICIONES[actual] || []),
];

export const MENSAJE_PROYECTO_FINALIZADO =
  "No se permite editar tareas de un proyecto finalizado";

export const RESPONSABLE_ANONIMO = "Anonimo";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// días enteros desde 1970, para comparar y restar fechas sin horarios de por medio
export const diaComoNumero = (texto) => {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return Date.UTC(anio, mes - 1, dia) / MS_POR_DIA;
};

const dosDigitos = (n) => String(n).padStart(2, "0");

// el día de hoy en el calendario de quien mira, no en UTC
export const hoyComoNumero = () => {
  const ahora = new Date();
  return (
    Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()) /
    MS_POR_DIA
  );
};

// "2026-11-02" -> "02/11/2026"
export const formatearDia = (texto) => {
  const [anio, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${anio}`;
};

// número de día -> "02/11"
export const etiquetaDia = (numero) => {
  const fecha = new Date(numero * MS_POR_DIA);
  return `${dosDigitos(fecha.getUTCDate())}/${dosDigitos(fecha.getUTCMonth() + 1)}`;
};

export const textoDuracion = (dias) => `${dias} ${dias === 1 ? "día" : "días"}`;

// El formulario trabaja con la tarea completa; al servidor se mandan sólo los campos que se pueden editar
export const tareaAPayload = (valores) => {
  const payload = {
    nombre: valores.nombre,
    descripcion: valores.descripcion || null,
    fechaInicio: valores.fechaInicio,
    fechaFin: valores.fechaFin,
    responsableId: valores.responsableId || null,
  };
  if (valores.estado) payload.estado = valores.estado;
  return payload;
};
