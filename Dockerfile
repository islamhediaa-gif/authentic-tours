# Dockerfile for Full-Stack Authentic ERP
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy all project files
COPY . .

# Build the Frontend
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
