@echo off
title Prayer Journal 2026
echo.
echo  +------------------------------------------+
echo  ^|   Prayer Journal 2026  ^|  Starting...     ^|
echo  +------------------------------------------+
echo.

:: Try Python first (no install needed)
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo  Using Python...
    echo  Open your browser to: http://localhost:3000
    echo  Press Ctrl+C to stop.
    echo.
    python server.py
    goto :end
)

:: Fall back to Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo  Using Node.js...
    if not exist "node_modules" (
        echo  Installing dependencies...
        call npm install
        echo.
    )
    echo  Open your browser to: http://localhost:3000
    echo  Press Ctrl+C to stop.
    echo.
    node server.js
    goto :end
)

:: Neither found
echo  ERROR: Neither Python nor Node.js was found.
echo.
echo  Please install one of the following:
echo    Python: https://www.python.org/downloads/
echo    Node.js: https://nodejs.org/
echo.

:end
pause
