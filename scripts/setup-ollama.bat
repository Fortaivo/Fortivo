@echo off
echo 🤖 Setting up Ollama with Gemma models...

echo ⏳ Waiting for Ollama service to start...
:wait_for_ollama
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo    Still waiting for Ollama...
    timeout /t 5 >nul
    goto wait_for_ollama
)

echo ✅ Ollama service is ready!

echo 🔍 Checking for installed models...
curl -s http://localhost:11434/api/tags | findstr /c:"gemma2:2b" >nul
if %errorlevel% equ 0 (
    echo ✅ Gemma2 2B model is already installed
) else (
    echo 📥 Pulling Gemma2 2B model...
    echo    This may take a few minutes...
    curl -X POST http://localhost:11434/api/pull -H "Content-Type: application/json" -d "{\"name\": \"gemma2:2b\"}" 2>nul
)

echo 🎉 Ollama setup complete!
echo 📍 Ollama API is available at: http://localhost:11434
echo 📖 Available endpoints:
echo    - http://localhost:11434/api/generate
echo    - http://localhost:11434/api/chat