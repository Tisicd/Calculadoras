# Guía de Despliegue - SolvMath

## 🚀 Inicio Rápido

### Windows
```cmd
# Ejecutar script automático
start.bat

# O manualmente
python start_backend.py
# En otra terminal
python -m http.server 8001
```

### Linux/macOS
```bash
# Ejecutar script automático
./start.sh

# O manualmente
python3 start_backend.py
# En otra terminal
python3 -m http.server 8001
```

### Docker (Recomendado)
```bash
# Solo backend
cd backend && docker-compose up --build

# Completo con frontend
docker-compose up --build

# Con LLM (Ollama)
docker-compose --profile llm up --build
```

## 📋 Verificación Post-Instalación

### 1. Backend API
```bash
curl http://localhost:8000/health
```
**Respuesta esperada:**
```json
{
  "status": "healthy",
  "sympy_version": "1.12",
  "message": "Servicio de cálculo simbólico funcionando correctamente"
}
```

### 2. Frontend
Abrir http://localhost:8001 en el navegador

### 3. LLM (Opcional)
```bash
curl http://localhost:11434/api/tags
```

## 🧪 Pruebas Automáticas

### Ejecutar suite de pruebas
```bash
python examples/test_calculator.py
```

### Pruebas manuales

#### Calculadora de Matrices
1. Ir a http://localhost:8001
2. Seleccionar "Matriz Inversa"
3. Probar matriz 2x2: `[[1,2],[3,4]]`
4. Verificar pasos detallados

#### Calculadora de Funciones
1. Seleccionar "Cálculo"
2. Probar función: `x^2 + 2*x + 1`
3. Operación: Derivar
4. Verificar resultado: `2*x + 2`

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Backend
export PYTHONPATH=/ruta/al/proyecto
export SYMPY_CACHE_DIR=/tmp/sympy_cache

# LLM
export OLLAMA_HOST=0.0.0.0
export OLLAMA_MODEL=mistral:7b
```

### Configuración de Producción

#### Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Frontend
    location / {
        root /var/www/solvmath;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Systemd Service
```ini
[Unit]
Description=SolvMath Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/solvmath/backend
ExecStart=/usr/bin/python3 -m uvicorn functions_service:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker Compose para Producción
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - .:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped
    profiles:
      - llm

volumes:
  ollama_data:
```

## 📊 Monitoreo

### Health Checks
- **Backend**: `GET /health`
- **Frontend**: Verificar que sirva index.html
- **LLM**: `GET http://localhost:11434/api/tags`

### Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Docker logs
docker-compose logs -f backend

# Systemd logs
journalctl -u solvmath-backend -f
```

### Métricas (Opcional)
```python
# Añadir a functions_service.py
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNT = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    REQUEST_DURATION.observe(time.time() - start_time)
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## 🔒 Seguridad

### Firewall
```bash
# Permitir solo puertos necesarios
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 8000/tcp  # Solo acceso local
```

### HTTPS (Nginx)
```nginx
server {
    listen 443 ssl;
    server_name tu-dominio.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Resto de configuración...
}
```

### Validación de Entrada
```python
import re

def validate_function(func_str):
    # Lista de funciones permitidas
    allowed_functions = [
        'sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'abs'
    ]
    
    # Patrón para validar función
    pattern = r'^[a-zA-Z0-9+\-*/^().\s]+$'
    
    if not re.match(pattern, func_str):
        raise ValueError("Función contiene caracteres no permitidos")
    
    # Verificar funciones permitidas
    for func in allowed_functions:
        if func in func_str.lower():
            continue
    
    return func_str
```

## 🚨 Solución de Problemas

### Backend no inicia
```bash
# Verificar Python
python --version

# Verificar dependencias
pip list | grep -E "(fastapi|sympy|uvicorn)"

# Verificar puerto
netstat -tulpn | grep :8000

# Logs detallados
python -m uvicorn functions_service:app --log-level debug
```

### Frontend no carga
```bash
# Verificar servidor
python -m http.server 8001

# Verificar archivos
ls -la index.html

# Verificar CORS en DevTools
```

### LLM no funciona
```bash
# Verificar Ollama
ollama list

# Verificar modelo
ollama pull mistral:7b

# Verificar servicio
systemctl status ollama
```

### Performance Issues
```bash
# Verificar recursos
htop
df -h

# Optimizar SymPy
export SYMPY_CACHE_DIR=/tmp/sympy_cache

# Usar cache Redis
pip install redis
```

## 📈 Escalabilidad

### Load Balancer (Nginx)
```nginx
upstream backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

### Cache Redis
```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cached_calculation(func_str, operation):
    cache_key = f"{operation}:{hash(func_str)}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    result = perform_calculation(func_str, operation)
    redis_client.setex(cache_key, 3600, json.dumps(result))
    return result
```

### Base de Datos (PostgreSQL)
```python
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Calculation(Base):
    __tablename__ = 'calculations'
    
    id = Column(String, primary_key=True)
    function = Column(String)
    operation = Column(String)
    result = Column(String)
    created_at = Column(DateTime)
```

## 🎯 Próximos Pasos

1. **Implementar autenticación** con JWT
2. **Añadir base de datos** para historial de cálculos
3. **Implementar cache** con Redis
4. **Añadir tests automatizados** con pytest
5. **Configurar CI/CD** con GitHub Actions
6. **Implementar métricas** con Prometheus
7. **Añadir más operaciones** matemáticas
8. **Optimizar rendimiento** con async/await

