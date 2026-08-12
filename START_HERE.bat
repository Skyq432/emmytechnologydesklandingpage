@echo off
setlocal
cd /d "%~dp0"
title EmmyTech Foldable Desk Landing Page

echo.
echo ================================================
echo   EMMY TECHNOLOGY - FOLDABLE DESK LANDING PAGE
echo ================================================
echo.

where code >nul 2>nul
if %errorlevel%==0 (
  echo Opening project in VS Code...
  start "" code .
) else (
  echo VS Code command "code" was not found. Open this folder manually in VS Code.
)

where node >nul 2>nul
if %errorlevel%==0 (
  echo Starting local site at http://localhost:5173 ...
  start "EmmyTech Local Server" cmd /k "cd /d ""%~dp0"" && node server.js"
  timeout /t 2 /nobreak >nul
  start "" http://localhost:5173
  exit /b 0
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Node.js was not found. Starting with Python instead...
  start "EmmyTech Local Server" cmd /k "cd /d ""%~dp0"" && py -m http.server 5173 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" http://localhost:5173
  exit /b 0
)

echo ERROR: Node.js or Python is required.
pause
