# Dockerfile del backend. Se construye con el contexto en la RAIZ del repo
# (necesario porque el proyecto usa npm workspaces), por ejemplo:
#   docker build -f packages/backend/Dockerfile -t codigo-a-voluntad-backend .

FROM node:20-alpine

WORKDIR /app

# Copiamos primero solo los package.json para aprovechar la cache de Docker:
# si no cambiaron las dependencias, no se vuelve a instalar en cada build.
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/package.json

RUN npm install --workspace=backend --omit=dev

# Recién ahora copiamos el código fuente del backend.
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

EXPOSE 3000

CMD ["node", "index.js"]
