#!/usr/bin/env python3
"""
Script de ejemplo para probar la API de la calculadora de funciones
Demuestra todas las operaciones disponibles
"""

import requests
import json
import time

# Configuración
BASE_URL = "http://localhost:8000"
EXAMPLES = [
    {
        "name": "Polinomio simple",
        "function": "x^2 + 2*x + 1",
        "operations": ["evaluate", "derive", "integrate", "simplify"],
        "evaluate_value": 3
    },
    {
        "name": "Función trigonométrica",
        "function": "sin(x)*cos(x)",
        "operations": ["derive", "simplify"],
        "evaluate_value": 0
    },
    {
        "name": "Función exponencial",
        "function": "exp(x) + x*exp(x)",
        "operations": ["derive", "integrate"],
        "evaluate_value": 1
    },
    {
        "name": "Función logarítmica",
        "function": "log(x^2 + 1)",
        "operations": ["derive"],
        "evaluate_value": 2
    },
    {
        "name": "Función racional",
        "function": "1/(x^2 + 1)",
        "operations": ["integrate", "simplify"],
        "evaluate_value": 0
    }
]

def test_health():
    """Prueba el endpoint de salud"""
    print("🏥 Probando endpoint de salud...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend funcionando - SymPy {data['sympy_version']}")
            return True
        else:
            print(f"❌ Error en health check: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al backend. ¿Está ejecutándose?")
        return False

def test_operation(function, operation, value=None):
    """Prueba una operación específica"""
    url = f"{BASE_URL}/function/{operation}"
    payload = {
        "function": function,
        "operation": operation
    }
    
    if value is not None:
        payload["value"] = value
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error en {operation}: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Excepción en {operation}: {e}")
        return None

def run_examples():
    """Ejecuta todos los ejemplos"""
    print("\n🧮 Ejecutando ejemplos de cálculo...")
    print("=" * 60)
    
    for i, example in enumerate(EXAMPLES, 1):
        print(f"\n📝 Ejemplo {i}: {example['name']}")
        print(f"   Función: f(x) = {example['function']}")
        print("-" * 40)
        
        for operation in example['operations']:
            print(f"\n🔧 Operación: {operation.upper()}")
            
            if operation == "evaluate":
                result = test_operation(
                    example['function'], 
                    operation, 
                    example['evaluate_value']
                )
                if result:
                    print(f"   f({example['evaluate_value']}) = {result['result']}")
            else:
                result = test_operation(example['function'], operation)
                if result:
                    print(f"   Resultado: {result['result']}")
                    
                    # Mostrar algunos pasos
                    if result.get('steps'):
                        print("   Pasos:")
                        for j, step in enumerate(result['steps'][:3], 1):
                            print(f"     {j}. {step}")
                        if len(result['steps']) > 3:
                            print(f"     ... y {len(result['steps']) - 3} pasos más")
            
            time.sleep(0.5)  # Pausa para no sobrecargar

def test_edge_cases():
    """Prueba casos límite"""
    print("\n🧪 Probando casos límite...")
    print("=" * 40)
    
    edge_cases = [
        {
            "name": "Función compleja",
            "function": "sin(x^2) + cos(x^3) + exp(-x^2/2)",
            "operation": "derive"
        },
        {
            "name": "Función con múltiples variables",
            "function": "x^2 + y^2",
            "operation": "simplify"
        },
        {
            "name": "Función racional compleja",
            "function": "(x^3 + 2*x^2 + x + 1)/(x^2 - 1)",
            "operation": "simplify"
        }
    ]
    
    for case in edge_cases:
        print(f"\n🔍 {case['name']}")
        print(f"   Función: {case['function']}")
        
        result = test_operation(case['function'], case['operation'])
        if result:
            print(f"   ✅ Resultado: {result['result']}")
        else:
            print("   ❌ Error en el cálculo")

def main():
    """Función principal"""
    print("🚀 SolvMath - Pruebas de la API")
    print("=" * 50)
    
    # Verificar salud del backend
    if not test_health():
        print("\n💡 Para iniciar el backend:")
        print("   python start_backend.py")
        print("   o")
        print("   cd backend && python functions_service.py")
        return
    
    # Ejecutar ejemplos
    run_examples()
    
    # Probar casos límite
    test_edge_cases()
    
    print("\n🎉 ¡Todas las pruebas completadas!")
    print("\n💡 Para usar la interfaz web:")
    print("   1. Abre http://localhost:8001 en tu navegador")
    print("   2. Selecciona 'Cálculo' en el menú lateral")
    print("   3. Prueba las funciones de ejemplo")

if __name__ == "__main__":
    main()

