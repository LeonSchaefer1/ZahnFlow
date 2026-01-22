#!/bin/bash

# ZahnFlow Start Local Script
# This script runs tests, builds the application, and opens it in Chrome

set -e

echo "🦷 ZahnFlow - Start Local Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check if Docker is running (for PostgreSQL)
print_info "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop first."
    exit 1
fi
print_status "Docker is running"

# Start PostgreSQL container if not running
print_info "Starting PostgreSQL container..."
docker-compose up -d postgres
sleep 5
print_status "PostgreSQL is running on port 5433"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    print_info "Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    print_info "Installing client dependencies..."
    cd client && npm install && cd ..
fi
print_status "Dependencies installed"

# Run database migrations and seed
print_info "Running database migrations..."
cd server
npm run migrate 2>/dev/null || {
    print_error "Migration failed. Make sure PostgreSQL is accessible."
    exit 1
}
print_status "Migrations completed"

print_info "Seeding database..."
npm run seed 2>/dev/null || true
print_status "Database seeded"
cd ..

# Run tests
echo ""
echo "📋 Running Tests..."
echo "==================="

print_info "Running backend tests..."
cd server
if npm test; then
    print_status "Backend tests passed"
else
    print_error "Backend tests failed!"
    exit 1
fi
cd ..

print_info "Running frontend tests..."
cd client
if npm test; then
    print_status "Frontend tests passed"
else
    print_error "Frontend tests failed!"
    exit 1
fi
cd ..

echo ""
echo "🔨 Building Application..."
echo "=========================="

# Build server
print_info "Building server..."
cd server
npm run build
print_status "Server built"
cd ..

# Build client
print_info "Building client..."
cd client
npm run build
print_status "Client built"
cd ..

echo ""
echo "🚀 Starting Application..."
echo "=========================="

# Kill any existing processes on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start server in background
print_info "Starting server on port 3001..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait for server to be ready
sleep 3

# Start client in background
print_info "Starting client on port 5173..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

# Wait for client to be ready
sleep 5

# Open browser
print_info "Opening Chrome..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a "Google Chrome" "http://localhost:5173"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    google-chrome "http://localhost:5173" 2>/dev/null || xdg-open "http://localhost:5173"
else
    start chrome "http://localhost:5173"
fi

echo ""
print_status "ZahnFlow is now running!"
echo ""
echo "  📱 Frontend: http://localhost:5173"
echo "  🔧 Backend:  http://localhost:3001"
echo ""
echo "  📧 Test Login:"
echo "     Email:    zahnarzt@zahnflow.de"
echo "     Passwort: ZahnFlow2024!"
echo ""
echo "  Press Ctrl+C to stop the application"
echo ""

# Handle shutdown
cleanup() {
    echo ""
    print_info "Shutting down..."
    kill $SERVER_PID 2>/dev/null || true
    kill $CLIENT_PID 2>/dev/null || true
    print_status "Application stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
