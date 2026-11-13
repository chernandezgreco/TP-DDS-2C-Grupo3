// Serializa decisiones del mismo perfil en el servidor único del TP.
// Al escalar a varios procesos debe reemplazarse por transacciones/reservas compartidas.
const pendientes = new Map();
export async function serializar(clave, operacion) {
  const anterior = pendientes.get(clave) || Promise.resolve();
  let liberar;
  const turno = new Promise((resolve) => {
    liberar = resolve;
  });
  pendientes.set(clave, turno);
  await anterior;
  try {
    return await operacion();
  } finally {
    liberar();
    if (pendientes.get(clave) === turno) pendientes.delete(clave);
  }
}
