FROM node:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for later TS compilation)
RUN npm install

# Copy source
COPY . .

# Build the project
RUN npm run build && ls -l dist/src && test -f dist/src/server.js

# ENV NODE_ENV=production
EXPOSE ${BACK_END_PORT}

# Use the simple JS starter instead of compiled TS
CMD ["npm", "start"]