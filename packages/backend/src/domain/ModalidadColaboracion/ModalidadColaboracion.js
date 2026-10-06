import { DomainError } from "../errores.js";

export class ModalidadColaboracion {
  constructor(
    gratuita = false,
    incentivoEconomico = false,
    contratacionEventual = false,
  ) {
    const modalidades = [gratuita, incentivoEconomico, contratacionEventual];

    if (modalidades.some((modalidad) => typeof modalidad !== "boolean")) {
      throw new DomainError("Las modalidades de colaboración deben ser booleanas", {
        campo: "modalidad",
        valor: { gratuita, incentivoEconomico, contratacionEventual },
      });
    }

    this.gratuita = gratuita;
    this.incentivoEconomico = incentivoEconomico;
    this.contratacionEventual = contratacionEventual;
  }
}
