# PowerShell Launcher for Synthetica Platform
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Synthetica - Email-Based Website Visit Tracking & Automation" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/2] Starting Express Backend API on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm start"

Write-Host "[2/2] Starting React + Vite Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "`nPlatform running successfully!" -ForegroundColor Yellow
Write-Host "Dashboard:        http://localhost:3000"
Write-Host "Target Demo Site: http://localhost:5000/api/demo/page"
Write-Host "API Health:       http://localhost:5000/health"

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
