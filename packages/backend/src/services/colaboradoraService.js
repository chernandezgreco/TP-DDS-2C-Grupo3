import { memoryDB } from '../data/memoryDB.js';

export const colaboradoraService = {
    crear: (data) => {
        const nuevaColaboradora = {
            id: Date.now().toString(),
            nombreFantasia: data.nombreFantasia,
            cuentaGithubGitlab: data.cuentaGithubGitlab,
            nombreApellido: data.nombreApellido || null,
            pronombres: data.pronombres || null,
            presentacion: data.presentacion || null,
            habilidadIds: data.habilidadIds || [] // Array de IDs de habilidades que domina
        };
        memoryDB.colaboradoras.push(nuevaColaboradora);
        return nuevaColaboradora;
    },
    listar: () => memoryDB.colaboradoras,
    buscarPorId: (id) => memoryDB.colaboradoras.find(c => c.id === id)
};