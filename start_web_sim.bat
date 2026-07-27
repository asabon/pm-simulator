@echo off
echo ===================================================
echo   PM Simulator - Local Web Prototype
echo ===================================================
echo Starting web server at http://127.0.0.1:8000 ...
echo.

:: Open default browser after a short delay so the server starts first
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8000"

:: Start Python HTTP Server using uv bound to IPv4 (127.0.0.1)
uv run python -m http.server 8000 --bind 127.0.0.1 --directory web
