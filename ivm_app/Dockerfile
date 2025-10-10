FROM node:24-alpine3.21

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL warn

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

# Copy only package files first for better layer caching
COPY --chown=node:node package.json package.json
COPY --chown=node:node package-lock.json package-lock.json

USER node

# Install only production dependencies
RUN npm install --omit=dev

# Copy prisma directory before generating Prisma client
COPY --chown=node:node prisma prisma
RUN npx prisma generate

# Copy only necessary files for build
COPY --chown=node:node public public
COPY --chown=node:node next.config.ts next.config.ts
COPY --chown=node:node tsconfig.json tsconfig.json
COPY --chown=node:node .env.example .env.example
COPY --chown=node:node .dockerignore .dockerignore
COPY --chown=node:node .gitignore .gitignore
COPY --chown=node:node components.json components.json
COPY --chown=node:node postcss.config.mjs postcss.config.mjs
COPY --chown=node:node tailwind.config.ts tailwind.config.ts
COPY --chown=node:node eslint.config.mjs eslint.config.mjs
COPY --chown=node:node next-env.d.ts next-env.d.ts

# Copy source code
COPY --chown=node:node actions actions
COPY --chown=node:node app app
COPY --chown=node:node components components
COPY --chown=node:node lib lib
COPY --chown=node:node schemas schemas

# Build the Next.js app
RUN npm run build

EXPOSE 3000
CMD npm start
