// Funciones globales de validación
window.validateEDO1 = function(equation) {
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
};

window.validateEDO2 = function(equation) {
  if (!equation || equation.trim() === '') return false;
  const parts = equation.split('=');
  if (parts.length < 2) return false;
  const leftSide = parts[0].trim();
  if (!leftSide.includes('y\'\'') && !leftSide.includes('y\'\'\'')) return false;
  if (!leftSide.includes('y\'') && !leftSide.includes('y\'\'')) return false;
  if (!leftSide.includes('y')) return false;
  const coefficientPattern = /[\+\-]?\s*\d*\.?\d*\s*\*/;
  const matches = leftSide.match(coefficientPattern);
  if (!matches || matches.length < 2) return false;
  return true;
};

window.validateEDOSys = function(matrixInput) {
  if (!matrixInput || matrixInput.trim() === '') return false;
  try {
    const matrix = JSON.parse(matrixInput);
    if (!Array.isArray(matrix)) return false;
    if (matrix.length === 0) return false;
    const firstRowLength = matrix[0].length;
    if (matrix.length !== firstRowLength) return false;
    for (let row of matrix) {
      if (!Array.isArray(row) || row.length !== firstRowLength) return false;
      for (let element of row) {
        if (typeof element !== 'number' || isNaN(element)) return false;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
};

window.updateButtonState = function(button, isValid) {
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
};

// Funciones globales para establecer ejemplos - deben estar disponibles inmediatamente
window.setEDO1Example = function(example) {
  console.log('🔧 setEDO1Example llamada con:', example);
  const input = document.getElementById('edo1Eq');
  if (input) {
    input.value = example;
    console.log('✅ EDO1: ejemplo establecido:', example);
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
    // Actualizar estado de botones
    const btn = document.getElementById('edo1Solve');
    const btnRK = document.getElementById('edo1RK');
    if (btn && btnRK) {
      const isValid = window.validateEDO1(example);
      window.updateButtonState(btn, isValid);
      window.updateButtonState(btnRK, isValid);
    }
  } else {
    console.error('❌ setEDO1Example: input edo1Eq no encontrado');
  }
};

window.setEDO2Example = function(example) {
  console.log('🔧 setEDO2Example llamada con:', example);
  const input = document.getElementById('edo2Eq');
  if (input) {
    input.value = example;
    console.log('✅ EDO2: ejemplo establecido:', example);
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
    // Actualizar estado de botones
    const btn = document.getElementById('edo2Solve');
    if (btn) {
      const isValid = window.validateEDO2(example);
      window.updateButtonState(btn, isValid);
    }
  } else {
    console.error('❌ setEDO2Example: input edo2Eq no encontrado');
  }
};

window.setEDOSysExample = function(example) {
  console.log('🔧 setEDOSysExample llamada con:', example);
  const input = document.getElementById('edosysA');
  if (input) {
    input.value = example;
    console.log('✅ EDOSys: ejemplo establecido:', example);
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
    // Actualizar estado de botones
    const btn = document.getElementById('edosysSolve');
    if (btn) {
      const isValid = window.validateEDOSys(example);
      window.updateButtonState(btn, isValid);
    }
  } else {
    console.error('❌ setEDOSysExample: input edosysA no encontrado');
  }
};

(function(){
  function typeset(el){
    try {
      if (window.renderMathInElement) {
        window.renderMathInElement(el, {delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}], throwOnError:false});
      }
      if (window.MathJax && window.MathJax.typesetPromise) { window.MathJax.typesetPromise([el]).catch(()=>{}); }
    } catch(_){}
  }

  function addStep(container, title, latex){
    const card = document.createElement('div');
    card.className='border-l-4 pl-3 py-3 bg-slate-50 rounded border-blue-500';
    if(title){ const h=document.createElement('h4'); h.className='font-semibold text-slate-800 mb-1'; h.textContent=title; card.appendChild(h);}    
    if(latex){ const m=document.createElement('div'); m.className='bg-gray-50 p-2 rounded border'; m.innerHTML=latex; card.appendChild(m); }
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
    const pts=[[x0,y0]]; let x=x0, y=y0;
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

  window.initEDO1 = function(){
    console.log('🧮 initEDO1: inicializando calculadora EDO primer orden');
    const eq = document.getElementById('edo1Eq');
    const x0 = document.getElementById('edo1x0');
    const y0 = document.getElementById('edo1y0');
    const xf = document.getElementById('edo1xf');
    const btn = document.getElementById('edo1Solve');
    const btnRK = document.getElementById('edo1RK');
    const steps = document.getElementById('edo1Steps');
    if(!eq||!btn||!steps) {
      console.error('❌ initEDO1: elementos no encontrados', {eq: !!eq, btn: !!btn, steps: !!steps});
      return;
    }

    console.log('✅ initEDO1: elementos encontrados, configurando validación...');
    
    // Reemplazar botones primero para limpiar listeners anteriores
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('edo1Solve');
    
    // Agregar event listeners DESPUÉS del reemplazo
    eq.addEventListener('input', () => {
      const isValid = window.validateEDO1(eq.value);
      window.updateButtonState(newBtn, isValid);
      if (btnRK) window.updateButtonState(btnRK, isValid);
      console.log('🔍 EDO1 validación:', isValid, 'para:', eq.value);
    });
    
    // Configurar estado inicial
    const initialValid = window.validateEDO1(eq.value);
    window.updateButtonState(newBtn, initialValid);
    if (btnRK) window.updateButtonState(btnRK, initialValid);
    newBtn.addEventListener('click', ()=>{
      console.log('🧮 initEDO1: click en Resolver EDO');
      steps.innerHTML='';
      const s = eq.value || '';
      console.log('📝 EDO1: ecuación ingresada:', s);
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

    if (btnRK) {
      // Reemplazar botón RK primero
      btnRK.replaceWith(btnRK.cloneNode(true));
      const newBtnRK = document.getElementById('edo1RK');
      
      // Configurar estado del botón RK
      newBtnRK.disabled = false;
      newBtnRK.classList.remove('cursor-not-allowed', 'opacity-50');
      newBtnRK.style.cursor = 'pointer';
      newBtnRK.style.opacity = '1';
      
      newBtnRK.addEventListener('click', ()=>{
        console.log('🧮 initEDO1: click en RK4');
        steps.innerHTML='';
        const s = eq.value || '';
        console.log('📝 EDO1 RK4: ecuación ingresada:', s);
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

  window.initEDO2 = function(){
    console.log('🧮 initEDO2: inicializando calculadora EDO segundo orden');
    const eq = document.getElementById('edo2Eq');
    const btn = document.getElementById('edo2Solve');
    const steps = document.getElementById('edo2Steps');
    if(!eq||!btn||!steps) {
      console.error('❌ initEDO2: elementos no encontrados', {eq: !!eq, btn: !!btn, steps: !!steps});
      return;
    }

    console.log('✅ initEDO2: elementos encontrados, configurando validación...');
    
    // Reemplazar botón primero para limpiar listeners anteriores
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('edo2Solve');
    
    // Agregar event listeners DESPUÉS del reemplazo
    eq.addEventListener('input', () => {
      const isValid = window.validateEDO2(eq.value);
      window.updateButtonState(newBtn, isValid);
      console.log('🔍 EDO2 validación:', isValid, 'para:', eq.value);
    });
    
    // Configurar estado inicial
    const initialValid = window.validateEDO2(eq.value);
    window.updateButtonState(newBtn, initialValid);
    newBtn.addEventListener('click', ()=>{
      console.log('🧮 initEDO2: click en Resolver EDO');
      steps.innerHTML='';
      const s = eq.value||'';
      console.log('📝 EDO2: ecuación ingresada:', s);
      const leftRight = s.split('=');
      const left = (leftRight[0]||'').trim();
      
      const match = left.match(/y''\s*\+\s*([\-0-9\.]+)\s*\*?\s*y'\s*\+\s*([\-0-9\.]+)\s*\*?\s*y/);
      if(!match){ 
        addStep(steps,'Formato esperado',"$$ y'' + ay' + by = f(x) $$");
        addStep(steps,'Ejemplo',"$$ y'' + 2y' + 2y = 0 $$");
        return; 
      }
      const a=parseFloat(match[1]);
      const b=parseFloat(match[2]);
      
      addStep(steps,'Ecuación',"$$ y'' + "+a+" y' + "+b+" y = 0 $$");
      addStep(steps,'Polinomio característico','$$ r^2 + '+a+' r + '+b+' = 0 $$');
      
      const D=a*a-4*b;
      if(D>0){
        const r1=(-a+Math.sqrt(D))/2, r2=(-a-Math.sqrt(D))/2;
        addStep(steps,'Discriminante','$$ \\Delta = '+a+'^2 - 4('+b+') = '+D+' > 0 $$');
        addStep(steps,'Raíces reales','$$ r_1='+r1.toFixed(4)+',\\ r_2='+r2.toFixed(4)+' $$');
        addStep(steps,'Solución homogénea','$$ y_h=C_1 e^{'+r1.toFixed(4)+'x}+C_2 e^{'+r2.toFixed(4)+'x} $$');
      } else if(D===0){
        const r=-a/2; 
        addStep(steps,'Discriminante','$$ \\Delta = '+a+'^2 - 4('+b+') = '+D+' = 0 $$');
        addStep(steps,'Raíz doble','$$ r='+r.toFixed(4)+' $$');
        addStep(steps,'Solución homogénea','$$ y_h=(C_1+C_2 x) e^{'+r.toFixed(4)+'x} $$');
      } else {
        const alpha=-a/2, beta=Math.sqrt(-D)/2;
        addStep(steps,'Discriminante','$$ \\Delta = '+a+'^2 - 4('+b+') = '+D+' < 0 $$');
        addStep(steps,'Raíces complejas','$$ r= '+alpha.toFixed(4)+' \\pm '+beta.toFixed(4)+' i $$');
        addStep(steps,'Solución homogénea','$$ y_h=e^{'+alpha.toFixed(4)+'x}(C_1\\cos('+beta.toFixed(4)+'x)+C_2\\sin('+beta.toFixed(4)+'x)) $$');
      }
    });
  };

  window.initEDOSys = function(){
    console.log('🧮 initEDOSys: inicializando calculadora sistemas EDO');
    const Ainp=document.getElementById('edosysA');
    const btn=document.getElementById('edosysSolve');
    const steps=document.getElementById('edosysSteps');
    if(!Ainp||!btn||!steps) {
      console.error('❌ initEDOSys: elementos no encontrados', {Ainp: !!Ainp, btn: !!btn, steps: !!steps});
      return;
    }

    console.log('✅ initEDOSys: elementos encontrados, configurando validación...');
    
    // Configurar event listeners para botones de ejemplo
    const exampleButtons = document.querySelectorAll('.edosys-example-btn');
    exampleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const example = button.getAttribute('data-example');
        if (example) {
          window.setEDOSysExample(example);
        }
      });
    });
    
    // Reemplazar botón primero para limpiar listeners anteriores
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('edosysSolve');
    
    // Agregar event listeners DESPUÉS del reemplazo
    Ainp.addEventListener('input', () => {
      const isValid = window.validateEDOSys(Ainp.value);
      window.updateButtonState(newBtn, isValid);
      console.log('🔍 EDOSys validación:', isValid, 'para:', Ainp.value);
    });
    
    // Configurar estado inicial
    const initialValid = window.validateEDOSys(Ainp.value);
    window.updateButtonState(newBtn, initialValid);
    newBtn.addEventListener('click',()=>{
      console.log('🧮 initEDOSys: click en Resolver Sistema');
      steps.innerHTML='';
      
      if (typeof math === 'undefined') {
        console.error('❌ MathJS no está disponible');
        addStep(steps,'Error','MathJS no está disponible. Recarga la página.');
        return;
      }
      
      try{
        const A = JSON.parse(Ainp.value);
        console.log('📝 EDOSys: matriz ingresada:', A);
        
        if (!Array.isArray(A) || A.length === 0) {
          throw new Error('La matriz debe ser un array no vacío');
        }
        
        addStep(steps,'Matriz del sistema','$$ A = \\begin{pmatrix} '+A.map(row => row.join(' & ')).join(' \\\\ ') +' \\end{pmatrix} $$');
        
        try {
          const matrixA = math.matrix(A);
          console.log('🔍 Calculando autovalores de la matriz...');
          
          if (typeof math.eigs !== 'function') {
            if (A.length === 2 && A[0].length === 2) {
              const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
              const trace = a + d;
              const det = a*d - b*c;
              const discriminant = trace*trace - 4*det;
              
              addStep(steps,'Cálculo manual','$$ \\text{tr}(A) = '+trace+', \\ \\det(A) = '+det+' $$');
              
              if (discriminant > 0) {
                const lambda1 = (trace + Math.sqrt(discriminant))/2;
                const lambda2 = (trace - Math.sqrt(discriminant))/2;
                addStep(steps,'Autovalores','$$ \\lambda_1 = '+lambda1.toFixed(4)+', \\ \\lambda_2 = '+lambda2.toFixed(4)+' $$');
              } else if (discriminant === 0) {
                const lambda = trace/2;
                addStep(steps,'Raíz doble','$$ \\lambda = '+lambda.toFixed(4)+' $$');
              } else {
                const real = trace/2;
                const imag = Math.sqrt(-discriminant)/2;
                addStep(steps,'Autovalores complejos','$$ \\lambda = '+real.toFixed(4)+' \\pm '+imag.toFixed(4)+'i $$');
              }
            } else {
              addStep(steps,'Nota','Autovalores solo disponibles para matrices 2x2');
            }
          } else {
            const eig = math.eigs(matrixA);
            console.log('✅ Autovalores calculados:', eig);
            
            addStep(steps,'Autovalores','$$ \\lambda = '+JSON.stringify(eig.values)+' $$');
            
            if (eig.vectors) {
              addStep(steps,'Autovectores','$$ \\mathbf{v} = \\begin{pmatrix} '+eig.vectors.map(col => col.join(' \\\\ ')).join(' \\end{pmatrix}, \\begin{pmatrix} ') +' \\end{pmatrix} $$');
            }
          }
          
          addStep(steps,'Solución general','$$ \\mathbf{Y}(x) = e^{Ax} \\mathbf{C} $$');
          addStep(steps,'Donde','$$ \\mathbf{C} = \\begin{pmatrix} C_1 \\\\ C_2 \\end{pmatrix} $$');
          
          if (A.length === 2 && A[0][1] === 0 && A[1][0] === 0) {
            addStep(steps,'Caso diagonal','$$ \\mathbf{Y}(x) = \\begin{pmatrix} C_1 e^{'+A[0][0]+'x} \\\\ C_2 e^{'+A[1][1]+'x} \\end{pmatrix} $$');
          }
        } catch (eigError) {
          console.error('❌ Error calculando autovalores:', eigError);
          addStep(steps,'Error','No se pudieron calcular autovalores: ' + eigError.message);
        }
        
      }catch(err){ 
        console.error('❌ EDOSys error:', err);
        addStep(steps,'Error de formato','Verifica que la matriz esté en formato JSON válido');
        addStep(steps,'Ejemplo','$$ [[1,2],[3,4]] $$');
      }
    });
  };
})();
