# Documentation Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the documentation
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port (Railway uses $PORT, default to 3000)
EXPOSE 3000

# Start serving the built documentation
CMD ["sh", "-c", "PORT_VALUE=${PORT:-3000}; serve -s build -l tcp://0.0.0.0:${PORT_VALUE}"]

