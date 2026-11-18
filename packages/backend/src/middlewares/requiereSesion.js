// Para rutas montadas antes de autorizar: exige una sesión válida (resuelta por resolverSesion)
export const requiereSesion = (req, res, next) => {
    if (!req.cuenta) {
        return res.status(401).json({ error: "Iniciá sesión para continuar." });
    }
    next();
};
