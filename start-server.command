#!/bin/bash
cd "$(dirname "$0")"

PORT=8000
while lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

URL="http://localhost:${PORT}"

echo "🚀 Iniciando servidor local para Papelcool..."
echo "📁 Directorio: $(pwd)"
echo ""
echo "🌐 Abriendo en el navegador: ${URL}"
echo ""
echo "⚠️  Para detener el servidor, presiona Ctrl+C"
echo ""

# Abrir el navegador después de 2 segundos
(sleep 2 && open "${URL}") &

# Iniciar el servidor
python3 -m http.server "$PORT"
