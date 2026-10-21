@echo off
title Email-Based Visit Tracking & Browser Automation Platform
echo ===================================================================
echo   Synthetica - Email-Based Website Visit Tracking & Automation
echo ===================================================================
echo.
echo Starting Express Backend API (Port 5000)...
start "Synthetica Backend [5000]" cmd /k "cd /d %~dp0backend && npm start"

echo.
echo Starting React + Vite Frontend (Port 3000)...
start "Synthetica Frontend [3000]" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================================
echo   Platform URLs:
echo   - Web Dashboard:     http://localhost:3000
echo   - Backend API:       http://localhost:5000/api
echo   - Target Demo Site:  http://localhost:5000/api/demo/page
echo   - Health Status:     http://localhost:5000/health
echo ===================================================================
timeout /t 3 >nul
start http://localhost:3000
