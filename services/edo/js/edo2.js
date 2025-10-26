// ============================================
// Calculadora EDO Segundo Orden
// ============================================

// Funciones globales ANTES de la IIFE para que estén disponibles inmediatamente
window.setEDO2Example = function(example) {
  console.log('🔧 setEDO2Example llamada con:', example);
  const input = document.getElementById('edo2Eq');
  if (input) {
    try {
      // Decodificar entidades HTML si es necesario
      let decodedExample = example.replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&quot;/g, '"');
      
      // Asegurar que no hay comillas problemáticas
      input.value = decodedExample;
      
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      console.log('✅ setEDO2Example: valor establecido correctamente');
    } catch(err) {
      console.error('❌ Error en setEDO2Example:', err);
      if (input) {
        input.value = '';
      }
    }
  } else {
    console.error('❌ Input edo2Eq no encontrado');
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

  // Validación de EDO segundo orden
  function validateEDO2(equation) {
    if (!equation || equation.trim() === '') return false;
    const parts = equation.split('=');
    if (parts.length < 2) return false;
    const leftSide = parts[0].trim();
    
    // Verificar que contenga y'', y', y
    const hasDoublePrime = leftSide.includes("y''");
    const hasPrime = leftSide.includes("y'");
    const hasY = leftSide.includes("y");
    
    // Debe tener y'' y al menos y o y'
    if (!hasDoublePrime || !hasY) return false;
    
    // Verificar que tenga el formato básico: y'' + ...
    const hasFormat = leftSide.includes("y''") && 
                      (leftSide.includes('+') || leftSide.includes('-'));
    
    return hasFormat;
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
    if (!input || !preview) return;
    
    const value = input.value.trim();
    if (!value) {
      preview.innerHTML = '<p class="text-gray-500 text-center">Ingresa una ecuación...</p>';
      return;
    }

    const parts = value.split('=');
    if (parts.length < 2) {
      preview.innerHTML = '<p class="text-red-500 text-center">Formato inválido: usa y\'\' + ...</p>';
      return;
    }

    const left = parts[0].trim();
    const right = parts.slice(1).join('=').trim();
    
    // Convertir a LaTeX de forma correcta
    try {
      let latex = left
        .replace(/y''/g, 'y\'')           // y'' -> y'
        .replace(/y'/g, 'y\'')             // y' -> y'
        .replace(/y/g, 'y')                // y -> y
        .replace(/\*\s*/g, '\\cdot ')      // * -> \cdot
        .replace(/\s*\+\s*/g, ' + ')       // espacios alrededor de +
        .replace(/\s*-\s*/g, ' - ');       // espacios alrededor de -
      
      // Construir ecuación completa con lado derecho
      const fullLatex = `$$${latex} = ${right || '0'}$$`;
      
      // Limpiar y renderizar con KaTeX
      preview.innerHTML = '';
      const katexDiv = document.createElement('div');
      preview.appendChild(katexDiv);
      
      // Usar katex.render para renderizar correctamente
      if (window.katex) {
        try {
          // Extraer solo el contenido matemático sin los $$
          const mathContent = fullLatex.replace(/\$\$/g, '');
          window.katex.render(mathContent, katexDiv, {
            throwOnError: false,
            displayMode: true,
            strict: false
          });
        } catch (e) {
          console.warn('Error renderizando con KaTeX:', e);
          preview.innerHTML = '<p class="text-gray-500 text-center">' + value + '</p>';
        }
      } else {
        // Si KaTeX no está disponible, mostrar texto
        preview.innerHTML = '<p class="text-gray-500 text-center font-mono">' + value + '</p>';
      }
      
    } catch(err) {
      console.error('Error en updatePreview:', err);
      preview.innerHTML = '<p class="text-gray-500 text-center">' + value + '</p>';
    }
  }

  // Inicialización
  window.initEDO2 = function(){
    console.log('🧮 initEDO2: inicializando calculadora EDO segundo orden');
    
    const eq = document.getElementById('edo2Eq');
    const btn = document.getElementById('edo2Solve');
    const steps = document.getElementById('edo2Steps');
    const preview = document.getElementById('edo2Preview');
    
    if(!eq||!btn||!steps) {
      console.error('❌ initEDO2: elementos no encontrados');
      return;
    }

    console.log('✅ initEDO2: elementos encontrados');

    // Configurar event listeners para botones de ejemplo
    const exampleButtons = document.querySelectorAll('.edo2-example-btn');
    exampleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const example = button.getAttribute('data-example');
        if (example) {
          window.setEDO2Example(example);
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
    
    // Reemplazar botón primero para limpiar listeners anteriores
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('edo2Solve');
    
    // Validación en tiempo real
    eq.addEventListener('input', () => {
      const isValid = validateEDO2(eq.value);
      updateButtonState(newBtn, isValid);
      console.log('🔍 EDO2 validación:', isValid, 'para:', eq.value);
    });
    
    // Estado inicial
    const initialValid = validateEDO2(eq.value);
    updateButtonState(newBtn, initialValid);
    
    // Resolver EDO
    newBtn.addEventListener('click', ()=>{
      console.log('🧮 Resolver EDO');
      steps.innerHTML='';
      const s = eq.value||'';
      console.log('📝 EDO2: ecuación ingresada:', s);
      const leftRight = s.split('=');
      const left = (leftRight[0]||'').trim();
      
      // Regex más flexible que acepta y''+2y'+2y o y'' + 2*y' + 2*y
      const match = left.match(/y''\s*\+\s*([\-0-9\.]+)\s*\*?\s*y'\s*\+\s*([\-0-9\.]+)\s*\*?\s*y/);
      if(!match){ 
        addStep(steps,'Formato esperado','$$ y&#39;&#39; + ay&#39; + by = f(x) $$');
        addStep(steps,'Ejemplo válido','$$ y&#39;&#39; + 2y&#39; + 2y = 0 $$');
        addStep(steps,'Otro ejemplo','$$ y&#39;&#39; + 3*y&#39; + 2*y = 0 $$');
        return; 
      }
      const a=parseFloat(match[1]);
      const b=parseFloat(match[2]);
      
      addStep(steps,'Ecuación','$$ y&#39;&#39; + '+a+' y&#39; + '+b+' y = 0 $$');
      addStep(steps,'Polinomio característico','$$ r^2 + '+a+' r + '+b+' = 0 $$');
      
      const D=a*a-4*b;
      if(D>0){
        const r1=(-a+Math.sqrt(D))/2, r2=(-a-Math.sqrt(D))/2;
        addStep(steps,'Discriminante','$$ \\Delta = '+a+'^2 - 4('+b+') = '+D+' > 0 $$');
        addStep(steps,'Raíces reales','$$ r_1='+r1.toFixed(4)+',\\, r_2='+r2.toFixed(4)+' $$');
        addStep(steps,'Solución homogénea','$$ y_h=C_1 e^{'+r1.toFixed(4)+'x}+C_2 e^{'+r2.toFixed(4)+'x} $$');
      } else if(D===0){
        const r=-a/2; 
        addStep(steps,'Discriminante','$$ \\Delta = '+a+'^2 - 4('+b+') = '+D+' = 0 $$');
        addStep(steps,'Raíz doble','$$ r='+r.toFixed(4)+' $$');
        addStep(steps,'Solución homogénea','$$ y_h=(C_1+C_2x) e^{'+r.toFixed(4)+'x} $$');
      } else {
        const alpha=-a/2, beta=Math.sqrt(-D)/2;
        addStep(steps,'Discriminante','$$ \\Delta = '+a+'^2 - 4('+b+') = '+D+' < 0 $$');
        addStep(steps,'Raíces complejas','$$ r= '+alpha.toFixed(4)+' \\pm '+beta.toFixed(4)+' i $$');
        addStep(steps,'Solución homogénea','$$ y_h=e^{'+alpha.toFixed(4)+'x}(C_1\\cos('+beta.toFixed(4)+'x)+C_2\\sin('+beta.toFixed(4)+'x)) $$');
      }
    });
  };
})();

