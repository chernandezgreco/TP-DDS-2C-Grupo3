# Frontend de Código a Voluntad

React (Create React App) con Axios. Habla con la API del backend usando la cookie de sesión.

- [ENTREGA3.md](ENTREGA3.md): cómo levantarlo, recorridos de cada tipo de cuenta, pantallas y adicionales.
- [ADICIONALES.md](ADICIONALES.md): términos, límite de tasa, Markdown, huella IA y RSS.
- [README principal](../../README.md): arquitectura, API y tests.

Desde la raíz del repositorio:

```bash
npm install
docker compose up -d mongo
npm run dev
```

Front en http://localhost:3000, API en http://localhost:8000/api y Swagger en http://localhost:8000/api-docs.

Copiar `packages/backend/.env.example` a `packages/backend/.env` solo si todavía no existe, y no correr el seed sobre una base con datos que se quieran conservar: la borra.
