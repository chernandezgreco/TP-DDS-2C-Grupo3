export class Perfil {
    constructor(id, descripcionPerfil, habilidadesRequeridas, habilidadesOpcionales, compromiso, modalidad) {
        if (!(compromiso instanceof Compromiso)) {
            throw new Error("El compromiso del perfil no es válido");
        }

        if (!(modalidad instanceof ModalidadColaboracion)) {
            throw new Error("La modalidad de colaboración del perfil no es válida");
        }

        this.id = id;
        this.descripcionPerfil = descripcionPerfil;
        this.habilidadesRequeridas = habilidadesRequeridas || []; 
        this.habilidadesOpcionales = habilidadesOpcionales || []; 
        this.compromiso = compromiso; 
        this.modalidad = modalidad;
    }    
        cumpleHabilidades(habilidadesColaborador = []) {
        const habilidadesSeguras = Array.isArray(habilidadesColaborador) ? habilidadesColaborador : [];
        const colabHabilidadesLower = habilidadesSeguras.map(h => h.toLowerCase());

        return this.habilidadesRequeridas.every(habilidadReq => 
            colabHabilidadesLower.includes(habilidadReq.toLowerCase())
         );
}}