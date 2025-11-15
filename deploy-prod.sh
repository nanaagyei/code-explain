#!/bin/bash

# 🚀 CodeXplain Production Deployment Script
# This script deploys CodeXplain to production using Docker Compose

set -e  # Exit on any error

echo "🚀 Starting CodeXplain Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found!"
        if [ -f env.template ]; then
            print_status "Creating .env from template..."
            cp env.template .env
            print_warning "⚠️  IMPORTANT: Please edit .env file with your production values:"
            echo "   - Set strong SECRET_KEY and JWT_SECRET"
            echo "   - Set DB_PASSWORD"
            echo "   - Set OPENAI_API_KEY"
            echo "   - Set DEBUG=False for production"
            echo ""
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error "env.template not found. Please create .env file manually."
            exit 1
        fi
    fi
    
    # Source .env file
    if [ -f .env ]; then
        set -a
        source .env
        set +a
    fi
    
    print_success "Environment setup complete!"
}

# Build and start services
deploy_services() {
    print_status "Building and starting production services..."
    
    # Determine docker-compose command
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    # Stop existing containers if running
    print_status "Stopping existing containers (if any)..."
    $COMPOSE_CMD -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Build and start services
    print_status "Building Docker images..."
    $COMPOSE_CMD -f docker-compose.prod.yml build --no-cache
    
    print_status "Starting services..."
    $COMPOSE_CMD -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 15
    
    # Check service status
    print_status "Checking service status..."
    $COMPOSE_CMD -f docker-compose.prod.yml ps
    
    print_success "Production deployment complete! 🎉"
}

# Show service URLs
show_urls() {
    FRONTEND_PORT=${FRONTEND_PORT:-80}
    
    echo ""
    echo "🌐 Production Access Points:"
    echo "   Frontend: http://localhost:${FRONTEND_PORT}"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "📊 View logs:"
    echo "   $COMPOSE_CMD -f docker-compose.prod.yml logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   $COMPOSE_CMD -f docker-compose.prod.yml down"
    echo ""
    echo "🔄 Restart services:"
    echo "   $COMPOSE_CMD -f docker-compose.prod.yml restart"
    echo ""
}

# Main deployment function
main() {
    echo "🚀 CodeXplain Production Deployment Script"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    setup_environment
    deploy_services
    show_urls
}

# Run main function
main "$@"

