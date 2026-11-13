# Frontend — Código a Voluntad

React con Axios y API Express/MongoDB. La rama de trabajo es `3era-entrega`.

Consultar [ENTREGA3.md](ENTREGA3.md) para iniciar el proyecto, seguir los recorridos y verificar los requisitos obligatorios. [ADICIONALES.md](ADICIONALES.md) detalla los cinco adicionales implementados.

Desde la raíz del repositorio:

```powershell
npm install
docker compose up -d mongo
npm run dev:backend
```

En otra terminal:

```powershell
npm run start:frontend
```

Frontend: http://localhost:3000 · API: http://localhost:8000/api · Swagger: http://localhost:8000/api-docs.

Copiar `packages/backend/.env.example` a `packages/backend/.env` sólo si todavía no existe. No reemplazar un archivo de configuración propio ni ejecutar seeds sobre una base con datos que se quieran conservar.
