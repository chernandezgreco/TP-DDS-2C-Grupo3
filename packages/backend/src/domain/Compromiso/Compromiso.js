import { TipoCompromiso } from "./TipoCompromiso.js";

export class Compromiso {
  constructor(cantidadHoras, tipo) {
    if (!Number.isInteger(cantidadHoras) || cantidadHoras <= 0) {
      throw new Error("La cantidad de horas debe ser un número entero positivo");
    }

    if (!Object.values(TipoCompromiso).includes(tipo)) {
      throw new Error("El tipo de compromiso no es válido");
    }

    this.cantidadHoras = cantidadHoras;
    this.tipo = tipo;
  }
}
