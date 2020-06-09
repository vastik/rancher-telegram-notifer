FROM node:lts-alpine3.12
ADD index.js /app/index.js
ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
WORKDIR app
RUN npm ci
ENTRYPOINT node index.js