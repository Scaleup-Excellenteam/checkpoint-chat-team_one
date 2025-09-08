FROM node:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE ${SECURITY_PORT}

CMD ["npm", "start"]