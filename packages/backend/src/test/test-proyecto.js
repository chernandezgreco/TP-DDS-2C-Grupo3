import { proyectoService } from '../src/services/proyectoService.js';
import { memoryDB } from '../src/data/memoryDB.js';

describe('Pruebas unitarias de Proyectos y Anotaciones', () => {
    beforeEach(() => {
        memoryDB.colectivos = [];
        memoryDB.colaboradoras = [];
        memoryDB.habilidades = [];
        memoryDB.proyectos = [];
    });

    test('Debe fallar al anotar una colaboradora que no posee ninguna habilidad requerida', () => {
        const proyecto = proyectoService.crear('1', {
            titulo: 'App Solidaria',
            descripcion: 'Test',
            habilidadIds: ['hab_react']
        });

        memoryDB.colaboradoras.push({
            id: 'pers_1',
            habilidadIds: ['hab_python']
        });

        expect(() => {
            proyectoService.anotarColaborador(proyecto.id, 'pers_1');
        }).toThrow("La persona colaboradora no cuenta con ninguna de las habilidades requeridas para este proyecto");
    });

    test('Debe permitir anotar a una colaboradora si cumple con al menos una habilidad', () => {
        const proyecto = proyectoService.crear('1', {
            titulo: 'App Solidaria',
            descripcion: 'Test',
            habilidadIds: ['hab_react', 'hab_node']
        });

        memoryDB.colaboradoras.push({
            id: 'pers_1',
            habilidadIds: ['hab_node']
        });

        const colaboracion = proyectoService.anotarColaborador(proyecto.id, 'pers_1');
        expect(colaboracion).toBeDefined();
        expect(proyecto.colaboraciones.length).toBe(1);
    });
});