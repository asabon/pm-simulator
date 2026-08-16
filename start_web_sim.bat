@echo off
echo ===================================================
echo   PM Simulator - Local Web Prototype
echo ===================================================
echo Starting web server at http://127.0.0.1:8000 ...
echo.

:: Update version tracking with latest git commit hash
if exist scripts\update_version.js (
  call node scripts\update_version.js
)

:: Open default browser after a short delay so the server starts first
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8000"

:: Start Python HTTP Server bound to IPv4 (127.0.0.1)
python -m http.server 8000 --bind 127.0.0.1 --directory web
