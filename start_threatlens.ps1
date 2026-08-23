## start_threatlens.ps1
## Run this script from C:\Users\DELL\Desktop\ThreatLens to start all ThreatLens services.

Write-Host "=== ThreatLens Startup Script ===" -ForegroundColor Cyan
Write-Host ""

# 1. Start PostgreSQL
Write-Host "[1/3] Starting PostgreSQL..." -ForegroundColor Yellow
$pgAlreadyRunning = $false
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("127.0.0.1", 5432)
    $tcpClient.Close()
    $pgAlreadyRunning = $true
} catch {}

if ($pgAlreadyRunning) {
    Write-Host "      PostgreSQL already running on port 5432." -ForegroundColor Green
} else {
    Start-Process -FilePath "C:\Users\DELL\pgsql\bin\postgres.exe" `
        -ArgumentList "-D", "C:\Users\DELL\pgsql\data" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Host "      PostgreSQL started." -ForegroundColor Green
}

# 2. Start FastAPI backend
Write-Host "[2/3] Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process -FilePath "python" `
    -ArgumentList "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000" `
    -WorkingDirectory "C:\Users\DELL\Desktop\ThreatLens"
Start-Sleep -Seconds 2
Write-Host "      FastAPI backend started." -ForegroundColor Green

# 3. Start Vite frontend dev server
Write-Host "[3/3] Starting Vite frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory "C:\Users\DELL\Desktop\ThreatLens"
Start-Sleep -Seconds 2
Write-Host "      Vite frontend started." -ForegroundColor Green

Write-Host ""
Write-Host "=== ThreatLens is running ===" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  API:       http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Open http://localhost:5173 in your browser." -ForegroundColor Green
