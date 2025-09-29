"""
Backend de Calculadora de Funciones
Microservicio con FastAPI + SymPy para cálculos simbólicos
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sympy as sp
from sympy import latex, simplify, diff, integrate, Symbol
import uvicorn
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="Calculadora de Funciones API",
    description="API para cálculos simbólicos con SymPy",
    version="1.0.0"
)

# Configurar CORS para permitir requests del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class FunctionRequest(BaseModel):
    function: str
    operation: str
    value: Optional[float] = None
    variable: Optional[str] = "x"

class FunctionResponse(BaseModel):
    operation: str
    function: str
    result: str
    steps: List[str]
    latex_result: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    sympy_version: str
    message: str

# Variables simbólicas comunes
x = Symbol('x')
y = Symbol('y')
t = Symbol('t')

# Diccionario de variables disponibles
VARIABLES = {
    'x': x,
    'y': y,
    't': t
}

def parse_function(func_str: str, variable: str = 'x') -> sp.Expr:
    """
    Parsea una función string a expresión SymPy
    Maneja conversiones comunes para compatibilidad
    """
    try:
        # Reemplazos comunes para compatibilidad con MathJS
        replacements = {
            '^': '**',  # Potencia
            'sin': 'sin',
            'cos': 'cos', 
            'tan': 'tan',
            'log': 'log',
            'ln': 'log',
            'exp': 'exp',
            'sqrt': 'sqrt',
            'abs': 'abs',
            'pi': 'pi',
            'e': 'E'
        }
        
        # Aplicar reemplazos
        processed_func = func_str
        for old, new in replacements.items():
            processed_func = processed_func.replace(old, new)
        
        # Parsear con SymPy
        expr = sp.sympify(processed_func)
        
        # Verificar que la variable esté presente
        if variable not in str(expr.free_symbols):
            logger.warning(f"Variable '{variable}' no encontrada en la expresión")
            
        return expr
        
    except Exception as e:
        logger.error(f"Error parseando función '{func_str}': {e}")
        raise HTTPException(status_code=400, detail=f"Error parseando función: {str(e)}")

def generate_steps(operation: str, expr: sp.Expr, result: sp.Expr, variable: str = 'x') -> List[str]:
    """
    Genera pasos detallados para diferentes operaciones
    """
    steps = []
    
    if operation == "evaluate":
        steps.append(f"f({variable}) = {expr}")
        steps.append(f"Sustituyendo {variable} en la expresión")
        steps.append(f"Resultado: {result}")
        
    elif operation == "derive":
        steps.append(f"f({variable}) = {expr}")
        steps.append(f"Aplicando regla de derivación: d/d{variable}(f({variable}))")
        
        # Mostrar reglas aplicadas según el tipo de función
        if expr.is_polynomial():
            steps.append("Aplicando regla de potencia: d/dx(x^n) = n*x^(n-1)")
        elif expr.has(sp.sin) or expr.has(sp.cos):
            steps.append("Aplicando reglas trigonométricas")
        elif expr.has(sp.exp):
            steps.append("Aplicando regla exponencial: d/dx(e^x) = e^x")
        elif expr.has(sp.log):
            steps.append("Aplicando regla logarítmica: d/dx(ln(x)) = 1/x")
            
        steps.append(f"Resultado: f'({variable}) = {result}")
        
    elif operation == "integrate":
        steps.append(f"f({variable}) = {expr}")
        steps.append(f"Calculando integral: ∫f({variable}) d{variable}")
        
        # Mostrar métodos aplicados
        if expr.is_polynomial():
            steps.append("Aplicando regla de integración de polinomios")
        elif expr.has(sp.sin) or expr.has(sp.cos):
            steps.append("Aplicando integrales trigonométricas")
        elif expr.has(sp.exp):
            steps.append("Aplicando integración exponencial")
        elif expr.has(sp.log):
            steps.append("Aplicando integración por partes")
            
        steps.append(f"Resultado: ∫f({variable}) d{variable} = {result} + C")
        
    elif operation == "simplify":
        steps.append(f"Expresión original: {expr}")
        steps.append("Aplicando simplificaciones algebraicas")
        steps.append(f"Resultado simplificado: {result}")
    
    return steps

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de salud del servicio"""
    return HealthResponse(
        status="healthy",
        sympy_version=sp.__version__,
        message="Servicio de cálculo simbólico funcionando correctamente"
    )

@app.post("/function/evaluate", response_model=FunctionResponse)
async def evaluate_function(request: FunctionRequest):
    """
    Evalúa una función en un punto específico
    """
    try:
        logger.info(f"Evaluando función: {request.function} en x={request.value}")
        
        if request.value is None:
            raise HTTPException(status_code=400, detail="Se requiere un valor para evaluar")
        
        # Parsear función
        expr = parse_function(request.function, request.variable)
        
        # Evaluar en el punto
        result_value = expr.subs(request.variable, request.value)
        result_simplified = simplify(result_value)
        
        # Generar pasos
        steps = generate_steps("evaluate", expr, result_simplified, request.variable)
        
        return FunctionResponse(
            operation="evaluate",
            function=request.function,
            result=str(result_simplified),
            steps=steps,
            latex_result=latex(result_simplified)
        )
        
    except Exception as e:
        logger.error(f"Error en evaluación: {e}")
        raise HTTPException(status_code=500, detail=f"Error en evaluación: {str(e)}")

@app.post("/function/derive", response_model=FunctionResponse)
async def derive_function(request: FunctionRequest):
    """
    Calcula la derivada de una función
    """
    try:
        logger.info(f"Derivando función: {request.function}")
        
        # Parsear función
        expr = parse_function(request.function, request.variable)
        
        # Calcular derivada
        derivative = diff(expr, request.variable)
        derivative_simplified = simplify(derivative)
        
        # Generar pasos
        steps = generate_steps("derive", expr, derivative_simplified, request.variable)
        
        return FunctionResponse(
            operation="derive",
            function=request.function,
            result=str(derivative_simplified),
            steps=steps,
            latex_result=latex(derivative_simplified)
        )
        
    except Exception as e:
        logger.error(f"Error en derivación: {e}")
        raise HTTPException(status_code=500, detail=f"Error en derivación: {str(e)}")

@app.post("/function/integrate", response_model=FunctionResponse)
async def integrate_function(request: FunctionRequest):
    """
    Calcula la integral de una función
    """
    try:
        logger.info(f"Integrando función: {request.function}")
        
        # Parsear función
        expr = parse_function(request.function, request.variable)
        
        # Calcular integral
        integral = integrate(expr, request.variable)
        
        # Si la integral no es simbólica, intentar métodos numéricos
        if integral == expr:
            # Integral no se puede resolver simbólicamente
            integral = f"Integral no resuelta simbólicamente: ∫{expr} d{request.variable}"
            result_str = str(integral)
        else:
            integral_simplified = simplify(integral)
            result_str = str(integral_simplified)
        
        # Generar pasos
        steps = generate_steps("integrate", expr, integral_simplified if '∫' not in str(integral) else integral, request.variable)
        
        return FunctionResponse(
            operation="integrate",
            function=request.function,
            result=result_str,
            steps=steps,
            latex_result=latex(integral) if '∫' not in str(integral) else None
        )
        
    except Exception as e:
        logger.error(f"Error en integración: {e}")
        raise HTTPException(status_code=500, detail=f"Error en integración: {str(e)}")

@app.post("/function/simplify", response_model=FunctionResponse)
async def simplify_function(request: FunctionRequest):
    """
    Simplifica una expresión matemática
    """
    try:
        logger.info(f"Simplificando función: {request.function}")
        
        # Parsear función
        expr = parse_function(request.function, request.variable)
        
        # Simplificar
        simplified = simplify(expr)
        
        # Generar pasos
        steps = generate_steps("simplify", expr, simplified, request.variable)
        
        return FunctionResponse(
            operation="simplify",
            function=request.function,
            result=str(simplified),
            steps=steps,
            latex_result=latex(simplified)
        )
        
    except Exception as e:
        logger.error(f"Error en simplificación: {e}")
        raise HTTPException(status_code=500, detail=f"Error en simplificación: {str(e)}")

@app.get("/examples")
async def get_examples():
    """
    Retorna ejemplos de funciones para probar
    """
    examples = {
        "polynomials": [
            "x^2 + 2*x + 1",
            "3*x^3 - 2*x^2 + x - 5",
            "x^4 - 16"
        ],
        "trigonometric": [
            "sin(x)",
            "cos(x)^2",
            "sin(x)*cos(x)",
            "tan(x)"
        ],
        "exponential": [
            "exp(x)",
            "2^x",
            "x*exp(x)",
            "exp(-x^2)"
        ],
        "logarithmic": [
            "log(x)",
            "x*log(x)",
            "log(x^2 + 1)"
        ],
        "rational": [
            "1/(x^2 + 1)",
            "x/(x^2 - 4)",
            "(x^2 + 1)/(x - 1)"
        ]
    }
    return examples

if __name__ == "__main__":
    uvicorn.run(
        "functions_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

