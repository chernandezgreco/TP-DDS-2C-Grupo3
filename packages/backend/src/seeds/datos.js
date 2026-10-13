// Datos iniciales de la plataforma. Solo datos, sin lógica: los carga seeds/index.js.
// Los ids son fijos para poder usarlos directo en las requests (Postman, Swagger).

export const IDS = {
    colectivos: {
        manosUnidas: "650000000000000000000101",
        asambleaVillaCrespo: "650000000000000000000102",
        codigoAbierto: "650000000000000000000103",
    },
    proyectos: {
        webDonaciones: "650000000000000000000201",
        apiInventario: "650000000000000000000202",
        plataformaCursos: "650000000000000000000203",
        encuestaVecinal: "650000000000000000000204",
    },
    colaboradoras: {
        ada: "650000000000000000000301",
        grace: "650000000000000000000302",
        lu: "650000000000000000000303",
        pyto: "650000000000000000000304",
        sol: "650000000000000000000305",
    },
};

// el código de cada habilidad sale del título (ver Habilidad.codigoPara)
export const HABILIDADES = [
    { titulo: "JavaScript", descripcion: "Desarrollo con JavaScript" },
    { titulo: "React", descripcion: "Desarrollo de interfaces con React" },
    { titulo: "NodeJS", descripcion: "Desarrollo backend con Node y Express" },
    { titulo: "Diseño UX", descripcion: "Investigación y diseño de experiencia de usuario" },
    { titulo: "Bases de datos", descripcion: "Modelado y consultas SQL/NoSQL" },
    { titulo: "Python", descripcion: "Desarrollo con Python y análisis de datos" },
    { titulo: "Pandas", descripcion: "Análisis de datos con la librería Pandas" },
    { titulo: "Testing E2E con Cypress", descripcion: "Pruebas de punta a punta con Cypress" },
    { titulo: "SoapUI", descripcion: "Pruebas de APIs con SoapUI" },
];

export const COLECTIVOS = [
    {
        id: IDS.colectivos.manosUnidas,
        nombre: "Fundación Manos Unidas",
        descripcion: "Asistencia alimentaria en barrios del conurbano",
        ubicacion: "Avellaneda, Buenos Aires",
        tipo: "FUNDACION",
    },
    {
        id: IDS.colectivos.asambleaVillaCrespo,
        nombre: "Asamblea Villa Crespo",
        descripcion: "Asamblea vecinal que organiza actividades culturales",
        ubicacion: "Villa Crespo, CABA",
        tipo: "ASAMBLEA",
    },
    {
        id: IDS.colectivos.codigoAbierto,
        nombre: "ONG Código Abierto",
        descripcion: "Enseñanza de programación a jóvenes",
        ubicacion: "Rosario, Santa Fe",
        tipo: "ONG",
    },
];

export const COLABORADORAS = [
    {
        id: IDS.colaboradoras.ada,
        nombreFantasia: "Ada",
        github: "github.com/ada-dev",
        nombreApellido: "Ada Gómez",
        habilidades: ["javascript", "react"],
        pronombres: "ella",
        presentacion: "Frontend dev con ganas de ayudar",
        aceptaMensajeria: true,
        mediosContacto: [
            { tipo: "EMAIL", valor: "ada@mail.com" },
            { tipo: "WHATSAPP", valor: "+5491157612305" },
        ],
    },
    {
        id: IDS.colaboradoras.grace,
        nombreFantasia: "Grace",
        github: "github.com/grace-h",
        nombreApellido: "Grace Pérez",
        habilidades: ["nodejs", "bases-de-datos"],
        pronombres: "ella",
        presentacion: "Backend dev, me gustan las APIs",
        aceptaMensajeria: true,
        mediosContacto: [{ tipo: "SMS", valor: "+5491144556677" }],
    },
    {
        id: IDS.colaboradoras.lu,
        nombreFantasia: "Lu",
        github: "gitlab.com/lu-ux",
        nombreApellido: "Lucía Fernández",
        habilidades: ["diseño-ux"],
        pronombres: "elle",
        presentacion: "Diseñadora UX/UI",
        aceptaMensajeria: false,
        mediosContacto: [{ tipo: "EMAIL", valor: "lu@mail.com" }],
    },
    {
        id: IDS.colaboradoras.pyto,
        nombreFantasia: "Pyto",
        github: "github.com/pyto",
        nombreApellido: "Martina Ríos",
        habilidades: ["python", "pandas"],
        pronombres: "ella",
        presentacion: "Data scientist",
        aceptaMensajeria: true,
        mediosContacto: [],
    },
    {
        id: IDS.colaboradoras.sol,
        nombreFantasia: "Sol",
        github: "github.com/fullstack-sol",
        nombreApellido: "Sol Martínez",
        habilidades: ["javascript", "react", "nodejs", "testing-e2e-con-cypress"],
        pronombres: "ella",
        presentacion: "Fullstack",
        aceptaMensajeria: false,
        mediosContacto: [],
    },
];

const gratuita = { gratuita: true, incentivoEconomico: false, contratacionEventual: false };
const conIncentivo = { gratuita: false, incentivoEconomico: true, contratacionEventual: false };

// los ids de los perfiles se generan al cargar
export const PROYECTOS = [
    {
        id: IDS.proyectos.webDonaciones,
        colectivoId: IDS.colectivos.manosUnidas,
        titulo: "Web de donaciones",
        descripcion: "Sitio para recibir y organizar donaciones de alimentos",
        perfiles: [
            {
                descripcionPerfil: "Frontend",
                habilidadesRequeridas: ["react"],
                habilidadesOpcionales: ["javascript"],
                compromiso: { cantidadHoras: 5, tipo: "SEMANALES" },
                modalidad: gratuita,
            },
            {
                descripcionPerfil: "Tester",
                habilidadesRequeridas: ["testing-e2e-con-cypress"],
                habilidadesOpcionales: ["soapui"],
                compromiso: { cantidadHoras: 5, tipo: "MENSUALES" },
                modalidad: gratuita,
            },
        ],
    },
    {
        id: IDS.proyectos.apiInventario,
        colectivoId: IDS.colectivos.manosUnidas,
        titulo: "API de inventario",
        descripcion: "Backend para controlar el stock del comedor",
        perfiles: [
            {
                descripcionPerfil: "Backend",
                habilidadesRequeridas: ["nodejs", "bases-de-datos"],
                habilidadesOpcionales: [],
                compromiso: { cantidadHoras: 20, tipo: "MENSUALES" },
                modalidad: conIncentivo,
            },
        ],
    },
    {
        id: IDS.proyectos.plataformaCursos,
        colectivoId: IDS.colectivos.codigoAbierto,
        titulo: "Plataforma de cursos",
        descripcion: "Plataforma para los cursos de programación",
        perfiles: [
            {
                descripcionPerfil: "Fullstack",
                habilidadesRequeridas: ["react", "nodejs"],
                habilidadesOpcionales: ["bases-de-datos"],
                compromiso: { cantidadHoras: 100, tipo: "TOTALES" },
                modalidad: { gratuita: true, incentivoEconomico: true, contratacionEventual: true },
            },
            {
                descripcionPerfil: "Diseño de la experiencia",
                habilidadesRequeridas: ["diseño-ux"],
                habilidadesOpcionales: [],
                compromiso: { cantidadHoras: 4, tipo: "SEMANALES" },
                modalidad: gratuita,
            },
        ],
    },
    {
        id: IDS.proyectos.encuestaVecinal,
        colectivoId: IDS.colectivos.asambleaVillaCrespo,
        titulo: "Encuesta vecinal",
        descripcion: "Análisis de datos de la encuesta del barrio",
        finalizado: true,
        perfiles: [
            {
                descripcionPerfil: "Analista de datos",
                habilidadesRequeridas: ["pandas"],
                habilidadesOpcionales: ["python"],
                compromiso: { cantidadHoras: 15, tipo: "MENSUALES" },
                modalidad: conIncentivo,
            },
        ],
    },
];

// se anotan en el primer perfil del proyecto que les corresponde
export const COLABORACIONES = [
    { proyectoId: IDS.proyectos.webDonaciones, colaboradoraId: IDS.colaboradoras.ada },
    { proyectoId: IDS.proyectos.apiInventario, colaboradoraId: IDS.colaboradoras.grace },
    { proyectoId: IDS.proyectos.plataformaCursos, colaboradoraId: IDS.colaboradoras.sol },
    { proyectoId: IDS.proyectos.encuestaVecinal, colaboradoraId: IDS.colaboradoras.pyto },
];

export const NOTIFICACIONES = [
    {
        colaboradoraId: IDS.colaboradoras.ada,
        colectivoId: IDS.colectivos.manosUnidas,
        proyectoId: IDS.proyectos.webDonaciones,
        texto: "Tenemos un proyecto nuevo que encaja con tus habilidades",
    },
];
