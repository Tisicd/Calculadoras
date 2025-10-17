#!/usr/bin/env python3
"""
Script de prueba para verificar el funcionamiento de las integrales
"""

import requests
import json

def test_integral_endpoint():
    """Prueba el endpoint de integración"""
    url = "http://localhost:8000/function/integrate"
    
    test_cases = [
        {"function": "exp(x)", "operation": "integrate"},
        {"function": "x^2", "operation": "integrate"},
        {"function": "sin(x)", "operation": "integrate"},
        {"function": "x", "operation": "integrate"},
        {"function": "1", "operation": "integrate"}
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Prueba {i}: {test_case['function']} ---")
        try:
            response = requests.post(url, json=test_case)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Resultado: {result['result']}")
                print(f"Pasos: {result['steps']}")
            else:
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"Error de conexión: {e}")

def test_other_operations():
    """Prueba otras operaciones para comparar"""
    operations = ["derive", "simplify"]
    
    for operation in operations:
        url = f"http://localhost:8000/function/{operation}"
        test_case = {"function": "exp(x)", "operation": operation}
        
        print(f"\n--- Prueba {operation}: exp(x) ---")
        try:
            response = requests.post(url, json=test_case)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Resultado: {result['result']}")
            else:
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"Error de conexión: {e}")

if __name__ == "__main__":
    print("Probando operaciones de funciones...")
    test_integral_endpoint()
    print("\n" + "="*50)
    test_other_operations()
