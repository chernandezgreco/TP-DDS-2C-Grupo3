import { v4 as uuidv4 } from "uuid";
import { ProyectoService, crearPerfil } from "./ProyectoService.js";
import { ColaboradoraService } from "./ColaboradoraService.js";
import { HabilidadService } from "./HabilidadService.js";

export class PerfilesService {
    static async listar(proyectoId) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);
        return proyecto.perfiles;
    }

    static async obtener(proyectoId, perfilId) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);
        return proyecto.obtenerPerfil(perfilId);
    }

    static async crear(proyectoId, datos) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);

        const perfil = crearPerfil(uuidv4(), datos);
        await HabilidadService.validarExistentes(perfil.todasLasHabilidades());

        proyecto.agregarPerfil(perfil);
        await ProyectoService.guardar(proyecto);

        return perfil;
    }

    static async actualizar(proyectoId, perfilId, datosActualizados) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);

        const perfil = proyecto.actualizarPerfil(perfilId, datosActualizados);
        await HabilidadService.validarExistentes(perfil.todasLasHabilidades());
        await ProyectoService.guardar(proyecto);

        return perfil;
    }

    static async eliminar(proyectoId, perfilId) {
        const proyecto = await ProyectoService.obtenerPorId(proyectoId);

        const perfil = proyecto.eliminarPerfil(perfilId);
        await ProyectoService.guardar(proyecto);

        return perfil;
    }

    // colaboradoras con al menos una habilidad requerida, ordenadas por cuántas habilidades del perfil tienen
    static async buscarColaboradorasPotenciales(proyectoId, perfilId) {
        const perfil = await this.obtener(proyectoId, perfilId);

        const candidatas = await ColaboradoraService.buscarPorHabilidades(perfil.habilidadesRequeridas);

        return candidatas
            .filter((colaboradora) => perfil.admiteA(colaboradora))
            .sort((a, b) => perfil.afinidadCon(b) - perfil.afinidadCon(a));
    }
}
