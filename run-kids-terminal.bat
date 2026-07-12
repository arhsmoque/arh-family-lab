@echo off
title Agy Cadet Space Station Launcher
echo ===================================================
echo 🚀 Launching Agy Cadet Space Station...
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/ to run this app.
    pause
    exit /b
)

:: Navigate to the app directory
cd /d "%~dp0apps\kids-terminal"

:: Check if node_modules exists, install if missing
if not exist node_modules (
    echo [System] Installing server dependencies, please wait...
    call npm install
)

:: Start the Express server and open browser
echo [System] Starting server...
start "" "http://localhost:3000/apps/kids-terminal/"
node server.js

pause
