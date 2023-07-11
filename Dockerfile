FROM node:16.14.1-stretch-slim
WORKDIR /app

COPY package*.json ./

RUN yarn install

COPY . .

EXPOSE 8080

CMD ["yarn", "start"]