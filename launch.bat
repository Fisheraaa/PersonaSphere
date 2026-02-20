@echo off
title PersonaSphere Launcher
echo.
echo ========================================
echo   PersonaSphere Launcher
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Starting Backend...
start "PersonaSphere Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload"

timeout /t 3 /nobreak >nul

echo [2] Starting Frontend...
start "PersonaSphere Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Services Started!
echo   Frontend: http://localhost:3000
echo   Backend: http://localhost:8000
echo ========================================
echo.
pause
