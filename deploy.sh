#!/bin/bash

# Universal File Drop - Deployment Script

set -e  # Exit on any error

echo "🚀 Universal File Drop Deployment Script"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [dev|prod|stop|logs|clean]"
    echo ""
    echo "Commands:"
    echo "  dev     - Start in development mode"
    echo "  prod    - Start in production mode with Caddy"
    echo "  stop    - Stop all services"
    echo "  logs    - Show logs"
    echo "  clean   - Stop and remove all containers, networks, and volumes"
    echo ""
}

# Create necessary directories
create_directories() {
    echo "📁 Creating necessary directories..."
    mkdir -p data/uploads
    mkdir -p data/database
    echo "✅ Directories created"
}

# Start development mode
start_dev() {
    echo "🔧 Starting in development mode..."
    create_directories
    docker-compose up -d
    echo "✅ Development environment started"
    echo "🌐 Access the application at: http://localhost:3001"
    echo "🔧 Admin panel at: http://localhost:3001/#admin"
}

# Start production mode
start_prod() {
    echo "🏭 Starting in production mode..."
    create_directories
    
    # Caddy will automatically handle SSL certificates via Let's Encrypt
    echo "🔒 Caddy will automatically manage SSL certificates via Let's Encrypt"
    echo "   Using domain: img.chawu.su"
    echo "   Using email: support@chawu.su"
    
    docker-compose -f docker-compose.prod.yml up -d
    echo "✅ Production environment started"
    echo "🌐 Access the application at: https://img.chawu.su"
    echo "🔧 Admin panel at: https://img.chawu.su/#admin"
    echo "📝 Note: First certificate issuance may take a few moments"
}

# Stop services
stop_services() {
    echo "🛑 Stopping services..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    echo "✅ Services stopped"
}

# Show logs
show_logs() {
    echo "📋 Showing logs..."
    if docker-compose ps | grep -q "universal-file-drop"; then
        docker-compose logs -f
    elif docker-compose -f docker-compose.prod.yml ps | grep -q "universal-file-drop"; then
        docker-compose -f docker-compose.prod.yml logs -f
    else
        echo "❌ No running services found"
    fi
}

# Clean everything
clean_all() {
    echo "🧹 Cleaning up..."
    echo "⚠️  This will remove all containers, networks, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v --remove-orphans
        docker-compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
        docker system prune -f
        echo "✅ Cleanup completed"
    else
        echo "❌ Cleanup cancelled"
    fi
}

# Main script logic
case "${1:-}" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "stop")
        stop_services
        ;;
    "logs")
        show_logs
        ;;
    "clean")
        clean_all
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

echo ""
echo "🎉 Operation completed!"
echo ""
echo "Useful commands:"
echo "  ./deploy.sh logs  - View logs"
echo "  ./deploy.sh stop  - Stop services"
echo "  docker-compose ps - Check service status"
