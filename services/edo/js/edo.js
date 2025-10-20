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

  // Funciones para establecer ejemplos
  window.setEDO1Example = function(example) {
    console.log('🔧 setEDO1Example llamada con:', example);
    const input = document.getElementById('edo1Eq');
    if (input) {
      input.value = example;
      console.log('✅ EDO1: ejemplo establecido:', example);
      // Disparar evento input para activar cualquier validación
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
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
    } else {
      console.error('❌ setEDOSysExample: input edosysA no encontrado');
    }
  };

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

    console.log('✅ initEDO1: elementos encontrados, habilitando botones...');
    
    // Habilitar botón resolver
    btn.disabled = false;
    btn.classList.remove('cursor-not-allowed', 'opacity-50');
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
    
    // Remover listeners previos para evitar duplicados
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('edo1Solve');
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
      
      // Intentar resolver casos específicos
      try {
        if (rhs.includes('*') && rhs.includes('x') && rhs.includes('y')) {
          // Caso separable: dy/dx = x*y
          addStep(steps,'Separación de variables','$$ \\frac{dy}{y} = x \\, dx $$');
          addStep(steps,'Integración','$$ \\ln|y| = \\frac{x^2}{2} + C $$');
          addStep(steps,'Solución general','$$ y(x) = C e^{\\frac{x^2}{2}} $$');
        } else if (rhs.includes('x + y')) {
          // Caso lineal: dy/dx = x + y
          addStep(steps,'Ecuación lineal','$$ \\frac{dy}{dx} - y = x $$');
          addStep(steps,'Factor integrante','$$ \\mu(x) = e^{-x} $$');
          addStep(steps,'Solución general','$$ y(x) = C e^x - x - 1 $$');
        } else if (rhs.includes('y^2')) {
          // Caso no lineal: dy/dx = y^2
          addStep(steps,'Separación de variables','$$ \\frac{dy}{y^2} = dx $$');
          addStep(steps,'Integración','$$ -\\frac{1}{y} = x + C $$');
          addStep(steps,'Solución general','$$ y(x) = -\\frac{1}{x + C} $$');
        } else if (rhs.includes('sin(x)')) {
          // Caso trigonométrico: dy/dx = sin(x)
          addStep(steps,'Integración directa','$$ y = \\int \\sin(x) \\, dx $$');
          addStep(steps,'Solución general','$$ y(x) = -\\cos(x) + C $$');
        } else {
          // Caso general
          addStep(steps,'Forma general','$$ dy = ('+rhs+')\\,dx $$');
          addStep(steps,'Solución general (formal)','$$ y(x) = \\int ('+rhs+')\\,dx $$');
        }
      } catch(_) { 
        addStep(steps,'Error','No se pudo resolver esta ecuación específica');
      }
    });

    // Habilitar botón RK4
    if (btnRK) {
      btnRK.disabled = false;
      btnRK.classList.remove('cursor-not-allowed', 'opacity-50');
      btnRK.style.cursor = 'pointer';
      btnRK.style.opacity = '1';
      
      // Remover listeners previos
      btnRK.replaceWith(btnRK.cloneNode(true));
      const newBtnRK = document.getElementById('edo1RK');
      
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
          const f = (x,y)=> math.evaluate(rhs, {x, y});
          const x0v = parseFloat(x0.value||'0');
          const y0v = parseFloat(y0.value||'0');
          const xfv = parseFloat(xf.value|| (x0v+1));
          const n=20, h=(xfv-x0v)/n;
          const pts = rk4(f,x0v,y0v,h,n);
          addStep(steps,'Aproximación RK4','$$ y('+xfv.toFixed(2)+') \\approx '+pts[pts.length-1][1].toFixed(6)+' $$');
        } catch(err) {
          addStep(steps,'Error RK4','No se pudo evaluar la función: ' + err.message);
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

    console.log('✅ initEDO2: elementos encontrados, habilitando botones...');
    
    // Habilitar botón resolver
    btn.disabled = false;
    btn.classList.remove('cursor-not-allowed', 'opacity-50');
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
    
    // Remover listeners previos para evitar duplicados
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('edo2Solve');
    newBtn.addEventListener('click', ()=>{
      console.log('🧮 initEDO2: click en Resolver EDO');
      steps.innerHTML='';
      const s = eq.value||'';
      console.log('📝 EDO2: ecuación ingresada:', s);
      // parse simple: y'' + a*y' + b*y = 0 (solo homogénea por ahora)
      const leftRight = s.split('=');
      const left = (leftRight[0]||'').trim();
      
      // Mejorar el regex para capturar más casos
      const match = left.match(/y''\s*\+\s*([\-0-9\.]+)\s*\*\s*y'\s*\+\s*([\-0-9\.]+)\s*\*\s*y/);
      if(!match){ 
        addStep(steps,'Formato esperado','$$ y'' + a y' + b y = f(x) $$');
        addStep(steps,'Ejemplo','$$ y'' + 3*y' + 2*y = 0 $$');
        return; 
      }
      const a=parseFloat(match[1]);
      const b=parseFloat(match[2]);
      
      addStep(steps,'Ecuación','$$ y'' + '+a+' y' + '+b+' y = 0 $$');
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

    console.log('✅ initEDOSys: elementos encontrados, habilitando botones...');
    
    // Habilitar botón resolver
    btn.disabled = false;
    btn.classList.remove('cursor-not-allowed', 'opacity-50');
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
    
    // Remover listeners previos para evitar duplicados
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = document.getElementById('edosysSolve');
    newBtn.addEventListener('click',()=>{
      console.log('🧮 initEDOSys: click en Resolver Sistema');
      steps.innerHTML='';
      try{
        const A = JSON.parse(Ainp.value);
        console.log('📝 EDOSys: matriz ingresada:', A);
        addStep(steps,'Matriz del sistema','$$ A = \\begin{pmatrix} '+A.map(row => row.join(' & ')).join(' \\\\ ') +' \\end{pmatrix} $$');
        
        const eig = math.eigs(math.matrix(A));
        addStep(steps,'Autovalores','$$ \\lambda = '+JSON.stringify(eig.values)+' $$');
        
        // Mostrar autovectores si están disponibles
        if (eig.vectors) {
          addStep(steps,'Autovectores','$$ \\mathbf{v} = \\begin{pmatrix} '+eig.vectors.map(col => col.join(' \\\\ ')).join(' \\end{pmatrix}, \\begin{pmatrix} ') +' \\end{pmatrix} $$');
        }
        
        addStep(steps,'Solución general','$$ \\mathbf{Y}(x) = e^{Ax} \\mathbf{C} $$');
        addStep(steps,'Donde','$$ \\mathbf{C} = \\begin{pmatrix} C_1 \\\\ C_2 \\end{pmatrix} $$');
        
        // Si es diagonalizable, mostrar forma explícita
        if (A.length === 2 && A[0][1] === 0 && A[1][0] === 0) {
          addStep(steps,'Caso diagonal','$$ \\mathbf{Y}(x) = \\begin{pmatrix} C_1 e^{'+A[0][0]+'x} \\\\ C_2 e^{'+A[1][1]+'x} \\end{pmatrix} $$');
        }
        
      }catch(err){ 
        console.error('❌ EDOSys error:', err);
        addStep(steps,'Error de formato','Verifica que la matriz esté en formato JSON válido');
        addStep(steps,'Ejemplo','$$ [[1,2],[3,4]] $$');
      }
    });
  };
})();