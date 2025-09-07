FROM node:16

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose the port your backend runs on (e.g., 5000)
EXPOSE 5000

# Command to start the server
CMD ["npm", "start"]