#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Iniciando servidor local para Papelcool..."
echo "📁 Directorio: $(pwd)"
echo ""
echo "🌐 Abriendo en el navegador: http://localhost:8000"
echo ""
echo "⚠️  Para detener el servidor, presiona Ctrl+C"
echo ""

# Abrir el navegador después de 2 segundos
(sleep 2 && open http://localhost:8000) &

# Iniciar el servidor
python3 -m http.server 8000
