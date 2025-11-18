# Documentation Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Accept build arguments for environment variables (with defaults)
ARG DOCS_SITE_URL
ARG DOCS_BASE_URL

# Set as environment variables for the build
# Use ARG values if provided, otherwise use defaults
ENV DOCS_SITE_URL=${DOCS_SITE_URL:-https://nanaagyei.github.io}
ENV DOCS_BASE_URL=${DOCS_BASE_URL:-/code-explain/}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Copy and make build script executable
COPY build.sh /build.sh
RUN chmod +x /build.sh

# Build the documentation using the script (reads env vars)
RUN /build.sh

# Install serve globally
RUN npm install -g serve

# Expose port (Railway uses $PORT, default to 3000)
EXPOSE 3000

# Start serving the built documentation
CMD ["sh", "-c", "PORT_VALUE=${PORT:-3000}; serve -s build -l tcp://0.0.0.0:${PORT_VALUE}"]

