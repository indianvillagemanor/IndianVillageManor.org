FROM node:24-alpine3.21

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL warn

RUN mkdir /app && chown -R node:node /app


WORKDIR /app

COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json

RUN ls -alR

USER node

RUN npm install --omit=dev
COPY --chown=node:node .next .next
COPY --chown=node:node public public

EXPOSE 3000
CMD npm start
