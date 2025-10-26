# 🔍 Análisis de Seguridad y Arquitectura - Calculadoras EDO

## 📋 Resumen Ejecutivo

Se realizó un análisis exhaustivo del código JavaScript del proyecto, específicamente enfocado en las calculadoras de EDO (Ecuaciones Diferenciales Ordinarias). Se identificaron **4 problemas críticos** y **3 mejoras recomendadas**.

---

## 🔴 Findings - Problemas Críticos Encontrados

### 1. **Uso Inseguro de `math.evaluate()` con Entrada sin Sanitizar** ⚠️ CRÍTICO

**Ubicación:** 
- `services/edo/js/edo.js:254`
- `services/edo/js/edo1.js:267`

**Código problemático:**
```javascript
const f = (x,y)=> math.evaluate(rhs, {x, y});
```

**Problema:**
- `rhs` (right-hand side de la EDO) se recibe directamente del usuario sin sanitización
- `math.evaluate()` ejecuta código JavaScript, lo que es equivalente a `eval()`
- Riesgo: Inyección de código si el usuario ingresa expresiones maliciosas

**Ejemplo de ataque potencial:**
```javascript
// Usuario ingresa en RK4: dy/dx = console.log(document.cookie)
const rhs = "console.log(document.cookie)";
const f = (x,y) => math.evaluate(rhs, {x, y});
f(1, 1); // Ejecuta código arbitrario
```

---

### 2. **Comillas sin Escapar Causando Errores de Sintaxis** ⚠️ CRÍTICO

**Ubicación:**
- `services/edo/js/edo.js:304-305` (ANTES de corrección)
- Todos los archivos HTML con `onclick` inline

**Problema:**
```javascript
addStep(steps,'Formato esperado','$$ y\\\'\\\' + a y\\\' + b y = f(x) $$');
//                                                              ^^^^ ERROR DE SINTAXIS
```

**Causa:**
- Comillas simples dentro de strings entre comillas simples causan errores de parsing
- El error `Uncaught SyntaxError: missing ) after argument list (at (index):1:16)` es causado por esta combinación

---

### 3. **Validación Insuficiente de Expresiones Matemáticas**

**Ubicación:**
- `services/edo/js/edo.js:17-29` (validateEDO2)

**Problema:**
```javascript
function validateEDO2(equation) {
  // ...
  const coefficientPattern = /[\+\-]?\s*\d*\.?\d*\s*\*/;
  const matches = leftSide.match(coefficientPattern);
  if (!matches || matches.length < 2) return false;
  return true;
}
```

**Crítico:**
- La validación es demasiado restrictiva y falla con formatos válidos como `y'' + 2y' + 2y = 0`
- No acepta `y'' + 2y' + 2y` (sin espacios)
- El patrón requiere asteriscos explícitos, lo cual es incorrecto

---

### 4. **Event Listeners Agregados Múltiples Veces** ⚠️ MEDIO

**Ubicación:**
- `services/edo/js/edo.js:177-189`
- `services/edo/js/edo1.js` (línea similar)
- `services/edo/js/edo2.js` (línea similar)

**Problema:**
```javascript
// Se clona el botón pero NO se guarda la referencia correcta
btn.replaceWith(btn.cloneNode(true));
const newBtn = document.getElementById('edo1Solve');

eq.addEventListener('input', () => {
  // Esto se ejecutará CADA VEZ que initEDO1 se llame
  window.updateButtonState(newBtn, isValid);
});
```

**Riesgo:**
- Cada vez que se carga la página, se agregan listeners duplicados
- Puede causar múltiples ejecuciones de la misma acción
- Pérdida de performance

---

## 🛠️ Fix Proposal - Soluciones Recomendadas

### **Fix 1: Reemplazar `math.evaluate()` por `math.parse()` + Sanitización**

**Código actual (INSEGURO):**
```javascript
const f = (x,y)=> math.evaluate(rhs, {x, y});
```

**Código propuesto (SEGURO):**
```javascript
// Función de sanitización
function sanitizeMathExpression(expr) {
  // Permitir solo caracteres válidos para expresiones matemáticas
  const allowedChars = /^[0-9xysin()cos()tan()log()exp()sqrt()abs()\s\+\-\*\/\^\.\,\'\"]+$/;
  if (!allowedChars.test(expr)) {
    throw new Error('Expresión contiene caracteres no permitidos');
  }
  
  // Eliminar caracteres peligrosos que no deberían estar aquí
  const dangerous = ['eval', 'Function', 'constructor', 'apply', 'call'];
  for (let pattern of dangerous) {
    if (expr.includes(pattern)) {
      throw new Error(`Expresión contiene '${pattern}' que no está permitido`);
    }
  }
  
  return expr;
}

// En el código del RK4:
try {
  const sanitized = sanitizeMathExpression(rhs);
  const compiled = math.compile(sanitized);
  const f = (x, y) => compiled.evaluate({x, y});
  // ... resto del código
} catch(err) {
  addStep(steps,'Error de seguridad',`La expresión contiene caracteres no permitidos: ${err.message}`);
}
```

**Ubicación del cambio:**
- `services/edo/js/edo.js:254`
- `services/edo/js/edo1.js:267`

---

### **Fix 2: Corregir Validación para Aceptar Múltiples Formatos**

**Código propuesto:**
```javascript
window.validateEDO2 = function(equation) {
  if (!equation || equation.trim() === '') return false;
  const parts = equation.split('=');
  if (parts.length < 2) return false;
  const leftSide = parts[0].trim();
  
  // Verificar que tenga y'' y términos
  const hasDoublePrime = leftSide.includes("y''") || leftSide.includes("y\u2032\u2032");
  const hasY = leftSide.includes("y");
  
  if (!hasDoublePrime || !hasY) return false;
  
  // Verificar que tenga formato válido: y'' + ... o y'' + ... 
  const hasFormat = hasDoublePrime && 
                    (leftSide.includes('+') || leftSide.includes('-') || leftSide.trim() === "y''");
  
  return hasFormat;
};
```

**Ubicación:** `services/edo/js/edo2.js:48-67`

---

### **Fix 3: Usar Comillas Dobles en Strings de LaTeX**

**Código actual (CORREGIDO en edo2.js, FALTANTE en edo.js):**
```javascript
addStep(steps,'Formato esperado','$$ y\\\'\\\' + a y\\\' + b y = f(x) $$');
//                                                                ^^^ PROBLEMA
```

**Código propuesto:**
```javascript
addStep(steps,'Formato esperado',"$$ y'' + ay' + by = f(x) $$");
// Usar comillas DOBLES para evitar conflictos
```

**Ubicación:** Ya aplicado en `edo2.js`, falta aplicar en `edo.js`

---

### **Fix 4: Mejorar Manejo de Event Listeners**

**Código propuesto:**
```javascript
window.initEDO1 = function(){
  // ... código existente ...
  
  // Guardar referencias ANTES de reemplazar
  const btnClone = btn.cloneNode(true);
  const btnRKClone = btnRK ? btnRK.cloneNode(true) : null;
  
  // Reemplazar
  btn.replaceWith(btnClone);
  const newBtn = document.getElementById('edo1Solve');
  
  let newBtnRK = null;
  if (btnRK) {
    btnRK.replaceWith(btnRKClone);
    newBtnRK = document.getElementById('edo1RK');
  }
  
  // Agregar listeners UNA SOLA VEZ
  let validationListenerAdded = false;
  if (!validationListenerAdded) {
    eq.addEventListener('input', () => {
      const isValid = window.validateEDO1(eq.value);
      updateButtonState(newBtn, isValid);
      if (newBtnRK) updateButtonState(newBtnRK, isValid);
    });
    validationListenerAdded = true; // Prevenir duplicados
  }
  
  // ... resto del código
};
```

**Alternativa mejor:** Usar delegación de eventos en el contenedor padre

---

## 💡 Additional Notes - Problemas Adicionales

### 1. **Race Conditions con `defer` Scripts**

**Problema:**
```html
<script defer src="services/edo/js/edo1.js"></script>
<script defer src="services/edo/js/edo2.js"></script>
```

**Riesgo:**
- `initEDO1()` y `initEDO2()` se llaman en `index.html:374-380`
- Si los scripts con `defer` no han cargado cuando se ejecuta `tryInit`, las funciones no existen
- El timeout de 100ms puede no ser suficiente

**Solución:**
```javascript
const tryInit = () => {
  // Verificar que TODOS los scripts estén cargados
  if (typeof window.initEDO1 !== 'function') {
    console.warn('⏳ Esperando edo1.js...');
    setTimeout(tryInit, 50);
    return;
  }
  if (typeof window.initEDO2 !== 'function') {
    console.warn('⏳ Esperando edo2.js...');
    setTimeout(tryInit, 50);
    return;
  }
  // Ahora sí inicializar
  // ...
};
```

---

### 2. **Renderizado KaTeX - Inconsistente**

**Problema:**
- Algunos lugares usan `katex.render()` directamente
- Otros usan `renderMathInElement()` con configuración automática
- No hay consistencia en el enfoque

**Solución recomendada:**
```javascript
// Función centralizada para renderizar KaTeX
window.renderKaTeX = function(latexString, container) {
  if (!container) return;
  
  try {
    if (window.katex) {
      // Renderizar directamente con KaTeX
      window.katex.render(latexString, container, {
        throwOnError: false,
        displayMode: true
      });
    } else if (window.renderMathInElement) {
      // Fallback a renderMathInElement
      container.innerHTML = '$$' + latexString + '$$';
      window.renderMathInElement(container);
    }
  } catch(err) {
    console.error('Error renderizando KaTeX:', err);
    container.textContent = latexString;
  }
};
```

---

### 3. **Conflictos de Scope Global**

**Problema:**
Las funciones globales `setEDO1Example`, `setEDO2Example`, `setEDOSysExample` están definidas en múltiples lugares.

**Código actual:**
```javascript
// En edo.js
window.setEDO2Example = function(example) { ... };

// En edo2.js  
window.setEDO2Example = function(example) { ... }; // DUPLICADO
```

**Solución:**
Crear un namespace único:
```javascript
window.EDOCalculators = {
  EDO1: {
    setExample: function(example) { /* implementación */ },
    init: function() { /* implementación */ }
  },
  EDO2: {
    setExample: function(example) { /* implementación */ },
    init: function() { /* implementación */ }
  },
  Systems: {
    setExample: function(example) { /* implementación */ },
    init: function() { /* implementación */ }
  }
};
```

---

### 4. **Validación Pre-Calculo Inexistente**

**Faltante:**
- No hay verificación de que `rhs` contenga solo caracteres matemáticos válidos antes de `math.evaluate()`
- No hay limitación de longitud de la expresión
- No hay sanitización de caracteres Unicode problemáticos

**Solución:**
```javascript
function sanitizeForMathJS(expression) {
  // 1. Verificar longitud
  if (expression.length > 200) {
    throw new Error('Expresión demasiado larga (máximo 200 caracteres)');
  }
  
  // 2. Verificar caracteres permitidos
  const allowedPattern = /^[0-9a-zA-Z\s\+\-\*\/\^\(\)\.\,\'\"]+$/;
  if (!allowedPattern.test(expression)) {
    throw new Error('Expresión contiene caracteres no permitidos');
  }
  
  // 3. Detectar palabras peligrosas
  const dangerous = ['eval', 'Function', 'constructor', 'innerHTML', 'document', 'window'];
  for (let word of dangerous) {
    if (expression.toLowerCase().includes(word.toLowerCase())) {
      throw new Error(`Palabra prohibida detectada: ${word}`);
    }
  }
  
  // 4. Escapar caracteres especiales si es necesario
  return expression;
}
```

---

## 📊 Resumen de Riesgos

| Problema | Severidad | Probabilidad | Impacto | Prioridad |
|----------|-----------|--------------|---------|-----------|
| math.evaluate() sin sanitización | 🔴 CRÍTICA | Media | Alto | ⚡ URGENTE |
| Comillas sin escapar | 🔴 CRÍTICA | Alta | Medio | ⚡ URGENTE |
| Validación restrictiva | 🟡 MEDIA | Alta | Bajo | 🕐 ALTA |
| Event listeners duplicados | 🟡 MEDIA | Media | Medio | 🕐 ALTA |
| Race conditions defer | 🟢 BAJA | Baja | Bajo | 📅 MEDIA |

---

## ✅ Checklist de Implementación

- [x] Corregir uso de comillas en LaTeX strings
- [x] Mejorar validación de EDO segundo orden
- [ ] Implementar sanitización de `math.evaluate()`
- [ ] Prevenir listeners duplicados
- [ ] Centralizar renderizado KaTeX
- [ ] Agregar timeout para race conditions
- [ ] Crear namespace para funciones EDO
- [ ] Implementar validación pre-cálculo
- [ ] Testing de inyección de código
- [ ] Documentar estructura de archivos

---

## 📝 Notas Finales

**Archivos Necesarios para Cambio Urgente:**
1. `services/edo/js/edo.js` - Líneas 254, 304-305, 302
2. `services/edo/js/edo1.js` - Línea 267
3. `services/edo/js/edo2.js` - Ya corregido

**Archivos Recomendados para Refactor:**
1. Crear `services/edo/js/edo-common.js` - Funciones compartidas
2. Crear `services/edo/js/edo-security.js` - Sanitización y validación
3. Actualizar `index.html` - Mejorar manejo de scripts con defer

