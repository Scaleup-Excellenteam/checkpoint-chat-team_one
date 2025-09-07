FROM node:14

WORKDIR /app

# Copy package.json and install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# The command to run your app
CMD ["npm", "start"]