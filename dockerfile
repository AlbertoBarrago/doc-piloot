FROM node:18-slim

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm ci
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD [ "npm", "start" ]