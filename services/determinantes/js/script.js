(function () {
  if (window.__determinantes_scroll_v2) return;
  window.__determinantes_scroll_v2 = true;

  // ---- clases toggle (Tailwind utilities) ----
  const ACTIVE   = ['bg-indigo-600','border-indigo-600','text-white','shadow'];
  const INACTIVE = ['border-indigo-300','text-indigo-700','bg-white','shadow-sm','hover:bg-indigo-50','transition'];

  // ---- Helpers numéricos / formato ----
  const clone = M => M.map(r => r.slice());

  function toFraction(x, maxDen = 1000, eps = 1e-10) {
    if (!isFinite(x)) return x;
    const sgn = x < 0 ? -1 : 1; x = Math.abs(x);
    let h1=1, h0=0, k1=0, k0=1, b=x;
    while (true) {
      const a = Math.floor(b);
      const h2 = a*h1 + h0, k2 = a*k1 + k0;
      if (k2 > maxDen) break;
      h0=h1; h1=h2; k0=k1; k1=k2;
      const frac = b - a;
      if (frac < eps) break;
      b = 1/frac;
    }
    const num = sgn*h1, den = k1 || 1;
    return simplify(num, den);
  }
  function gcd(a,b){ a=Math.round(Math.abs(a)); b=Math.round(Math.abs(b)); while(b){[a,b]=[b,a%b];} return a||1; }
  function simplify(n,d){ const g=gcd(n,d); return [Math.round(n/g), Math.round(d/g)]; }

  function fmt(v){
    if (typeof v !== 'number' || !isFinite(v)) return v;
    const [n,d] = toFraction(v, 2000);
    return d === 1 ? `${n}` : `${n}/${d}`;
  }

  // Conversión básica de expresiones planas a LaTeX
  function plainToLatex(expression){
    try {
      if (!expression || typeof expression !== 'string') return '';
      let latex = expression.trim();
      latex = latex.replace(/\*\*/g, '^')
                   .replace(/\*([a-zA-Z])/g, '\\cdot $1')
                   .replace(/sin\(/g, '\\sin(')
                   .replace(/cos\(/g, '\\cos(')
                   .replace(/tan\(/g, '\\tan(')
                   .replace(/log\(/g, '\\log(')
                   .replace(/exp\(/g, 'e^')
                   .replace(/sqrt\(/g, '\\sqrt{')
                   .replace(/abs\(/g, '\\left|')
                   .replace(/pi/g, '\\pi');
      // Fracciones simples a \frac{}
      latex = latex.replace(/([^\/\s]+)\/([^\/\s]+)/g, (m,a,b)=>`\\frac{${a}}{${b}}`);
      // Exponentes { }
      latex = latex.replace(/\^([a-zA-Z0-9\(\)]+)/g, '^{$1}');
      return latex;
    } catch(_) { return expression; }
  }

  function latexMatrix(M){
    return `\\begin{bmatrix}${M.map(r=>r.map(fmt).join(' & ')).join('\\\\')}\\end{bmatrix}`;
  }

  function latexDeterminant(M){
    return `\\begin{vmatrix}${M.map(r=>r.map(fmt).join(' & ')).join('\\\\')}\\end{vmatrix}`;
  }

  // ---- Álgebra ----
  const minor = (M,i,j)=> M.filter((_,r)=>r!==i).map(row=>row.filter((_,c)=>c!==j));
  const det2x2 = (m)=> m[0][0]*m[1][1] - m[0][1]*m[1][0];

  function detEliminationWithSteps(A){
    const n=A.length, M=clone(A); let det=1;
    const steps=[{
      title:'Determinante por eliminación gaussiana',
      desc:'Triangulamos la matriz por eliminación hacia adelante. El determinante es el producto de los pivotes (con cambio de signo por intercambios de filas).',
      matrix: clone(M),
      math:`\\[ \\text{Inicialmente } \\det(A)=1,\\quad A=${latexDeterminant(M)} \\]`
    }];
    for(let i=0;i<n;i++){
      if (Math.abs(M[i][i])<1e-12){
        let sw=i+1; while(sw<n && Math.abs(M[sw][i])<1e-12) sw++;
        if (sw===n){
          steps.push({title:`Pivote en columna ${i+1} es 0`,
            desc:'No hay fila para intercambiar \\(\\Rightarrow\\) \\(\\det(A)=0\\).', matrix: clone(M),
            math:`\\[ \\det(A)=0 \\]`});
          return {det:0, steps};
        }
        [M[i],M[sw]]=[M[sw],M[i]]; det*=-1;
        steps.push({title:`Intercambio \\(R_{${i+1}}\\leftrightarrow R_{${sw+1}}\\)`,
          desc:'Cambia el signo de \\(\\det\\).', matrix: clone(M),
          math:`\\[ \\det\\leftarrow -\\det \\]`});
      }
      const p=M[i][i]; det*=p;
      steps.push({title:`Pivote ${i+1}`,
        desc:`Tomamos \\(p=A_{${i+1}${i+1}}\\).`, matrix: clone(M),
        math:`\\[ p=${fmt(p)},\\quad \\det\\leftarrow \\det\\cdot p \\]`});
      for(let r=i+1;r<n;r++){
        const f=M[r][i]/p;
        for(let c=i;c<n;c++) M[r][c]-=f*M[i][c];
        steps.push({title:`Eliminación en \\(R_{${r+1}}\\)`,
          desc:`\\(R_{${r+1}}\\leftarrow R_{${r+1}}-${fmt(f)}\\,R_{${i+1}}\\)`,
          matrix: clone(M)});
      }
    }
    steps.push({title:'Producto de pivotes',
      desc:'Matriz triangular \\(\\Rightarrow\\) producto de pivotes.',
      matrix: clone(M), math:`\\[ \\det(A)=${fmt(det)} \\]`});
    return {det, steps};
  }

  function det3x3WithCofactorSteps(A){
    const M11=minor(A,0,0), M12=minor(A,0,1), M13=minor(A,0,2);
    const d11=det2x2(M11), d12=det2x2(M12), d13=det2x2(M13);
    const C11=+d11, C12=-d12, C13=+d13;
    const term1=A[0][0]*C11, term2=A[0][1]*C12, term3=A[0][2]*C13;
    const det=term1+term2+term3;
    const mm = (m)=>`\\begin{vmatrix}${fmt(m[0][0])} & ${fmt(m[0][1])}\\\\ ${fmt(m[1][0])} & ${fmt(m[1][1])}\\end{vmatrix}`;
    const steps=[
      { title:'Fórmula 3×3 por primera fila',
        desc:'\\(\\det(A)=a_{11}C_{11}+a_{12}C_{12}+a_{13}C_{13}\\), con \\(C_{1j}=(-1)^{1+j}\\det(M_{1j})\\).',
        matrix: clone(A),
        math:`\\[ A=${latexDeterminant(A)} \\]` },
      { title:'Menor y cofactor \\(C_{11}\\)',
        desc:'Eliminamos fila 1 y columna 1.',
        matrix: M11, math:`\\[ M_{11}=${mm(M11)},\\; C_{11}=+\\det(M_{11})=${fmt(d11)} \\]` },
      { title:'Menor y cofactor \\(C_{12}\\)',
        desc:'Eliminamos fila 1 y columna 2 (signo negativo).',
        matrix: M12, math:`\\[ M_{12}=${mm(M12)},\\; C_{12}=-\\det(M_{12})=${fmt(-d12)} \\]` },
      { title:'Menor y cofactor \\(C_{13}\\)',
        desc:'Eliminamos fila 1 y columna 3 (signo positivo).',
        matrix: M13, math:`\\[ M_{13}=${mm(M13)},\\; C_{13}=+\\det(M_{13})=${fmt(d13)} \\]` },
      { title:'Suma final',
        desc:'Sustituimos en la fórmula.',
        matrix: clone(A),
        math:`\\[ \\det(A)=(${fmt(A[0][0])})(${fmt(C11)})+(${fmt(A[0][1])})(${fmt(C12)})+(${fmt(A[0][2])})(${fmt(C13)})=${fmt(det)} \\]` }
    ];
    return {det, steps};
  }

  function det2x2WithSteps(A){
    const det = det2x2(A);
    const steps = [{
      title: 'Determinante 2×2',
      desc: 'Usamos la fórmula \\(\\det(A)=a\\,d-b\\,c\\).',
      matrix: clone(A),
      math: `\\[ A=${latexDeterminant(A)},\\quad \\det(A)=(${fmt(A[0][0])})(${fmt(A[1][1])})-(${fmt(A[0][1])})(${fmt(A[1][0])})=${fmt(det)} \\]`
    }];
    return {det, steps};
  }

  function cofactorExpansionSteps(A, row = 0){
    const n = A.length;
    const steps = [];
    let det = 0;
    
    steps.push({
      title: `Expansión por cofactores (fila ${row + 1})`,
      desc: `\\[\\det(A) = \\sum_{j=1}^{n} a_{${row+1}j} C_{${row+1}j}\\]`,
      matrix: clone(A),
      math: `\\[ A=${latexDeterminant(A)} \\]`
    });

    for(let j = 0; j < n; j++){
      const Mij = minor(A, row, j);
      const sign = ((row + j) % 2 === 0) ? 1 : -1;
      
      let minorDet;
      if(Mij.length === 2) {
        minorDet = det2x2(Mij);
      } else if(Mij.length === 3) {
        minorDet = det3x3WithCofactorSteps(Mij).det;
      } else {
        minorDet = detEliminationWithSteps(Mij).det;
      }
      
      const cofactor = sign * minorDet;
      const term = A[row][j] * cofactor;
      det += term;
      
      const minorLatex = Mij.length === 2 ? 
        `\\begin{vmatrix}${fmt(Mij[0][0])} & ${fmt(Mij[0][1])}\\\\ ${fmt(Mij[1][0])} & ${fmt(Mij[1][1])}\\end{vmatrix}` :
        `\\begin{vmatrix}${Mij.map(r=>r.map(fmt).join(' & ')).join('\\\\')}\\end{vmatrix}`;
      
      steps.push({
        title: `Cofactor \\(C_{${row+1}${j+1}}\\)`,
        desc: `\\(C_{${row+1}${j+1}}=(-1)^{${row+1}+${j+1}}\\det(M_{${row+1}${j+1}})\\)`,
        matrix: Mij,
        math: `\\[ M_{${row+1}${j+1}}=${minorLatex},\\quad C_{${row+1}${j+1}}=${fmt(sign)}\\cdot${fmt(minorDet)}=${fmt(cofactor)} \\]`
      });
      
      steps.push({
        title: `Término \\(a_{${row+1}${j+1}}C_{${row+1}${j+1}}\\)`,
        desc: `Multiplicamos el elemento por su cofactor.`,
        matrix: clone(A),
        math: `\\[ a_{${row+1}${j+1}}C_{${row+1}${j+1}}=(${fmt(A[row][j])})(${fmt(cofactor)})=${fmt(term)} \\]`
      });
    }
    
    steps.push({
      title: 'Suma final',
      desc: 'Sumamos todos los términos.',
      matrix: clone(A),
      math: `\\[ \\det(A)=${fmt(det)} \\]`
    });
    
    return {det, steps};
  }

  // ---- Render: tarjetas en stream (solo scroll) ----
  function addStepCard(container, {title, desc, math, matrix, tone='blue'}){
    const card = document.createElement('div');
    card.className = 'border-l-4 pl-3 py-3 bg-slate-50 rounded';
    card.classList.add(`border-${tone}-500`);

    if (title) {
      const h = document.createElement('h4');
      h.className = 'font-semibold text-slate-800 mb-1';
      h.textContent = title;
      card.appendChild(h);
    }
    if (desc) {
      const p = document.createElement('p');
      p.className = 'text-slate-800 leading-relaxed mb-2';
      p.innerHTML = desc;
      card.appendChild(p);
    }
    if (math) {
      const m = document.createElement('div');
      m.className = 'bg-gray-50 p-3 rounded border mb-2 overflow-x-auto';
    const hasDelims = /\\\[|\\\]|\$\$|\\begin\{.*?\}/.test(math||'');
    const content = hasDelims ? math : `\\[ ${plainToLatex(math)} \\]`;
    m.innerHTML = content;
      card.appendChild(m);

    // Intentar renderizado directo con KaTeX
    try {
      if (window.katex) {
        const raw = (content || '')
          .replace(/^\\\[|^\$\$|^\\\(|^\$/,'')
          .replace(/\\\]$|\$\$$|\\\)$|\$$/,'');
        window.katex.render(raw, m, {throwOnError:false, displayMode:true});
      }
    } catch(_){}
    }
    if (matrix) {
      const tbl = document.createElement('table');
      tbl.className = 'mx-auto border-collapse';
      matrix.forEach(r=>{
        const tr=document.createElement('tr');
        r.forEach(v=>{
          const td=document.createElement('td');
          td.className='border px-3 py-2 text-sm';
          td.textContent = fmt(v);
          tr.appendChild(td);
        });
        tr.classList.add('bg-white');
        tbl.appendChild(tr);
      });
      card.appendChild(tbl);
    }
    container.appendChild(card);
  }

  function typeset(el){
    try {
      if (window.renderMathInElement) {
        window.renderMathInElement(el, {
          delimiters: [
            {left: '$$', right: '$$', display: true},
            {left: '$', right: '$', display: false},
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false
        });
      }
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([el]).catch(()=>{});
      }
    } catch(_){}
  }

  // ---- INIT pública ----
  window.initDeterminantes = function initDeterminantes(){
    console.log('🧮 initDeterminantes: inicializando calculadora de determinantes');
    // refs UI
    const sizeButtons   = [...document.querySelectorAll('#sizeButtons .btn-option')];
    const methodButtonsWrap = document.getElementById('methodButtons');
    const matrixGrid    = document.getElementById('matrixGrid');
    const calculateBtn  = document.getElementById('calculateBtn');
    const methodSection = document.getElementById('methodSection');

    const errorMsg      = document.getElementById('errorMsg');
    const stepsStream   = document.getElementById('stepsStream');

    // estado
    let size=2, A=[], detSteps=[];

    const setActive = (group, btn) => {
      group.forEach(b => { b.classList.remove(...ACTIVE); b.classList.add(...INACTIVE); });
      btn.classList.add(...ACTIVE);
      btn.classList.remove(...INACTIVE);
    };

    const buildGrid = (n)=>{
      matrixGrid.innerHTML='';
      matrixGrid.style.gridTemplateColumns=`repeat(${n}, minmax(72px, 1fr))`;
      matrixGrid.classList.add('max-w-fit','mx-auto');
      for(let i=0;i<n;i++){
        for(let j=0;j<n;j++){
          const inp=document.createElement('input');
          inp.type='number';
          inp.id=`input-${i}-${j}`;
          inp.placeholder=`${i+1},${j+1}`;
          inp.className='w-20 h-14 text-center text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white';
          matrixGrid.appendChild(inp);
        }
      }
    };

    const buildMethods = (n)=>{
      methodButtonsWrap.innerHTML = '';
      
      // Siempre expansión por cofactores
      const btnC = document.createElement('button');
      btnC.textContent = 'Expansión por Cofactores';
      btnC.dataset.method = 'cofactor';
      btnC.className = 'btn-option border border-indigo-300 text-indigo-700 bg-white shadow-sm hover:bg-indigo-50 transition px-4 py-2 rounded-xl';
      methodButtonsWrap.appendChild(btnC);

      // Eliminación gaussiana para matrices grandes
      if (n >= 3) {
        const btnG = document.createElement('button');
        btnG.textContent = 'Eliminación Gaussiana';
        btnG.dataset.method = 'gauss';
        btnG.className = 'btn-option border border-indigo-300 text-indigo-700 bg-white shadow-sm hover:bg-indigo-50 transition px-4 py-2 rounded-xl';
        methodButtonsWrap.appendChild(btnG);
      }
    };

    const clearSteps = ()=>{
      stepsStream.innerHTML = '<p class="text-slate-600">Completa la matriz y presiona <b>Calcular Determinante</b>.</p>';
    };

    // init tamaño
    sizeButtons.forEach(btn=>{
      if (btn.dataset.size==='2') setActive(sizeButtons, btn);
      btn.addEventListener('click', ()=>{
        setActive(sizeButtons, btn);
        size = +btn.dataset.size;
        errorMsg.classList.add('hidden');
        methodSection.classList.add('hidden');
        clearSteps();
        buildGrid(size);
      });
    });

    // primeros inputs
    buildGrid(size);
    clearSteps();

    // calcular determinante
    if (calculateBtn) {
      calculateBtn.disabled = false; // habilitar botón por defecto
      calculateBtn.classList.remove('cursor-not-allowed');
      calculateBtn.style.cursor = 'pointer';
      calculateBtn.addEventListener('mouseenter', ()=> calculateBtn.style.cursor = 'pointer');
    }
    calculateBtn.addEventListener('click', ()=>{
      console.log('🧮 initDeterminantes: click en Calcular Determinante');
      // leer matriz
      A=[]; for(let i=0;i<size;i++){ const row=[]; for(let j=0;j<size;j++){
        const v=Number(document.getElementById(`input-${i}-${j}`).value);
        if (!isFinite(v)) return alert('Completa todos los campos con números.');
        row.push(v);} A.push(row); }

      // limpiar stream
      stepsStream.innerHTML = '';

      // Calcular determinante con pasos
      let dInfo;
      if (size === 2) {
        dInfo = det2x2WithSteps(A);
      } else if (size === 3) {
        dInfo = det3x3WithCofactorSteps(A);
      } else {
        dInfo = detEliminationWithSteps(A);
      }

      detSteps = dInfo.steps.slice();

      // render pasos
      detSteps.forEach(step => addStepCard(stepsStream, step));
      typeset(stepsStream);

      // mostrar métodos válidos según tamaño
      buildMethods(size);
      methodSection.classList.remove('hidden');

      // enlazar clicks método (delegación)
      methodButtonsWrap.querySelectorAll('.btn-option').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          // marcar activo
          methodButtonsWrap.querySelectorAll('.btn-option').forEach(b=>{
            b.classList.remove(...ACTIVE); b.classList.add(...INACTIVE);
          });
          btn.classList.add(...ACTIVE); btn.classList.remove(...INACTIVE);

          // separador y título
          addStepCard(stepsStream, {title:'— Método Alternativo —', desc:'Aplicamos el método elegido.', tone:'purple'});

          // resolver por método
          let extra=[];
          const m=btn.dataset.method;
          if (m==='cofactor') {
            extra = cofactorExpansionSteps(A, 0).steps;
          } else if (m==='gauss') {
            extra = detEliminationWithSteps(A).steps;
          }

          extra.forEach(step => addStepCard(stepsStream, step));
          typeset(stepsStream);

          // scroll al final
          stepsStream.scrollTop = stepsStream.scrollHeight;
        });
      });
    });
  };

  // No auto-init aquí; el index principal llama window.initDeterminantes() tras inyectar el HTML.
})();

