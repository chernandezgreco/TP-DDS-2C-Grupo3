export class ModalidadColaboracion {
  constructor(
    gratuita = false,
    incentivoEconomico = false,
    contratacionEventual = false,
  ) {
    const modalidades = [gratuita, incentivoEconomico, contratacionEventual];

    if (modalidades.some((modalidad) => typeof modalidad !== "boolean")) {
      throw new Error("Las modalidades de colaboración deben ser booleanas");
    }

    this.gratuita = gratuita;
    this.incentivoEconomico = incentivoEconomico;
    this.contratacionEventual = contratacionEventual;
  }
}
