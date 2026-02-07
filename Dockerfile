# Dockerfile for Authentic ERP Backend
FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy server code
COPY server.js .

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
