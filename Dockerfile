FROM node:latest

RUN npm install express ejs moment redis
ADD . /node
ADD ./docker-config/ /node/config/
EXPOSE 3000
WORKDIR /node
