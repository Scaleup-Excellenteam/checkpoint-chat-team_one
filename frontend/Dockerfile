FROM node:18

WORKDIR /app

# Copy package.json and install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Expose the port your app runs on
EXPOSE ${FRONT_END_PORT}

# The command to run your app
CMD ["npm", "start"]