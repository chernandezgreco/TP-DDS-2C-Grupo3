import { Router } from "express";
import { ProyectoService } from '../services/ProyectoService.js'; 
import { PerfilesService } from '../services/PerfilesService.js'; 

const router = Router();

router.post('/:proyectoId/crearPerfil', (req, res) => {
  try {
    const { proyectoId } = req.params;
    const datosPerfil = req.body;

    const nuevoPerfil = PerfilesService.agregarPerfilAProyecto(proyectoId, datosPerfil);
    
    return res.status(201).json({
      mensaje: 'Perfil agregado exitosamente',
      perfil: nuevoPerfil
    });
  } catch (error) {
    return res.status(400).json({ 
      error: error.message 
    });
  }
});


router.put('/:proyectoId/perfiles/:perfilId', (req, res) => {
  try {
    const { proyectoId, perfilId } = req.params;
    const datosActualizados = req.body;

    const perfilActualizado = ProyectoService.actualizarPerfil(proyectoId, perfilId, datosActualizados);
    
    return res.json({
      mensaje: 'Perfil actualizado exitosamente',
      perfil: perfilActualizado
    });
  } catch (error) {
    return res.status(400).json({ 
      error: error.message 
    });
  }
});

router.delete('/:proyectoId/perfiles/:perfilId', (req, res) => {
  try {
    const { proyectoId, perfilId } = req.params;
    const resultado = ProyectoService.eliminarPerfil(proyectoId, perfilId);
    
    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({ 
      error: error.message 
    });
  }
});

export default router;