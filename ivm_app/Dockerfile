FROM node:23-alpine3.20

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL warn

RUN mkdir /app && chown -R node:node /app

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

USER node

RUN npm install --production
COPY --chown=node:node .next .next
COPY --chown=node:node public public

EXPOSE 3000
CMD npm start
