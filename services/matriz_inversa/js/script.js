(function () {
  if (window.__matrizInversa_scroll_v2) return;
  window.__matrizInversa_scroll_v2 = true;

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

  function latexMatrix(M){
    return `\\begin{bmatrix}${M.map(r=>r.map(fmt).join(' & ')).join('\\\\')}\\end{bmatrix}`;
  }

  // ---- Álgebra ----
  const minor = (M,i,j)=> M.filter((_,r)=>r!==i).map(row=>row.filter((_,c)=>c!==j));
  const det2x2 = (m)=> m[0][0]*m[1][1] - m[0][1]*m[1][0];

  function detEliminationWithSteps(A){
    const n=A.length, M=clone(A); let det=1;
    const steps=[{
      title:'Determinante por eliminación',
      desc:'Triangulamos \\(A\\) por eliminación hacia adelante. El determinante es el producto de los pivotes (con cambio de signo por intercambios de filas).',
      matrix: clone(M),
      math:`\\[ \\text{Inicialmente } \\det(A)=1,\\quad A=${latexMatrix(M)} \\]`
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
        math:`\\[ A=${latexMatrix(A)} \\]` },
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

  function cofactorSteps(A){
    const n=A.length, steps=[], C=Array.from({length:n},()=>Array(n).fill(0));
    for(let i=0;i<n;i++){
      for(let j=0;j<n;j++){
        const Mij=minor(A,i,j);
        const dM = (Mij.length===2)? det2x2(Mij) : detEliminationWithSteps(Mij).det;
        const s = ((i+j)%2===0)? 1 : -1;
        C[i][j]=s*dM;
        steps.push({
          title:`Cofactor \\(C_{${i+1}${j+1}}\\)`,
          desc:`\\(C_{${i+1}${j+1}}=(-1)^{${i+1}+${j+1}}\\det(M_{${i+1}${j+1}})\\).`,
          matrix:Mij,
          math:`\\[ \\det(M_{${i+1}${j+1}})=${fmt(dM)}\\Rightarrow C_{${i+1}${j+1}}=${fmt(C[i][j])} \\]`
        });
      }
    }
    const Adj = C[0].map((_,i)=>C.map(r=>r[i]));
    steps.push({title:'Matriz de cofactores', desc:'', matrix:C,   math:`\\[ C=${latexMatrix(C)} \\]`});
    steps.push({title:'Adjunta \\(\\mathrm{adj}(A)=C^\\top\\)', desc:'', matrix:Adj, math:`\\[ \\mathrm{adj}(A)=${latexMatrix(Adj)} \\]`});
    return {C, Adj, steps};
  }

  function metodoFormula2x2(A,d){
    const adj=[[A[1][1],-A[0][1]],[-A[1][0],A[0][0]]];
    const inv = adj.map(r=>r.map(v=>v/d));
    return [
      {title:'Fórmula 2×2', desc:'\\(A^{-1}=(1/\\det A)\\,\\mathrm{adj}(A)\\)', math:`\\[ A=${latexMatrix(A)}\\quad \\mathrm{adj}(A)=${latexMatrix(adj)} \\]`},
      {title:'\\(A^{-1}\\)', desc:`Multiplicamos por \\(1/\\det A=${fmt(d)}\\).`, matrix: inv, math:`\\[ A^{-1}=${latexMatrix(inv)} \\]`}
    ];
  }

  function metodoAdjunta(A,d){
    const {Adj} = cofactorSteps(A);
    const inv = Adj.map(r=>r.map(v=>v/d));
    return [
      {title:'Adjunta',  desc:'', matrix: Adj, math:`\\[ \\mathrm{adj}(A)=${latexMatrix(Adj)} \\]`},
      {title:'\\(A^{-1}\\)', desc:`\\(A^{-1}=(1/\\det A)\\,\\mathrm{adj}(A)\\).`, matrix: inv, math:`\\[ A^{-1}=${latexMatrix(inv)} \\]`}
    ];
  }

  function gaussJordanSteps(A){
    const n=A.length, out=[];
    let aug=A.map((row,i)=>[...row, ...Array.from({length:n},(_,j)=>i===j?1:0)]);
    out.push({title:'Matriz aumentada \\([A\\,|\\,I]\\)', desc:'Construimos \\([A|I]\\) para operar y convertir el bloque izquierdo en \\(I\\).', matrix: clone(aug), math:`\\[ [A|I]=${latexMatrix(aug)} \\]`});
    for(let k=0;k<n;k++){
      let pivot=aug[k][k];
      if (Math.abs(pivot)<1e-12){
        let sw=k+1; while(sw<n && Math.abs(aug[sw][k])<1e-12) sw++;
        if (sw===n) throw new Error('Pivote 0 sin alternativa');
        [aug[k],aug[sw]]=[aug[sw],aug[k]];
        out.push({title:`Intercambio \\(R_{${k+1}}\\leftrightarrow R_{${sw+1}}\\)`, desc:'Elegimos un mejor pivote para estabilidad numérica.', matrix: clone(aug)});
        pivot=aug[k][k];
      }
      out.push({title:`Normalizar \\(R_{${k+1}}\\)`, desc:`\\(R_{${k+1}}\\leftarrow R_{${k+1}}/${fmt(pivot)}\\) para hacer 1 el pivote.`, matrix: clone(aug.map((r,ri)=> r.map(v=> ri===k? v/pivot : v )))});
      aug[k]=aug[k].map(v=>v/pivot);
      for(let i=0;i<n;i++){
        if (i===k) continue;
        const f=aug[i][k];
        if (Math.abs(f)<1e-12) continue;
        aug[i]=aug[i].map((v,j)=>v-f*aug[k][j]);
        out.push({title:`Eliminar en \\(R_{${i+1}}\\)`, desc:`\\(R_{${i+1}}\\leftarrow R_{${i+1}}-${fmt(f)}R_{${k+1}}\\) para anular la columna.`, matrix: clone(aug)});
      }
    }
    const inv=aug.map(r=>r.slice(n));
    out.push({title:'Lectura de \\(A^{-1}\\)', desc:'El bloque derecho es \\(A^{-1}\\).', matrix: inv, math:`\\[ A^{-1}=${latexMatrix(inv)} \\]`});
    return out;
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
      m.innerHTML = math;
      card.appendChild(m);
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
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([el]).catch(()=>{});
    }
  }

  // ---- INIT pública ----
  window.initMatrizInversa = function initMatrizInversa(){
    // refs UI
    const sizeButtons   = [...document.querySelectorAll('#sizeButtons .btn-option')];
    const methodButtonsWrap = document.getElementById('methodButtons');
    const matrixGrid    = document.getElementById('matrixGrid');
    const preCalcBtn    = document.getElementById('preCalcBtn');
    const methodSection = document.getElementById('methodSection');

    const errorMsg      = document.getElementById('errorMsg');
    const stepsStream   = document.getElementById('stepsStream');

    // estado
    let size=2, A=[], prevSteps=[], methodSteps=[];

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
      // siempre Gauss–Jordan
      const btnG = document.createElement('button');
      btnG.textContent = 'Gauss–Jordan';
      btnG.dataset.method = 'gauss';
      btnG.className = 'btn-option border border-indigo-300 text-indigo-700 bg-white shadow-sm hover:bg-indigo-50 transition px-4 py-2 rounded-xl';
      methodButtonsWrap.appendChild(btnG);

      if (n === 2) {
        const btnF = document.createElement('button');
        btnF.textContent = 'Fórmula (2×2)';
        btnF.dataset.method = 'formula';
        btnF.className = 'btn-option border border-indigo-300 text-indigo-700 bg-white shadow-sm hover:bg-indigo-50 transition px-4 py-2 rounded-xl';
        methodButtonsWrap.appendChild(btnF);
      } else {
        const btnA = document.createElement('button');
        btnA.textContent = 'Adjunta / Cofactores';
        btnA.dataset.method = 'adj';
        btnA.className = 'btn-option border border-indigo-300 text-indigo-700 bg-white shadow-sm hover:bg-indigo-50 transition px-4 py-2 rounded-xl';
        methodButtonsWrap.appendChild(btnA);
      }
    };

    const clearSteps = ()=>{
      stepsStream.innerHTML = '<p class="text-slate-600">Completa la matriz y presiona <b>Calcular pasos previos</b>.</p>';
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

    // pasos previos
    preCalcBtn.addEventListener('click', ()=>{
      // leer matriz
      A=[]; for(let i=0;i<size;i++){ const row=[]; for(let j=0;j<size;j++){
        const v=Number(document.getElementById(`input-${i}-${j}`).value);
        if (!isFinite(v)) return alert('Completa todos los campos con números.');
        row.push(v);} A.push(row); }

      // limpiar stream
      stepsStream.innerHTML = '';

      // A y determinante con pasos
      let dInfo;
      if (size===2){
        const d=det2x2(A);
        dInfo={det:d, steps:[{title:'Determinante 2×2',
          desc:'Usamos \\(\\det(A)=a\\,d-b\\,c\\).',
          matrix: clone(A),
          math:`\\[ A=${latexMatrix(A)},\\quad \\det(A)=(${fmt(A[0][0])})(${fmt(A[1][1])})-(${fmt(A[0][1])})(${fmt(A[1][0])})=${fmt(d)} \\]`}]} ;
      } else if (size===3){
        dInfo = det3x3WithCofactorSteps(A);
      } else {
        dInfo = detEliminationWithSteps(A);
      }

      prevSteps = dInfo.steps.slice();

      // render previos
      prevSteps.forEach(step => addStepCard(stepsStream, step));
      typeset(stepsStream);

      // invertible?
      if (dInfo.det===0){
        errorMsg.classList.remove('hidden');
        methodSection.classList.add('hidden');
        return;
      } else {
        errorMsg.classList.add('hidden');
      }

      // además muestro cofactores previos (ayuda didáctica)
      const {steps: cofSteps} = cofactorSteps(A);
      cofSteps.forEach(step => addStepCard(stepsStream, step));
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

          // calcular determinante (otra vez por seguridad)
          const d = (size===2) ? det2x2(A) : detEliminationWithSteps(A).det;
          if (d===0){ errorMsg.classList.remove('hidden'); return; }
          errorMsg.classList.add('hidden');

          // separador y título
          addStepCard(stepsStream, {title:'— Resolución —', desc:'Aplicamos el método elegido.', tone:'purple'});

          // resolver por método
          let extra=[];
          const m=btn.dataset.method;
          if (m==='formula' && size!==2) {
            addStepCard(stepsStream, {title:'Fórmula 2×2', desc:'No aplica para este tamaño.', tone:'red'});
            return;
          }
          if (m==='formula')  extra = metodoFormula2x2(A,d);
          if (m==='adj')      extra = metodoAdjunta(A,d);
          if (m==='gauss')    extra = gaussJordanSteps(A);

          extra.forEach(step => addStepCard(stepsStream, step));
          typeset(stepsStream);

          // scroll al final
          stepsStream.scrollTop = stepsStream.scrollHeight;
        });
      });
    });
  };

  // No auto-init aquí; el index principal llama window.initMatrizInversa() tras inyectar el HTML.
})();
