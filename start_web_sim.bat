@echo off
echo ===================================================
echo   PM Simulator - Local Web Prototype
echo ===================================================
echo Starting web server at http://localhost:8000 ...
echo.

:: Open default browser
start http://localhost:8000

:: Start Python HTTP Server
python -m http.server 8000 --directory web
