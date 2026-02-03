# Use Node.js LTS
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production

# Copy the rest of the application code
COPY server.js ./

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
