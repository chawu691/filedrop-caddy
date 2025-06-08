#!/bin/bash

# Universal File Drop - Development Startup Script

echo "🚀 Starting Universal File Drop..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/uploads
mkdir -p backend/database

echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Then open your browser to:"
echo "  http://localhost:3001"
echo ""
echo "Admin panel:"
echo "  http://localhost:3001/#admin"
echo "  Username: admin"
echo "  Password: password"
