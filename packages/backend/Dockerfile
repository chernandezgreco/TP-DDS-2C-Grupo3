# Dockerfile de la app completa (API + front compilado). Se construye con el
# contexto en la RAIZ del repo (el proyecto usa npm workspaces), por ejemplo:
#   docker build -f packages/backend/Dockerfile -t codigo-a-voluntad .

# Etapa 1: compilar el front. REACT_APP_API_URL=/api porque el backend sirve
# el front y la API desde el mismo origen (asi la cookie de sesion viaja sola).
FROM node:20-alpine AS front
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/frontend/package.json ./packages/frontend/package.json
RUN npm install --workspace=frontend
COPY packages/frontend ./packages/frontend
ENV REACT_APP_API_URL=/api
ENV GENERATE_SOURCEMAP=false
RUN npm run build --workspace=frontend

# Etapa 2: imagen final, solo con las dependencias del backend.
FROM node:20-alpine

WORKDIR /app

# Copiamos primero solo los package.json para aprovechar la cache de Docker:
# si no cambiaron las dependencias, no se vuelve a instalar en cada build.
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/frontend/package.json ./packages/frontend/package.json

RUN npm install --workspace=backend --omit=dev

# Recién ahora copiamos el código fuente del backend y el front compilado.
COPY packages/backend ./packages/backend
COPY --from=front /app/packages/frontend/build ./packages/frontend/build

WORKDIR /app/packages/backend

EXPOSE 3000

CMD ["node", "index.js"]
