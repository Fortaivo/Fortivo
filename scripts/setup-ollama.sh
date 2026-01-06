#!/bin/bash

echo "🤖 Setting up Ollama with Gemma 3 4B model..."

# Wait for Ollama service to be ready
echo "⏳ Waiting for Ollama service to start..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo "   Still waiting for Ollama..."
    sleep 5
done

echo "✅ Ollama service is ready!"

# Check if gemma2:2b model is already installed (smaller model for faster download)
echo "🔍 Checking installed models..."
if curl -s http://localhost:11434/api/tags | grep -q "gemma2:2b"; then
    echo "✅ Gemma2 2B model is already installed"
else
    echo "📥 Pulling Gemma2 2B model (faster alternative to 4B)..."
    echo "   This may take a few minutes depending on your internet connection..."
    curl -X POST http://localhost:11434/api/pull -d '{"name": "gemma2:2b"}' 2>/dev/null || true
fi

# Optionally pull Gemma2 9B if you have enough resources (uncomment below)
# echo "📥 Pulling Gemma2 9B model (better quality but larger)..."
# curl -X POST http://localhost:11434/api/pull -d '{"name": "gemma2:9b"}' 2>/dev/null || true

echo "🎉 Ollama setup complete!"
echo "📍 Ollama API is available at: http://localhost:11434"
echo "📖 Available endpoints:"
echo "   - http://localhost:11434/api/generate (for completions)"
echo "   - http://localhost:11434/api/chat (for chat completions)"