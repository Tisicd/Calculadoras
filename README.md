# SolvMath - Calculadora Matemática Avanzada

Una calculadora web completa que combina **MathJS**, **SymPy** y **LLM local** para proporcionar cálculos matemáticos con explicaciones paso a paso.

## 🚀 Características

### Calculadora de Matrices
- ✅ Cálculo de matrices inversas paso a paso
- ✅ Múltiples métodos: Gauss-Jordan, Adjunta/Cofactores, Fórmula 2x2
- ✅ Visualización con MathJax
- ✅ Soporte para matrices 2x2, 3x3 y NxN

### Calculadora de Funciones
- ✅ Evaluación de funciones en puntos específicos
- ✅ Derivadas simbólicas
- ✅ Integrales (definidas e indefinidas)
- ✅ Simplificación de expresiones
- ✅ Paso a paso detallado con SymPy
- ✅ Verificación numérica con MathJS

### Explicaciones Inteligentes
- ✅ Integración con LLM local (Ollama/LocalAI)
- ✅ Explicaciones en lenguaje natural
- ✅ Fallback automático cuando LLM no está disponible

## 🏗️ Arquitectura

```
Frontend (Vanilla JS + TailwindCSS)
├── MathJS (cálculos inmediatos)
├── SymPy Backend (cálculos simbólicos)
└── LLM Local (explicaciones naturales)
```

### Stack Tecnológico

**Frontend:**
- HTML5 + CSS3 + JavaScript ES6+
- TailwindCSS para estilos
- MathJax para renderizado matemático
- MathJS para cálculos numéricos

**Backend:**
- Python 3.8+
- FastAPI para API REST
- SymPy para álgebra simbólica
- Uvicorn como servidor ASGI

**LLM (Opcional):**
- Ollama o LocalAI
- Modelos: Mistral, CodeLlama, etc.

## 📋 Requisitos

### Sistema
- Python 3.8 o superior
- Navegador web moderno
- 2GB RAM mínimo
- 1GB espacio en disco

### Opcional (para LLM)
- Docker (para Ollama)
- 4GB+ RAM (para modelos medianos)
- GPU compatible (recomendado)

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd calculadoras
```

### 2. Iniciar el backend
```bash
# Opción 1: Script automático
python start_backend.py

# Opción 2: Manual
cd backend
pip install -r requirements.txt
python functions_service.py
```

### 3. Iniciar el frontend
```bash
# Servir archivos estáticos
python -m http.server 8001

# O usar cualquier servidor web estático
```

### 4. Configurar LLM (Opcional)
```bash
# Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Descargar modelo
ollama pull mistral:7b

# Iniciar servicio
ollama serve
```

## 🐳 Docker (Recomendado)

### Backend con Docker
```bash
cd backend
docker-compose up --build
```

### Con Docker Compose completo
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  ollama_data:
```

## 📖 Uso

### 1. Acceder a la aplicación
Abre `http://localhost:8001` en tu navegador

### 2. Calculadora de Matrices
- Selecciona "Matriz Inversa" en el menú lateral
- Elige el tamaño de la matriz (2x2, 3x3, etc.)
- Completa los valores
- Presiona "Calcular pasos previos"
- Selecciona el método de resolución

### 3. Calculadora de Funciones
- Selecciona "Cálculo" en el menú lateral
- Ingresa una función (ej: `x^2 + 2*x + 1`)
- Elige la operación (evaluar, derivar, integrar, simplificar)
- Presiona "Calcular"
- Revisa los pasos detallados y la explicación

## 🔧 Configuración

### Backend (SymPy)
```python
# backend/functions_service.py
app = FastAPI(
    title="Calculadora de Funciones API",
    description="API para cálculos simbólicos con SymPy"
)
```

### LLM (Ollama)
```javascript
// calculators/explainWithLLM.js
const llmExplainer = new LLMExplainer({
  llmUrl: 'http://localhost:11434',
  model: 'mistral:7b'
});
```

## 📝 Ejemplos de Funciones

### Polinomios
```
x^2 + 2*x + 1
3*x^3 - 2*x^2 + x - 5
x^4 - 16
```

### Trigonométricas
```
sin(x)
cos(x)^2
sin(x)*cos(x)
tan(x)
```

### Exponenciales
```
exp(x)
2^x
x*exp(x)
exp(-x^2)
```

### Logarítmicas
```
log(x)
x*log(x)
log(x^2 + 1)
```

### Racionales
```
1/(x^2 + 1)
x/(x^2 - 4)
(x^2 + 1)/(x - 1)
```

## 🧪 Testing

### Backend
```bash
cd backend
python -m pytest tests/
```

### Frontend
```bash
# Abrir DevTools y ejecutar tests
npm test  # Si se configura package.json
```

## 🐛 Solución de Problemas

### Backend no inicia
- Verificar que Python 3.8+ esté instalado
- Revisar que todas las dependencias estén instaladas
- Comprobar que el puerto 8000 esté libre

### Frontend no se conecta
- Verificar que el backend esté ejecutándose
- Comprobar CORS en el navegador
- Revisar la consola del navegador

### LLM no funciona
- Verificar que Ollama esté instalado y ejecutándose
- Comprobar que el modelo esté descargado
- Revisar logs de Ollama

## 📊 API Endpoints

### Health Check
```http
GET /health
```

### Evaluar función
```http
POST /function/evaluate
{
  "function": "x^2 + 2*x + 1",
  "operation": "evaluate",
  "value": 2
}
```

### Derivar función
```http
POST /function/derive
{
  "function": "x^2 + 2*x + 1",
  "operation": "derive"
}
```

### Integrar función
```http
POST /function/integrate
{
  "function": "x^2 + 2*x + 1",
  "operation": "integrate"
}
```

### Simplificar función
```http
POST /function/simplify
{
  "function": "(x^2 + 2*x + 1)/(x + 1)",
  "operation": "simplify"
}
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [SymPy](https://www.sympy.org/) - Biblioteca de matemáticas simbólicas
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web moderno
- [MathJS](https://mathjs.org/) - Biblioteca de matemáticas para JavaScript
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS utilitario
- [Ollama](https://ollama.ai/) - Herramienta para ejecutar LLMs localmente

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa la sección de [Solución de Problemas](#-solución-de-problemas)
2. Busca en los [Issues](https://github.com/tu-usuario/calculadoras/issues)
3. Crea un nuevo issue si no encuentras solución

---

**Desarrollado con ❤️ para la educación matemática**

