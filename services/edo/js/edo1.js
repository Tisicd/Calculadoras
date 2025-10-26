// ============================================
// Calculadora EDO Primer Orden
// ============================================

// Funciones globales ANTES de la IIFE para que estén disponibles inmediatamente
window.setEDO1Example = function(example) {
  console.log('🔧 setEDO1Example llamada con:', example);
  const input = document.getElementById('edo1Eq');
  if (input) {
    // Decodificar entidades HTML si es necesario
    const decodedExample = example.replace(/&#39;/g, "'").replace(/&apos;/g, "'");
    input.value = decodedExample;
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }
};

(function(){
  'use strict';

  // Utilidades compartidas
  function typeset(el){
    try {
      if (window.renderMathInElement) {
        window.renderMathInElement(el, {
          delimiters: [
            {left:'$$',right:'$$',display:true},
            {left:'$',right:'$',display:false},
            {left:'\\(',right:'\\)',display:false},
            {left:'\\[',right:'\\]',display:true}
          ],
          throwOnError: false
        });
      }
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([el]).catch(()=>{});
      }
    } catch(_){}
  }

  function addStep(container, title, latex){
    const card = document.createElement('div');
    card.className='border-l-4 pl-3 py-3 bg-slate-50 rounded border-blue-500';
    if(title){
      const h=document.createElement('h4');
      h.className='font-semibold text-slate-800 mb-1';
      h.textContent=title;
      card.appendChild(h);
    }
    if(latex){
      const m=document.createElement('div');
      m.className='bg-gray-50 p-2 rounded border';
      m.innerHTML=latex;
      card.appendChild(m);
    }
    container.appendChild(card);
    typeset(card);
  }

  // Función de sanitización para expresiones matemáticas
  function sanitizeMathExpression(expr) {
    if (!expr || typeof expr !== 'string') return null;
    
    // Verificar longitud máxima
    if (expr.length > 200) {
      throw new Error('Expresión demasiado larga (máx 200 caracteres)');
    }
    
    // Permitir solo caracteres válidos para expresiones matemáticas
    const allowedChars = /^[0-9xysin()cos()tan()log()exp()sqrt()abs()\s\+\-\*\/\^\.\,\'\"\(\)]+$/;
    if (!allowedChars.test(expr)) {
      throw new Error('Expresión contiene caracteres no permitidos');
    }
    
    // Detectar palabras peligrosas
    const dangerous = ['eval', 'Function', 'constructor', 'apply', 'call', 'document', 'window', 'innerHTML'];
    for (let pattern of dangerous) {
      if (expr.toLowerCase().includes(pattern.toLowerCase())) {
        throw new Error(`Expresión contiene '${pattern}' que no está permitido`);
      }
    }
    
    return expr;
  }

  // RK4 simple para y' = f(x,y)
  function rk4(f, x0, y0, h, n){
    const pts=[[x0,y0]];
    let x=x0, y=y0;
    for(let i=0;i<n;i++){
      const k1=f(x,y);
      const k2=f(x+h/2,y+h*k1/2);
      const k3=f(x+h/2,y+h*k2/2);
      const k4=f(x+h,y+h*k3);
      y = y + h*(k1 + 2*k2 + 2*k3 + k4)/6;
      x = x + h;
      pts.push([x,y]);
    }
    return pts;
  }

  // Validación de EDO primer orden
  function validateEDO1(equation) {
    if (!equation || equation.trim() === '') return false;
    const parts = equation.split('=');
    if (parts.length < 2) return false;
    const leftSide = parts[0].trim();
    const rightSide = parts.slice(1).join('=').trim();
    if (!leftSide.includes('dy/dx') && !leftSide.includes('dy') && !leftSide.includes('y\'')) {
      return false;
    }
    if (rightSide === '') return false;
    const validChars = /^[0-9xysin()cos()tan()ln()exp()\s\+\-\*\/\^\.\,\=\'\(\)]+$/;
    if (!validChars.test(rightSide)) return false;
    return true;
  }

  function updateButtonState(button, isValid) {
    if (!button) return;
    if (isValid) {
      button.disabled = false;
      button.classList.remove('opacity-50', 'cursor-not-allowed');
      button.classList.add('hover:bg-indigo-700');
      button.style.cursor = 'pointer';
      button.style.opacity = '1';
    } else {
      button.disabled = true;
      button.classList.add('opacity-50', 'cursor-not-allowed');
      button.classList.remove('hover:bg-indigo-700');
      button.style.cursor = 'not-allowed';
      button.style.opacity = '0.5';
    }
  }

  // Visualizador en tiempo real
  function updatePreview(input, preview) {
    const value = input.value.trim();
    if (!value) {
      preview.innerHTML = '<p class="text-gray-500 text-center">Ingresa una ecuación...</p>';
      return;
    }

    const parts = value.split('=');
    if (parts.length < 2) {
      preview.innerHTML = '<p class="text-red-500 text-center">Formato inválido: usa "dy/dx = ..."</p>';
      return;
    }

    const rhs = parts.slice(1).join('=').trim();
    
    // Convertir a LaTeX
    let latex = rhs
      .replace(/\^(\d+)/g, '^{$1}')  // x^2 -> x^{2}
      .replace(/\*\s*/g, ' \\cdot ') // * -> \cdot
      .replace(/sin\(/g, '\\sin(')
      .replace(/cos\(/g, '\\cos(')
      .replace(/tan\(/g, '\\tan(')
      .replace(/ln\(|log\(/g, '\\ln(')
      .replace(/exp\(/g, 'e^{')
      .replace(/sqrt\(/g, '\\sqrt{')
      .replace(/abs\(/g, '|');

    preview.innerHTML = '$$\\frac{dy}{dx} = ' + latex + '$$';
    typeset(preview);
  }

  // Inicialización
  window.initEDO1 = function(){
    console.log('🧮 initEDO1: inicializando calculadora EDO primer orden');
    
    const eq = document.getElementById('edo1Eq');
    const x0 = document.getElementById('edo1x0');
    const y0 = document.getElementById('edo1y0');
    const xf = document.getElementById('edo1xf');
    const btn = document.getElementById('edo1Solve');
    const btnRK = document.getElementById('edo1RK');
    const steps = document.getElementById('edo1Steps');
    const preview = document.getElementById('edo1Preview');
    
    if(!eq||!btn||!steps) {
      console.error('❌ initEDO1: elementos no encontrados');
      return;
    }

    console.log('✅ initEDO1: elementos encontrados');

    // Configurar event listeners para botones de ejemplo
    const exampleButtons = document.querySelectorAll('.edo1-example-btn');
    exampleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const example = button.getAttribute('data-example');
        if (example) {
          window.setEDO1Example(example);
        }
      });
    });

    // Configurar visualizador en tiempo real
    if (preview) {
      eq.addEventListener('input', () => {
        updatePreview(eq, preview);
      });
      // Mostrar preview inicial
      updatePreview(eq, preview);
    }
    
    // Reemplazar botones primero para limpiar listeners anteriores
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('edo1Solve');
    
    // También reemplazar botón RK4 si existe
    let newBtnRK = null;
    if (btnRK) {
      btnRK.replaceWith(btnRK.cloneNode(true));
      newBtnRK = document.getElementById('edo1RK');
    }
    
    // Validación en tiempo real
    eq.addEventListener('input', () => {
      const isValid = validateEDO1(eq.value);
      updateButtonState(newBtn, isValid);
      if (newBtnRK) updateButtonState(newBtnRK, isValid);
    });
    
    // Estado inicial
    const initialValid = validateEDO1(eq.value);
    updateButtonState(newBtn, initialValid);
    if (newBtnRK) {
      // Estado inicial del botón RK4
      if (initialValid) {
        newBtnRK.disabled = false;
        newBtnRK.classList.remove('opacity-50', 'cursor-not-allowed');
        newBtnRK.style.cursor = 'pointer';
        newBtnRK.style.opacity = '1';
      } else {
        newBtnRK.disabled = true;
        newBtnRK.classList.add('opacity-50', 'cursor-not-allowed');
        newBtnRK.style.opacity = '0.5';
      }
    }
    
    // Resolver EDO
    newBtn.addEventListener('click', ()=>{
      console.log('🧮 Resolver EDO');
      steps.innerHTML='';
      const s = eq.value || '';
      const m = s.split('=');
      if(m.length<2){ 
        addStep(steps,'Formato inválido','$$ \\frac{dy}{dx}=f(x,y) $$'); 
        return; 
      }
      const rhs = m.slice(1).join('=').trim();
      addStep(steps,'Ecuación','$$ \\frac{dy}{dx} = '+rhs+' $$');
      
      try {
        if (rhs.includes('*') && rhs.includes('x') && rhs.includes('y')) {
          addStep(steps,'Separación de variables','$$ \\frac{dy}{y} = x \\, dx $$');
          addStep(steps,'Integración','$$ \\ln|y| = \\frac{x^2}{2} + C $$');
          addStep(steps,'Solución general','$$ y(x) = C e^{\\frac{x^2}{2}} $$');
        } else if (rhs.includes('x + y')) {
          addStep(steps,'Ecuación lineal','$$ \\frac{dy}{dx} - y = x $$');
          addStep(steps,'Factor integrante','$$ \\mu(x) = e^{-x} $$');
          addStep(steps,'Solución general','$$ y(x) = C e^x - x - 1 $$');
        } else if (rhs.includes('y^2')) {
          addStep(steps,'Separación de variables','$$ \\frac{dy}{y^2} = dx $$');
          addStep(steps,'Integración','$$ -\\frac{1}{y} = x + C $$');
          addStep(steps,'Solución general','$$ y(x) = -\\frac{1}{x + C} $$');
        } else if (rhs.includes('sin(x)')) {
          addStep(steps,'Integración directa','$$ y = \\int \\sin(x) \\, dx $$');
          addStep(steps,'Solución general','$$ y(x) = -\\cos(x) + C $$');
        } else {
          addStep(steps,'Forma general','$$ dy = ('+rhs+')\\,dx $$');
          addStep(steps,'Solución general (formal)','$$ y(x) = \\int ('+rhs+')\\,dx $$');
        }
      } catch(_) { 
        addStep(steps,'Error','No se pudo resolver esta ecuación específica');
      }
    });

    // Configurar listener del botón RK4
    if (newBtnRK) {
      newBtnRK.addEventListener('click', ()=>{
        console.log('🧮 RK4');
        steps.innerHTML='';
        const s = eq.value || '';
        const m = s.split('='); 
        if(m.length<2){ 
          addStep(steps,'Formato inválido','$$ \\frac{dy}{dx}=f(x,y) $$'); 
          return; 
        }
        const rhs = m.slice(1).join('=').trim();
        try {
          // Sanitizar antes de evaluar
          const sanitizedRhs = sanitizeMathExpression(rhs);
          if (!sanitizedRhs) {
            throw new Error('Expresión vacía o inválida');
          }
          
          const f = (x,y)=> math.evaluate(sanitizedRhs, {x, y});
          const x0v = parseFloat(x0.value||'0');
          const y0v = parseFloat(y0.value||'0');
          const xfv = parseFloat(xf.value|| (x0v+1));
          const n=20, h=(xfv-x0v)/n;
          const pts = rk4(f,x0v,y0v,h,n);
          addStep(steps,'Aproximación RK4','$$ y('+xfv.toFixed(2)+') \\approx '+pts[pts.length-1][1].toFixed(6)+' $$');
        } catch(err) {
          addStep(steps,'Error RK4','No se pudo evaluar la función: ' + err.message);
          console.error('Error en RK4:', err);
        }
      });
    }
  };
})();

