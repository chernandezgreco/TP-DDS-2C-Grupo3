import { PostulacionService } from "../services/PostulacionService.js";

    export class PostulacionController {
    static async listarPostulaciones(req, res, next) {
        try {
          
            const { proyectoId } = req.params;
            
            
            const postulaciones = await PostulacionService.listarPorProyecto(proyectoId);
            
           
            return res.status(200).json(postulaciones);
        } catch (error) {
            next(error);
        }
    }
    static async cambiarEstado(req, res, next) {
        try {
            const { postulacionId } = req.params;
            const { estado } = req.body; // Recibe "ACEPTADA" o "RECHAZADA"

            const resultado = await PostulacionService.cambiarEstadoPostulacion(postulacionId, estado);

            return res.status(200).json({
                mensaje: `Postulación actualizada a ${estado} exitosamente`,
                ...resultado
            });
        } catch (error) {
            next(error);
        }
    }
    
    static async listarPendientes(req, res, next) {
        try {
            const { proyectoId } = req.params;
            const postulaciones = await PostulacionService.listarPorProyectoYEstado(proyectoId, "PENDIENTE");
            return res.status(200).json(postulaciones);
        } catch (error) {
            next(error);
        }
    }

   
    static async listarProcesadas(req, res, next) {
        try {
            const { proyectoId } = req.params;
            const postulaciones = await PostulacionService.listarPorProyectoYEstado(proyectoId, ["ACEPTADA", "RECHAZADA"]);
            return res.status(200).json(postulaciones);
        } catch (error) {
            next(error);
        }
    }
}