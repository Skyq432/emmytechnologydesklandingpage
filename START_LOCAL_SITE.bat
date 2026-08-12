@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:5173
  node server.js
) else (
  start "" http://localhost:5173
  py -m http.server 5173 --bind 127.0.0.1
)
