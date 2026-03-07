FROM node:20-alpine

WORKDIR /app

COPY matching-service/package*.json ./

RUN npm install
COPY matching-service .

COPY api-gateway/generated ./generated

RUN npm run build

EXPOSE 4002

CMD [ "node","dist/server.js" ]