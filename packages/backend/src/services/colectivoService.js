import { memoryDB } from '../data/memoryDB.js';

export const colectivoService = {
    crear: (data) => {
        const nuevoColectivo = {
            id: Date.now().toString(),
            nombre: data.nombre,
            descripcion: data.descripcion,
            ubicacion: data.ubicacion || null,
            tipo: data.tipo // FUNDACION, ASOCIACION_BARRIAL, ONG, ASAMBLEA
        };
        memoryDB.colectivos.push(nuevoColectivo);
        return nuevoColectivo;
    },
    listar: () => memoryDB.colectivos,
    buscarPorId: (id) => memoryDB.colectivos.find(c => c.id === id)
};