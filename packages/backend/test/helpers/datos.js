import { Perfil } from "../../src/domain/Perfil/Perfil.js";
import { Compromiso } from "../../src/domain/Compromiso/Compromiso.js";
import { ModalidadColaboracion } from "../../src/domain/ModalidadColaboracion/ModalidadColaboracion.js";
import { Colaboradora } from "../../src/domain/Colaboradora/Colaboradora.js";

// datos de un perfil tal como llegan en el body de una request
export const datosPerfil = (extra = {}) => ({
    descripcionPerfil: "Frontend",
    habilidadesRequeridas: ["react"],
    habilidadesOpcionales: ["javascript"],
    compromiso: { cantidadHoras: 5, tipo: "SEMANALES" },
    modalidad: { gratuita: true, incentivoEconomico: false, contratacionEventual: false },
    ...extra,
});

export const unPerfil = (id = "perfil-1", requeridas = ["react"], opcionales = ["javascript"]) =>
    new Perfil(id, "Frontend", requeridas, opcionales, new Compromiso(5, "SEMANALES"), new ModalidadColaboracion(true, false, false));

export const unaColaboradora = (habilidades, id = "colaboradora-1") =>
    new Colaboradora(id, "Ana", "github.com/ana", "Ana Pérez", habilidades, "ella", "hola");
