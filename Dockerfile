FROM node:20 as build
USER node
WORKDIR /home/node
COPY --chown=node:node package.json package-lock.json .
RUN npm i
COPY --chown=node:node . .
RUN npm run build
ENV PORT=8080
ENV PATH="/home/node/node_modules/.bin:$PATH"
CMD ["node", "./node_modules/.bin/stucco", "local", "start"]
