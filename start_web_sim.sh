#!/bin/bash
echo "==================================================="
echo "  PM Simulator - Local Web Prototype"
echo "==================================================="
echo "Starting web server at http://localhost:8000 ..."
echo ""

if command -v open > /dev/null; then
  open http://localhost:8000
elif command -v xdg-open > /dev/null; then
  xdg-open http://localhost:8000
fi

uv run python -m http.server 8000 --directory web
