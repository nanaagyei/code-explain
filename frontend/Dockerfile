# Frontend Dockerfile for Production
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
# ARG allows passing build-time variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Verify environment variable is set (for debugging)
RUN echo "Building with VITE_API_BASE_URL=${VITE_API_BASE_URL}"

# Build the application
RUN npm run build

# Verify build output exists
RUN ls -la /app/dist || (echo "ERROR: Build failed - dist directory not found" && exit 1)
RUN test -f /app/dist/index.html || (echo "ERROR: Build failed - index.html not found" && exit 1)

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configurations
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh

# Expose port (Railway uses $PORT, default to 80)
EXPOSE 80

# Start nginx with port configuration from Railway
CMD ["/start-nginx.sh"]

