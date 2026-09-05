import { memoryDB } from '../data/memoryDB.js';

export const habilidadService = {
    crear: (data) => {
        const codigoUnico = data.titulo.toLowerCase().trim().replace(/\s+/g, '_');
        if (memoryDB.habilidades.some(h => h.codigoUnico === codigoUnico)) {
            throw new Error("La habilidad ya existe");
        }
        const nuevaHabilidad = {
            id: Date.now().toString(),
            titulo: data.titulo,
            codigoUnico,
            descripcion: data.descripcion
        };
        memoryDB.habilidades.push(nuevaHabilidad);
        return nuevaHabilidad;
    },
    listar: () => memoryDB.habilidades,
    buscarPorId: (id) => memoryDB.habilidades.find(h => h.id === id)
};