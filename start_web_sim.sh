#!/bin/bash
echo "==================================================="
echo "  PM Simulator - Local Web Prototype"
echo "==================================================="
echo "Starting web server at http://127.0.0.1:8000 ..."
echo ""

if command -v open > /dev/null; then
  (sleep 2 && open http://127.0.0.1:8000) &
elif command -v xdg-open > /dev/null; then
  (sleep 2 && xdg-open http://127.0.0.1:8000) &
fi

python3 -m http.server 8000 --bind 127.0.0.1 --directory web
