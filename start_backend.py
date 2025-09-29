#!/usr/bin/env python3
"""
Script de inicio para el backend de la calculadora de funciones
Ejecuta el servidor FastAPI con SymPy
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def check_python_version():
    """Verifica que la versión de Python sea compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Se requiere Python 3.8 o superior")
        print(f"   Versión actual: {sys.version}")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    return True

def install_dependencies():
    """Instala las dependencias del backend"""
    backend_dir = Path(__file__).parent / "backend"
    requirements_file = backend_dir / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ Error: No se encontró requirements.txt en backend/")
        return False
    
    print("📦 Instalando dependencias...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True, cwd=backend_dir)
        print("✅ Dependencias instaladas correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando dependencias: {e}")
        return False

def start_server():
    """Inicia el servidor FastAPI"""
    backend_dir = Path(__file__).parent / "backend"
    server_file = backend_dir / "functions_service.py"
    
    if not server_file.exists():
        print("❌ Error: No se encontró functions_service.py en backend/")
        return False
    
    print("🚀 Iniciando servidor FastAPI...")
    print("   URL: http://localhost:8000")
    print("   Docs: http://localhost:8000/docs")
    print("   Presiona Ctrl+C para detener")
    print("-" * 50)
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "functions_service:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ], cwd=backend_dir)
        return True
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido")
        return True
    except Exception as e:
        print(f"❌ Error iniciando servidor: {e}")
        return False

def main():
    """Función principal"""
    print("🧮 SolvMath - Backend de Calculadora de Funciones")
    print("=" * 50)
    
    # Verificar Python
    if not check_python_version():
        sys.exit(1)
    
    # Instalar dependencias
    if not install_dependencies():
        sys.exit(1)
    
    # Iniciar servidor
    if not start_server():
        sys.exit(1)

if __name__ == "__main__":
    main()

