FROM node:18

WORKDIR /usr/src/app

COPY . .
RUN npm run build

CMD [ "npm", "start" ]