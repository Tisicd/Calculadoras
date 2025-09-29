#!/bin/bash

# SolvMath - Script de inicio completo
# Inicia todos los servicios necesarios

set -e

echo "🧮 SolvMath - Calculadora Matemática Avanzada"
echo "=============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar Python
check_python() {
    print_status "Verificando Python..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        if python3 -c 'import sys; exit(0 if sys.version_info >= (3, 8) else 1)'; then
            print_success "Python $PYTHON_VERSION encontrado"
        else
            print_error "Se requiere Python 3.8 o superior"
            exit 1
        fi
    else
        print_error "Python no encontrado"
        exit 1
    fi
}

# Verificar Node.js (opcional)
check_node() {
    print_status "Verificando Node.js..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION encontrado"
        return 0
    else
        print_warning "Node.js no encontrado (opcional)"
        return 1
    fi
}

# Instalar dependencias del backend
install_backend_deps() {
    print_status "Instalando dependencias del backend..."
    cd backend
    if [ -f requirements.txt ]; then
        python3 -m pip install -r requirements.txt
        print_success "Dependencias del backend instaladas"
    else
        print_error "requirements.txt no encontrado"
        exit 1
    fi
    cd ..
}

# Instalar dependencias del frontend (opcional)
install_frontend_deps() {
    if check_node && [ -f package.json ]; then
        print_status "Instalando dependencias del frontend..."
        npm install
        print_success "Dependencias del frontend instaladas"
    fi
}

# Verificar puertos
check_ports() {
    print_status "Verificando puertos..."
    
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Puerto 8000 ya está en uso"
        read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Puerto 8001 ya está en uso"
        read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Iniciar backend
start_backend() {
    print_status "Iniciando backend (SymPy + FastAPI)..."
    cd backend
    python3 -m uvicorn functions_service:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..
    
    # Esperar a que el backend esté listo
    print_status "Esperando que el backend esté listo..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend iniciado en http://localhost:8000"
            break
        fi
        sleep 1
    done
    
    if [ $i -eq 30 ]; then
        print_error "Backend no respondió en 30 segundos"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
}

# Iniciar frontend
start_frontend() {
    print_status "Iniciando servidor frontend..."
    
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8001 &
        FRONTEND_PID=$!
        print_success "Frontend iniciado en http://localhost:8001"
    else
        print_error "No se puede iniciar el frontend"
        exit 1
    fi
}

# Verificar Ollama (opcional)
check_ollama() {
    print_status "Verificando Ollama (LLM local)..."
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_success "Ollama detectado en http://localhost:11434"
        return 0
    else
        print_warning "Ollama no detectado (opcional)"
        print_status "Para habilitar explicaciones con LLM:"
        print_status "  1. Instala Ollama: https://ollama.ai"
        print_status "  2. Ejecuta: ollama pull mistral:7b"
        print_status "  3. Ejecuta: ollama serve"
        return 1
    fi
}

# Función de limpieza
cleanup() {
    print_status "Deteniendo servicios..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    print_success "Servicios detenidos"
}

# Configurar trap para limpieza
trap cleanup EXIT INT TERM

# Función principal
main() {
    echo
    print_status "Iniciando verificación de dependencias..."
    
    check_python
    install_backend_deps
    install_frontend_deps
    check_ports
    
    echo
    print_status "Iniciando servicios..."
    
    start_backend
    start_frontend
    check_ollama
    
    echo
    print_success "¡SolvMath está funcionando!"
    echo
    echo "🌐 Frontend: http://localhost:8001"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📚 Documentación API: http://localhost:8000/docs"
    echo
    echo "💡 Presiona Ctrl+C para detener todos los servicios"
    echo
    
    # Mantener el script ejecutándose
    wait
}

# Verificar si se ejecuta con argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [opciones]"
    echo
    echo "Opciones:"
    echo "  --help, -h     Mostrar esta ayuda"
    echo "  --backend      Solo iniciar backend"
    echo "  --frontend     Solo iniciar frontend"
    echo "  --install      Solo instalar dependencias"
    echo
    exit 0
fi

if [ "$1" = "--backend" ]; then
    check_python
    install_backend_deps
    start_backend
    wait
elif [ "$1" = "--frontend" ]; then
    start_frontend
    wait
elif [ "$1" = "--install" ]; then
    check_python
    install_backend_deps
    install_frontend_deps
    print_success "Instalación completada"
else
    main
fi

