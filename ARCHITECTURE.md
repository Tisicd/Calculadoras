# Arquitectura de SolvMath

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Matrix Calc   │  │ Functions Calc  │  │ LLM Module  │ │
│  │   (MathJax)     │  │   (MathJS)      │  │ (Ollama)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                     │                     │     │
│           └─────────────────────┼─────────────────────┘     │
│                                 │                           │
│                    ┌────────────▼────────────┐             │
│                    │     Main App (SPA)      │             │
│                    │   (Vanilla JS + CSS)    │             │
│                    └────────────┬────────────┘             │
└─────────────────────────────────┼───────────────────────────┘
                                  │ HTTP/REST API
┌─────────────────────────────────▼───────────────────────────┐
│                    BACKEND (FastAPI)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SymPy Service                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ Evaluate│ │ Derive  │ │Integrate│ │Simplify │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────┐
│                   LLM SERVICE (Optional)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Ollama/LocalAI                      │   │
│  │              (Mistral, CodeLlama)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Calculadora de Matrices
```
Usuario → Frontend → MathJax → Resultado
```

### 2. Calculadora de Funciones
```
Usuario → Frontend → Backend (SymPy) → Resultado
                ↓
            MathJS (verificación)
```

### 3. Explicaciones con LLM
```
Resultado → LLM Service → Explicación Natural
```

## Stack Tecnológico

### Frontend
- **HTML5 + CSS3 + JavaScript ES6+**
- **TailwindCSS**: Framework CSS utilitario
- **MathJax**: Renderizado de fórmulas matemáticas
- **MathJS**: Cálculos numéricos inmediatos
- **Lucide**: Iconos SVG

### Backend
- **Python 3.8+**: Lenguaje principal
- **FastAPI**: Framework web moderno y rápido
- **SymPy**: Biblioteca de matemáticas simbólicas
- **Uvicorn**: Servidor ASGI
- **Pydantic**: Validación de datos

### LLM (Opcional)
- **Ollama**: Herramienta para ejecutar LLMs localmente
- **Modelos**: Mistral 7B, CodeLlama, etc.
- **API REST**: Comunicación con el frontend

## Endpoints de la API

### Health Check
```http
GET /health
Response: {
  "status": "healthy",
  "sympy_version": "1.12",
  "message": "Servicio funcionando"
}
```

### Evaluar Función
```http
POST /function/evaluate
Request: {
  "function": "x^2 + 2*x + 1",
  "operation": "evaluate",
  "value": 2
}
Response: {
  "operation": "evaluate",
  "function": "x^2 + 2*x + 1",
  "result": "9",
  "steps": ["f(x) = x^2 + 2*x + 1", "f(2) = 4 + 4 + 1 = 9"],
  "latex_result": "9"
}
```

### Derivar Función
```http
POST /function/derive
Request: {
  "function": "x^2 + 2*x + 1",
  "operation": "derive"
}
Response: {
  "operation": "derive",
  "function": "x^2 + 2*x + 1",
  "result": "2*x + 2",
  "steps": ["Aplicando regla de potencia", "d/dx(x^2) = 2*x", "d/dx(2*x) = 2"],
  "latex_result": "2x + 2"
}
```

### Integrar Función
```http
POST /function/integrate
Request: {
  "function": "x^2 + 2*x + 1",
  "operation": "integrate"
}
Response: {
  "operation": "integrate",
  "function": "x^2 + 2*x + 1",
  "result": "x^3/3 + x^2 + x + C",
  "steps": ["Integrando término por término", "∫x^2 dx = x^3/3", "∫2*x dx = x^2"],
  "latex_result": "\\frac{x^3}{3} + x^2 + x + C"
}
```

### Simplificar Función
```http
POST /function/simplify
Request: {
  "function": "(x^2 + 2*x + 1)/(x + 1)",
  "operation": "simplify"
}
Response: {
  "operation": "simplify",
  "function": "(x^2 + 2*x + 1)/(x + 1)",
  "result": "x + 1",
  "steps": ["Factorizando numerador", "(x + 1)^2/(x + 1) = x + 1"],
  "latex_result": "x + 1"
}
```

## Configuración de Despliegue

### Desarrollo Local
```bash
# Backend
python start_backend.py

# Frontend
python -m http.server 8001

# LLM (opcional)
ollama serve
```

### Docker
```bash
# Solo backend
cd backend && docker-compose up

# Completo con frontend y LLM
docker-compose up --profile llm
```

### Producción
- **Nginx**: Proxy reverso y servidor de archivos estáticos
- **Gunicorn**: Servidor WSGI para FastAPI
- **PostgreSQL**: Base de datos para logs (opcional)
- **Redis**: Cache para resultados (opcional)

## Seguridad

### CORS
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu-dominio.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### Validación de Entrada
```python
class FunctionRequest(BaseModel):
    function: str
    operation: str
    value: Optional[float] = None
    
    @validator('function')
    def validate_function(cls, v):
        # Validar que la función sea segura
        if any(dangerous in v for dangerous in ['import', 'exec', 'eval']):
            raise ValueError('Función no permitida')
        return v
```

## Monitoreo y Logs

### Health Checks
- `/health`: Estado del servicio
- `/metrics`: Métricas de Prometheus (opcional)

### Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

## Escalabilidad

### Horizontal
- Múltiples instancias del backend con load balancer
- Cache compartido (Redis)
- Base de datos para persistencia

### Vertical
- Más CPU para cálculos SymPy intensivos
- Más RAM para modelos LLM grandes
- GPU para aceleración de LLM

## Consideraciones de Rendimiento

### Backend
- SymPy puede ser lento para expresiones muy complejas
- Considerar cache de resultados frecuentes
- Usar workers async para operaciones I/O

### Frontend
- Lazy loading de MathJax
- Debounce en inputs de función
- Virtual scrolling para listas largas de pasos

### LLM
- Cache de explicaciones generadas
- Modelos más pequeños para respuestas rápidas
- Streaming de respuestas largas

