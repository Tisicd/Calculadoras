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
    const input = document.getElementById('edo1Eq');
    if (input) {
      input.value = example;
      console.log('🧮 EDO1: ejemplo establecido:', example);
    }
  };

  window.setEDO2Example = function(example) {
    const input = document.getElementById('edo2Eq');
    if (input) {
      input.value = example;
      console.log('🧮 EDO2: ejemplo establecido:', example);
    }
  };

  window.setEDOSysExample = function(example) {
    const input = document.getElementById('edosysA');
    if (input) {
      input.value = example;
      console.log('🧮 EDOSys: ejemplo establecido:', example);
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
    if(!eq||!btn||!steps) return;

    if (btn) {
      btn.disabled = false;
      btn.classList.remove('cursor-not-allowed');
      btn.style.cursor = 'pointer';
      btn.addEventListener('mouseenter', ()=> btn.style.cursor = 'pointer');
    }
    btn.addEventListener('click', ()=>{
      console.log('🧮 initEDO1: click en Resolver EDO');
      steps.innerHTML='';
      const s = eq.value || '';
      const m = s.split('=');
      if(m.length<2){ addStep(steps,'Formato inválido','$$ \\frac{dy}{dx}=f(x,y) $$'); return; }
      const rhs = m.slice(1).join('=').trim();
      addStep(steps,'Ecuación','$$ \\frac{dy}{dx} = '+rhs+' $$');
      // intento separable: dy/dx = g(x)h(y)
      try{
        const fx = rhs; // como string
        addStep(steps,'Forma general','$$ dy = ('+fx+')\\,dx $$');
        addStep(steps,'Solución general (formal)','$$ y(x) = \\int ('+fx+')\\,dx $$');
      }catch(_){ }
    });

    if (btnRK) {
      btnRK.disabled = false;
      btnRK.classList.remove('cursor-not-allowed');
      btnRK.style.cursor = 'pointer';
      btnRK.addEventListener('mouseenter', ()=> btnRK.style.cursor = 'pointer');
    }
    btnRK.addEventListener('click', ()=>{
      console.log('🧮 initEDO1: click en RK4');
      steps.innerHTML='';
      const s = eq.value || '';
      const m = s.split('='); if(m.length<2){ addStep(steps,'Formato inválido','$$ \\frac{dy}{dx}=f(x,y) $$'); return; }
      const rhs = m.slice(1).join('=').trim();
      const f = (x,y)=> math.evaluate(rhs, {x, y});
      const x0v = parseFloat(x0.value||'0');
      const y0v = parseFloat(y0.value||'0');
      const xfv = parseFloat(xf.value|| (x0v+1));
      const n=20, h=(xfv-x0v)/n;
      const pts = rk4(f,x0v,y0v,h,n);
      addStep(steps,'Aproximación RK4','$$ y('+xfv.toFixed(2)+') \\approx '+pts[pts.length-1][1].toFixed(6)+' $$');
    });
  };

  window.initEDO2 = function(){
    console.log('🧮 initEDO2: inicializando calculadora EDO segundo orden');
    const eq = document.getElementById('edo2Eq');
    const btn = document.getElementById('edo2Solve');
    const steps = document.getElementById('edo2Steps');
    if(!eq||!btn||!steps) return;
    
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('cursor-not-allowed');
      btn.style.cursor = 'pointer';
      btn.addEventListener('mouseenter', ()=> btn.style.cursor = 'pointer');
    }
    btn.addEventListener('click', ()=>{
      console.log('🧮 initEDO2: click en Resolver EDO');
      steps.innerHTML='';
      const s = eq.value||'';
      // parse simple: y'' + a*y' + b*y = 0 (solo homogénea por ahora)
      const leftRight = s.split('=');
      const left = (leftRight[0]||'').trim();
      const match = left.match(/y''\s*\+\s*([\-0-9\.]+)\s*\*\s*y'\s*\+\s*([\-0-9\.]+)\s*\*\s*y/);
      if(!match){ addStep(steps,'Formato','$$ y'' + a y' + b y = f(x) $$'); return; }
      const a=parseFloat(match[1]);
      const b=parseFloat(match[2]);
      addStep(steps,'Polinomio característico','$$ r^2 + '+a+' r + '+b+' = 0 $$');
      const D=a*a-4*b;
      if(D>0){
        const r1=(-a+Math.sqrt(D))/2, r2=(-a-Math.sqrt(D))/2;
        addStep(steps,'Raíces reales','$$ r_1='+r1.toFixed(4)+',\\ r_2='+r2.toFixed(4)+' $$');
        addStep(steps,'Solución homogénea','$$ y_h=C_1 e^{'+r1.toFixed(4)+'x}+C_2 e^{'+r2.toFixed(4)+'x} $$');
      } else if(D===0){
        const r=-a/2; addStep(steps,'Raíz doble','$$ r='+r.toFixed(4)+' $$');
        addStep(steps,'Solución homogénea','$$ y_h=(C_1+C_2 x) e^{'+r.toFixed(4)+'x} $$');
      } else {
        const alpha=-a/2, beta=Math.sqrt(-D)/2;
        addStep(steps,'Raíces complejas','$$ r= '+alpha.toFixed(4)+' \u00B1 '+beta.toFixed(4)+' i $$');
        addStep(steps,'Solución homogénea','$$ y_h=e^{'+alpha.toFixed(4)+'x}(C_1\cos('+beta.toFixed(4)+'x)+C_2\sin('+beta.toFixed(4)+'x)) $$');
      }
    });
  };

  window.initEDOSys = function(){
    console.log('🧮 initEDOSys: inicializando calculadora sistemas EDO');
    const Ainp=document.getElementById('edosysA');
    const btn=document.getElementById('edosysSolve');
    const steps=document.getElementById('edosysSteps');
    if(!Ainp||!btn||!steps) return;
    
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('cursor-not-allowed');
      btn.style.cursor = 'pointer';
      btn.addEventListener('mouseenter', ()=> btn.style.cursor = 'pointer');
    }
    btn.addEventListener('click',()=>{
      console.log('🧮 initEDOSys: click en Resolver Sistema');
      steps.innerHTML='';
      try{
        const A = JSON.parse(Ainp.value);
        const eig = math.eigs(math.matrix(A));
        addStep(steps,'Autovalores','$$ '+JSON.stringify(eig.values)+' $$');
        addStep(steps,'Solución general (formal)','$$ Y(x)=e^{Ax} C $$');
      }catch(err){ addStep(steps,'Error',err.message); }
    });
  };
})();