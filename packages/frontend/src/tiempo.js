// "hace 5 minutos", "hace 2 días"... en español rioplatense
export const tiempoRelativo = (valor, ahora = Date.now()) => {
  const fecha = new Date(valor).getTime();
  if (!Number.isFinite(fecha)) return "Fecha desconocida";
  const diferencia = fecha - ahora;
  const unidades = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30.44, "day"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let cantidad = diferencia / 1000;
  let unidad = "second";
  for (const [limite, siguiente] of unidades) {
    if (Math.abs(cantidad) < limite) break;
    cantidad /= limite;
    unidad = siguiente;
  }
  return new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" }).format(
    Math.round(cantidad),
    unidad,
  );
};
