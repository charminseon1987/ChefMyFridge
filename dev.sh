#!/bin/bash
# Frontend Development Server Startup Script

echo "🚀 Starting Frontend Development Server..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "✅ Dependencies checked. Starting server..."
npm run dev
