# PowerShell script to wait for Docker to be ready and start the project

Write-Host "Waiting for Docker Desktop to be ready..." -ForegroundColor Yellow

$maxAttempts = 30
$attempt = 0
$dockerReady = $false

while ($attempt -lt $maxAttempts -and -not $dockerReady) {
    try {
        $result = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
            Write-Host "Docker is ready!" -ForegroundColor Green
        } else {
            $attempt++
            Write-Host "Attempt $attempt/$maxAttempts - Docker still starting..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } catch {
        $attempt++
        Write-Host "Attempt $attempt/$maxAttempts - Docker still starting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $dockerReady) {
    Write-Host "Docker Desktop is taking longer than expected to start." -ForegroundColor Red
    Write-Host "Please ensure Docker Desktop is running and try again." -ForegroundColor Red
    exit 1
}

Write-Host "`nBuilding and starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[DONE] Docker containers started successfully!" -ForegroundColor Green
    Write-Host "`nServices available at:" -ForegroundColor Cyan
    Write-Host "  - Web App: http://localhost:5173" -ForegroundColor White
    Write-Host "  - API Server: http://localhost:8080" -ForegroundColor White
    Write-Host "  - PgAdmin: http://localhost:5050" -ForegroundColor White
    Write-Host "  - Ollama: http://localhost:11434" -ForegroundColor White
    Write-Host "`nTo view logs: docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "`n[ERROR] Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

