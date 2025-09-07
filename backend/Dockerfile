FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose the port your backend runs on (e.g., 5000)
EXPOSE ${BACK_END_PORT}

# Command to start the server
CMD ["npm", "start"]