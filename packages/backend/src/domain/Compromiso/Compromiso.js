import { TipoCompromiso } from "./TipoCompromiso.js";
import { DomainError } from "../errores.js";

export class Compromiso {
  constructor(cantidadHoras, tipo) {
    if (!Number.isInteger(cantidadHoras) || cantidadHoras <= 0) {
      throw new DomainError("La cantidad de horas debe ser un número entero positivo", {
        campo: "compromiso.cantidadHoras",
        valor: cantidadHoras,
      });
    }

    if (!Object.values(TipoCompromiso).includes(tipo)) {
      throw new DomainError("El tipo de compromiso no es válido", {
        campo: "compromiso.tipo",
        valor: tipo,
        tiposValidos: Object.values(TipoCompromiso),
      });
    }

    this.cantidadHoras = cantidadHoras;
    this.tipo = tipo;
  }
}
