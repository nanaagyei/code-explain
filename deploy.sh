#!/bin/bash

# 🚀 CodeExplain Quick Deployment Script
# This script automates the deployment process for CodeExplain

set -e  # Exit on any error

echo "🚀 Starting CodeExplain Deployment..."

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
    
    # Check if required commands exist
    commands=("node" "python" "docker" "git")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is not installed. Please install it first."
            exit 1
        fi
    done
    
    # Check Node.js version
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check Python version
    python_version=$(python --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1)
    if [ "$python_version" -lt 3 ]; then
        print_error "Python version 3.8+ is required. Current version: $(python --version)"
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Copy environment template if .env doesn't exist
    if [ ! -f .env ]; then
        if [ -f env.template ]; then
            cp env.template .env
            print_warning "Created .env from template. Please edit it with your configuration."
        else
            print_error "env.template not found. Please create .env file manually."
            exit 1
        fi
    fi
    
    print_success "Environment setup complete!"
}

# Start database services
start_database() {
    print_status "Starting database services..."
    
    # Start Docker services
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for database services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Database services started successfully!"
    else
        print_error "Failed to start database services. Check docker-compose logs."
        exit 1
    fi
}

# Deploy backend
deploy_backend() {
    print_status "Deploying backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate  # Linux/macOS
    # For Windows: venv\Scripts\activate
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Run database migrations
    print_status "Running database migrations..."
    alembic upgrade head
    
    # Test database connection
    print_status "Testing database connection..."
    python -c "
from app.core.database import engine
from sqlalchemy import text
try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT 1'))
        print('✅ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"
    
    print_success "Backend deployment complete!"
    cd ..
}

# Deploy frontend
deploy_frontend() {
    print_status "Deploying frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    print_success "Frontend deployment complete!"
    cd ..
}

# Deploy documentation
deploy_docs() {
    print_status "Deploying documentation..."
    
    cd docs
    
    # Install dependencies
    print_status "Installing documentation dependencies..."
    npm install
    
    print_success "Documentation deployment complete!"
    cd ..
}

# Start services
start_services() {
    print_status "Starting all services..."
    
    print_success "Deployment complete! 🎉"
    echo ""
    echo "📋 Next steps:"
    echo "1. Edit .env file with your OpenAI API key"
    echo "2. Start backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo "3. Start frontend: cd frontend && npm run dev"
    echo "4. Start docs: cd docs && npm start"
    echo ""
    echo "🌐 Access points:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo "   Documentation: http://localhost:3001"
    echo ""
    echo "📚 For detailed instructions, see: docs/docs/development/deployment.md"
}

# Main deployment function
main() {
    echo "🚀 CodeExplain Quick Deployment Script"
    echo "======================================"
    echo ""
    
    check_prerequisites
    setup_environment
    start_database
    deploy_backend
    deploy_frontend
    deploy_docs
    start_services
}

# Run main function
main "$@"
