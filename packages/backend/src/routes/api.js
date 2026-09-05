import { Router } from 'express';
import { habilidadService } from '../services/habilidadService.js';
import { colectivoService } from '../services/colectivoService.js';
import { colaboradoraService } from '../services/colaboradoraService.js';
import { proyectoService } from '../services/proyectoService.js';

const router = Router();

// Health Check obligatorio[cite: 1]
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Habilidades
router.post('/habilidades', (req, res) => {
    try {
        const item = habilidadService.crear(req.body);
        res.status(201).json(item);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.get('/habilidades', (req, res) => res.json(habilidadService.listar()));

// Colectivos
router.post('/colectivos', (req, res) => {
    try {
        const item = colectivoService.crear(req.body);
        res.status(201).json(item);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.get('/colectivos', (req, res) => res.json(colectivoService.listar()));

// Colaboradoras
router.post('/colaboradoras', (req, res) => {
    try {
        const item = colaboradoraService.crear(req.body);
        res.status(201).json(item);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.get('/colaboradoras', (req, res) => res.json(colaboradoraService.listar()));

// Proyectos por Colectivo
router.post('/colectivos/:id/proyectos', (req, res) => {
    try {
        const item = proyectoService.crear(req.params.id, req.body);
        res.status(201).json(item);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});
router.get('/proyectos', (req, res) => res.json(proyectoService.listar()));

// Anotación de colaboradora a proyecto (con validación de habilidades)[cite: 1]
router.post('/proyectos/:id/anotar', (req, res) => {
    try {
        const colaboracion = proyectoService.anotarColaborador(req.params.id, req.body.personaId);
        res.status(201).json(colaboracion);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Cierre manual de un proyecto[cite: 1]
router.patch('/proyectos/:id/cerrar', (req, res) => {
    try {
        const proyecto = proyectoService.cerrarProyecto(req.params.id);
        res.status(200).json(proyecto);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

export default router;