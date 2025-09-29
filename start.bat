@echo off
REM SolvMath - Script de inicio para Windows
REM Inicia todos los servicios necesarios

echo 🧮 SolvMath - Calculadora Matemática Avanzada
echo ==============================================
echo.

REM Verificar Python
echo [INFO] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no encontrado. Por favor instala Python 3.8 o superior.
    pause
    exit /b 1
)

python -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Se requiere Python 3.8 o superior
    pause
    exit /b 1
)

echo [SUCCESS] Python encontrado
echo.

REM Instalar dependencias del backend
echo [INFO] Instalando dependencias del backend...
cd backend
if exist requirements.txt (
    python -m pip install -r requirements.txt
    echo [SUCCESS] Dependencias del backend instaladas
) else (
    echo [ERROR] requirements.txt no encontrado
    pause
    exit /b 1
)
cd ..
echo.

REM Verificar puertos
echo [INFO] Verificando puertos...
netstat -an | find "8000" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Puerto 8000 ya está en uso
    set /p continue="¿Continuar de todos modos? (y/N): "
    if /i not "%continue%"=="y" exit /b 1
)

netstat -an | find "8001" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Puerto 8001 ya está en uso
    set /p continue="¿Continuar de todos modos? (y/N): "
    if /i not "%continue%"=="y" exit /b 1
)
echo.

REM Iniciar backend
echo [INFO] Iniciando backend (SymPy + FastAPI)...
cd backend
start "Backend SolvMath" cmd /k "python -m uvicorn functions_service:app --host 0.0.0.0 --port 8000 --reload"
cd ..

REM Esperar un momento para que el backend inicie
echo [INFO] Esperando que el backend esté listo...
timeout /t 3 /nobreak >nul

REM Verificar que el backend esté funcionando
:check_backend
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Esperando backend... (puede tomar unos segundos)
    timeout /t 2 /nobreak >nul
    goto check_backend
)
echo [SUCCESS] Backend iniciado en http://localhost:8000
echo.

REM Iniciar frontend
echo [INFO] Iniciando servidor frontend...
start "Frontend SolvMath" cmd /k "python -m http.server 8001"
echo [SUCCESS] Frontend iniciado en http://localhost:8001
echo.

REM Verificar Ollama (opcional)
echo [INFO] Verificando Ollama (LLM local)...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Ollama detectado en http://localhost:11434
) else (
    echo [WARNING] Ollama no detectado (opcional)
    echo [INFO] Para habilitar explicaciones con LLM:
    echo [INFO]   1. Instala Ollama: https://ollama.ai
    echo [INFO]   2. Ejecuta: ollama pull mistral:7b
    echo [INFO]   3. Ejecuta: ollama serve
)
echo.

echo [SUCCESS] ¡SolvMath está funcionando!
echo.
echo 🌐 Frontend: http://localhost:8001
echo 🔧 Backend API: http://localhost:8000
echo 📚 Documentación API: http://localhost:8000/docs
echo.
echo 💡 Presiona cualquier tecla para abrir el navegador...
pause >nul

REM Abrir navegador
start http://localhost:8001

echo.
echo [INFO] Los servicios están ejecutándose en ventanas separadas.
echo [INFO] Cierra las ventanas de comandos para detener los servicios.
echo.
pause

