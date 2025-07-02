
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD [ "npm", "start" ]