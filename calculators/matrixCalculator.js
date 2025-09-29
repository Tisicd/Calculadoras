/**
 * Calculadora de Matrices Inversas - Módulo Refactorizado
 * Funcionalidad: Cálculo paso a paso de matrices inversas
 */

class MatrixCalculator {
  constructor() {
    // Configuración de estilos
    this.ACTIVE = ['bg-indigo-600', 'border-indigo-600', 'text-white', 'shadow'];
    this.INACTIVE = ['border-indigo-300', 'text-indigo-700', 'bg-white', 'shadow-sm', 'hover:bg-indigo-50', 'transition'];
    
    // Estado interno
    this.size = 2;
    this.matrix = [];
    this.prevSteps = [];
    this.methodSteps = [];
  }

  // ---- Helpers numéricos / formato ----
  clone(M) {
    return M.map(r => r.slice());
  }

  toFraction(x, maxDen = 1000, eps = 1e-10) {
    if (!isFinite(x)) return x;
    const sgn = x < 0 ? -1 : 1;
    x = Math.abs(x);
    let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    while (true) {
      const a = Math.floor(b);
      const h2 = a * h1 + h0, k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      const frac = b - a;
      if (frac < eps) break;
      b = 1 / frac;
    }
    const num = sgn * h1, den = k1 || 1;
    return this.simplify(num, den);
  }

  gcd(a, b) {
    a = Math.round(Math.abs(a));
    b = Math.round(Math.abs(b));
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
  }

  simplify(n, d) {
    const g = this.gcd(n, d);
    return [Math.round(n / g), Math.round(d / g)];
  }

  fmt(v) {
    if (typeof v !== 'number' || !isFinite(v)) return v;
    const [n, d] = this.toFraction(v, 2000);
    return d === 1 ? `${n}` : `${n}/${d}`;
  }

  latexMatrix(M) {
    return `\\begin{bmatrix}${M.map(r => r.map(v => this.fmt(v)).join(' & ')).join('\\\\')}\\end{bmatrix}`;
  }

  // ---- Álgebra ----
  minor(M, i, j) {
    return M.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
  }

  det2x2(m) {
    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  }

  detEliminationWithSteps(A) {
    const n = A.length, M = this.clone(A);
    let det = 1;
    const steps = [{
      title: 'Determinante por eliminación',
      desc: 'Triangulamos \\(A\\) por eliminación hacia adelante. El determinante es el producto de los pivotes (con cambio de signo por intercambios de filas).',
      matrix: this.clone(M),
      math: `\\[ \\text{Inicialmente } \\det(A)=1,\\quad A=${this.latexMatrix(M)} \\]`
    }];

    for (let i = 0; i < n; i++) {
      if (Math.abs(M[i][i]) < 1e-12) {
        let sw = i + 1;
        while (sw < n && Math.abs(M[sw][i]) < 1e-12) sw++;
        if (sw === n) {
          steps.push({
            title: `Pivote en columna ${i + 1} es 0`,
            desc: 'No hay fila para intercambiar \\(\\Rightarrow\\) \\(\\det(A)=0\\).',
            matrix: this.clone(M),
            math: `\\[ \\det(A)=0 \\]`
          });
          return { det: 0, steps };
        }
        [M[i], M[sw]] = [M[sw], M[i]];
        det *= -1;
        steps.push({
          title: `Intercambio \\(R_{${i + 1}}\\leftrightarrow R_{${sw + 1}}\\)`,
          desc: 'Cambia el signo de \\(\\det\\).',
          matrix: this.clone(M),
          math: `\\[ \\det\\leftarrow -\\det \\]`
        });
      }
      const p = M[i][i];
      det *= p;
      steps.push({
        title: `Pivote ${i + 1}`,
        desc: `Tomamos \\(p=A_{${i + 1}${i + 1}}\\).`,
        matrix: this.clone(M),
        math: `\\[ p=${this.fmt(p)},\\quad \\det\\leftarrow \\det\\cdot p \\]`
      });
      for (let r = i + 1; r < n; r++) {
        const f = M[r][i] / p;
        for (let c = i; c < n; c++) M[r][c] -= f * M[i][c];
        steps.push({
          title: `Eliminación en \\(R_{${r + 1}}\\)`,
          desc: `\\(R_{${r + 1}}\\leftarrow R_{${r + 1}}-${this.fmt(f)}\\,R_{${i + 1}}\\)`,
          matrix: this.clone(M)
        });
      }
    }
    steps.push({
      title: 'Producto de pivotes',
      desc: 'Matriz triangular \\(\\Rightarrow\\) producto de pivotes.',
      matrix: this.clone(M),
      math: `\\[ \\det(A)=${this.fmt(det)} \\]`
    });
    return { det, steps };
  }

  det3x3WithCofactorSteps(A) {
    const M11 = this.minor(A, 0, 0), M12 = this.minor(A, 0, 1), M13 = this.minor(A, 0, 2);
    const d11 = this.det2x2(M11), d12 = this.det2x2(M12), d13 = this.det2x2(M13);
    const C11 = +d11, C12 = -d12, C13 = +d13;
    const term1 = A[0][0] * C11, term2 = A[0][1] * C12, term3 = A[0][2] * C13;
    const det = term1 + term2 + term3;
    const mm = (m) => `\\begin{vmatrix}${this.fmt(m[0][0])} & ${this.fmt(m[0][1])}\\\\ ${this.fmt(m[1][0])} & ${this.fmt(m[1][1])}\\end{vmatrix}`;
    const steps = [
      {
        title: 'Fórmula 3×3 por primera fila',
        desc: '\\(\\det(A)=a_{11}C_{11}+a_{12}C_{12}+a_{13}C_{13}\\), con \\(C_{1j}=(-1)^{1+j}\\det(M_{1j})\\).',
        matrix: this.clone(A),
        math: `\\[ A=${this.latexMatrix(A)} \\]`
      },
      {
        title: 'Menor y cofactor \\(C_{11}\\)',
        desc: 'Eliminamos fila 1 y columna 1.',
        matrix: M11,
        math: `\\[ M_{11}=${mm(M11)},\\; C_{11}=+\\det(M_{11})=${this.fmt(d11)} \\]`
      },
      {
        title: 'Menor y cofactor \\(C_{12}\\)',
        desc: 'Eliminamos fila 1 y columna 2 (signo negativo).',
        matrix: M12,
        math: `\\[ M_{12}=${mm(M12)},\\; C_{12}=-\\det(M_{12})=${this.fmt(-d12)} \\]`
      },
      {
        title: 'Menor y cofactor \\(C_{13}\\)',
        desc: 'Eliminamos fila 1 y columna 3 (signo positivo).',
        matrix: M13,
        math: `\\[ M_{13}=${mm(M13)},\\; C_{13}=+\\det(M_{13})=${this.fmt(d13)} \\]`
      },
      {
        title: 'Suma final',
        desc: 'Sustituimos en la fórmula.',
        matrix: this.clone(A),
        math: `\\[ \\det(A)=(${this.fmt(A[0][0])})(${this.fmt(C11)})+(${this.fmt(A[0][1])})(${this.fmt(C12)})+(${this.fmt(A[0][2])})(${this.fmt(C13)})=${this.fmt(det)} \\]`
      }
    ];
    return { det, steps };
  }

  cofactorSteps(A) {
    const n = A.length, steps = [], C = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const Mij = this.minor(A, i, j);
        const dM = (Mij.length === 2) ? this.det2x2(Mij) : this.detEliminationWithSteps(Mij).det;
        const s = ((i + j) % 2 === 0) ? 1 : -1;
        C[i][j] = s * dM;
        steps.push({
          title: `Cofactor \\(C_{${i + 1}${j + 1}}\\)`,
          desc: `\\(C_{${i + 1}${j + 1}}=(-1)^{${i + 1}+${j + 1}}\\det(M_{${i + 1}${j + 1}})\\).`,
          matrix: Mij,
          math: `\\[ \\det(M_{${i + 1}${j + 1}})=${this.fmt(dM)}\\Rightarrow C_{${i + 1}${j + 1}}=${this.fmt(C[i][j])} \\]`
        });
      }
    }
    const Adj = C[0].map((_, i) => C.map(r => r[i]));
    steps.push({ title: 'Matriz de cofactores', desc: '', matrix: C, math: `\\[ C=${this.latexMatrix(C)} \\]` });
    steps.push({ title: 'Adjunta \\(\\mathrm{adj}(A)=C^\\top\\)', desc: '', matrix: Adj, math: `\\[ \\mathrm{adj}(A)=${this.latexMatrix(Adj)} \\]` });
    return { C, Adj, steps };
  }

  metodoFormula2x2(A, d) {
    const adj = [[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]];
    const inv = adj.map(r => r.map(v => v / d));
    return [
      { title: 'Fórmula 2×2', desc: '\\(A^{-1}=(1/\\det A)\\,\\mathrm{adj}(A)\\)', math: `\\[ A=${this.latexMatrix(A)}\\quad \\mathrm{adj}(A)=${this.latexMatrix(adj)} \\]` },
      { title: '\\(A^{-1}\\)', desc: `Multiplicamos por \\(1/\\det A=${this.fmt(d)}\\).`, matrix: inv, math: `\\[ A^{-1}=${this.latexMatrix(inv)} \\]` }
    ];
  }

  metodoAdjunta(A, d) {
    const { Adj } = this.cofactorSteps(A);
    const inv = Adj.map(r => r.map(v => v / d));
    return [
      { title: 'Adjunta', desc: '', matrix: Adj, math: `\\[ \\mathrm{adj}(A)=${this.latexMatrix(Adj)} \\]` },
      { title: '\\(A^{-1}\\)', desc: '\\(A^{-1}=(1/\\det A)\\,\\mathrm{adj}(A)\\).', matrix: inv, math: `\\[ A^{-1}=${this.latexMatrix(inv)} \\]` }
    ];
  }

  gaussJordanSteps(A) {
    const n = A.length, out = [];
    let aug = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
    out.push({
      title: 'Matriz aumentada \\([A\\,|\\,I]\\)',
      desc: 'Construimos \\([A|I]\\) para operar y convertir el bloque izquierdo en \\(I\\).',
      matrix: this.clone(aug),
      math: `\\[ [A|I]=${this.latexMatrix(aug)} \\]`
    });
    for (let k = 0; k < n; k++) {
      let pivot = aug[k][k];
      if (Math.abs(pivot) < 1e-12) {
        let sw = k + 1;
        while (sw < n && Math.abs(aug[sw][k]) < 1e-12) sw++;
        if (sw === n) throw new Error('Pivote 0 sin alternativa');
        [aug[k], aug[sw]] = [aug[sw], aug[k]];
        out.push({
          title: `Intercambio \\(R_{${k + 1}}\\leftrightarrow R_{${sw + 1}}\\)`,
          desc: 'Elegimos un mejor pivote para estabilidad numérica.',
          matrix: this.clone(aug)
        });
        pivot = aug[k][k];
      }
      out.push({
        title: `Normalizar \\(R_{${k + 1}}\\)`,
        desc: `\\(R_{${k + 1}}\\leftarrow R_{${k + 1}}/${this.fmt(pivot)}\\) para hacer 1 el pivote.`,
        matrix: this.clone(aug.map((r, ri) => r.map(v => ri === k ? v / pivot : v)))
      });
      aug[k] = aug[k].map(v => v / pivot);
      for (let i = 0; i < n; i++) {
        if (i === k) continue;
        const f = aug[i][k];
        if (Math.abs(f) < 1e-12) continue;
        aug[i] = aug[i].map((v, j) => v - f * aug[k][j]);
        out.push({
          title: `Eliminar en \\(R_{${i + 1}}\\)`,
          desc: `\\(R_{${i + 1}}\\leftarrow R_{${i + 1}}-${this.fmt(f)}R_{${k + 1}}\\) para anular la columna.`,
          matrix: this.clone(aug)
        });
      }
    }
    const inv = aug.map(r => r.slice(n));
    out.push({ title: 'Lectura de \\(A^{-1}\\)', desc: 'El bloque derecho es \\(A^{-1}\\).', matrix: inv, math: `\\[ A^{-1}=${this.latexMatrix(inv)} \\]` });
    return out;
  }

  // ---- Render: tarjetas en stream (solo scroll) ----
  addStepCard(container, { title, desc, math, matrix, tone = 'blue' }) {
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
      matrix.forEach(r => {
        const tr = document.createElement('tr');
        r.forEach(v => {
          const td = document.createElement('td');
          td.className = 'border px-3 py-2 text-sm';
          td.textContent = this.fmt(v);
          tr.appendChild(td);
        });
        tr.classList.add('bg-white');
        tbl.appendChild(tr);
      });
      card.appendChild(tbl);
    }
    container.appendChild(card);
  }

  typeset(el) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([el]).catch(() => { });
    }
  }

  // ---- Métodos públicos para UI ----
  setActive(group, btn) {
    group.forEach(b => { b.classList.remove(...this.ACTIVE); b.classList.add(...this.INACTIVE); });
    btn.classList.add(...this.ACTIVE);
    btn.classList.remove(...this.INACTIVE);
  }

  buildGrid(n) {
    const matrixGrid = document.getElementById('matrixGrid');
    matrixGrid.innerHTML = '';
    matrixGrid.style.gridTemplateColumns = `repeat(${n}, minmax(72px, 1fr))`;
    matrixGrid.classList.add('max-w-fit', 'mx-auto');
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.id = `input-${i}-${j}`;
        inp.placeholder = `${i + 1},${j + 1}`;
        inp.className = 'w-20 h-14 text-center text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white';
        matrixGrid.appendChild(inp);
      }
    }
  }

  buildMethods(n) {
    const methodButtonsWrap = document.getElementById('methodButtons');
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
  }

  clearSteps() {
    const stepsStream = document.getElementById('stepsStream');
    stepsStream.innerHTML = '<p class="text-slate-600">Completa la matriz y presiona <b>Calcular pasos previos</b>.</p>';
  }

  // ---- Inicialización principal ----
  init() {
    // refs UI
    const sizeButtons = [...document.querySelectorAll('#sizeButtons .btn-option')];
    const methodButtonsWrap = document.getElementById('methodButtons');
    const preCalcBtn = document.getElementById('preCalcBtn');
    const methodSection = document.getElementById('methodSection');
    const errorMsg = document.getElementById('errorMsg');
    const stepsStream = document.getElementById('stepsStream');

    // init tamaño
    sizeButtons.forEach(btn => {
      if (btn.dataset.size === '2') this.setActive(sizeButtons, btn);
      btn.addEventListener('click', () => {
        this.setActive(sizeButtons, btn);
        this.size = +btn.dataset.size;
        errorMsg.classList.add('hidden');
        methodSection.classList.add('hidden');
        this.clearSteps();
        this.buildGrid(this.size);
      });
    });

    // primeros inputs
    this.buildGrid(this.size);
    this.clearSteps();

    // pasos previos
    preCalcBtn.addEventListener('click', () => {
      // leer matriz
      this.matrix = [];
      for (let i = 0; i < this.size; i++) {
        const row = [];
        for (let j = 0; j < this.size; j++) {
          const v = Number(document.getElementById(`input-${i}-${j}`).value);
          if (!isFinite(v)) return alert('Completa todos los campos con números.');
          row.push(v);
        }
        this.matrix.push(row);
      }

      // limpiar stream
      stepsStream.innerHTML = '';

      // A y determinante con pasos
      let dInfo;
      if (this.size === 2) {
        const d = this.det2x2(this.matrix);
        dInfo = {
          det: d, steps: [{
            title: 'Determinante 2×2',
            desc: 'Usamos \\(\\det(A)=a\\,d-b\\,c\\).',
            matrix: this.clone(this.matrix),
            math: `\\[ A=${this.latexMatrix(this.matrix)},\\quad \\det(A)=(${this.fmt(this.matrix[0][0])})(${this.fmt(this.matrix[1][1])})-(${this.fmt(this.matrix[0][1])})(${this.fmt(this.matrix[1][0])})=${this.fmt(d)} \\]`
          }]
        };
      } else if (this.size === 3) {
        dInfo = this.det3x3WithCofactorSteps(this.matrix);
      } else {
        dInfo = this.detEliminationWithSteps(this.matrix);
      }

      this.prevSteps = dInfo.steps.slice();

      // render previos
      this.prevSteps.forEach(step => this.addStepCard(stepsStream, step));
      this.typeset(stepsStream);

      // invertible?
      if (dInfo.det === 0) {
        errorMsg.classList.remove('hidden');
        methodSection.classList.add('hidden');
        return;
      } else {
        errorMsg.classList.add('hidden');
      }

      // además muestro cofactores previos (ayuda didáctica)
      const { steps: cofSteps } = this.cofactorSteps(this.matrix);
      cofSteps.forEach(step => this.addStepCard(stepsStream, step));
      this.typeset(stepsStream);

      // mostrar métodos válidos según tamaño
      this.buildMethods(this.size);
      methodSection.classList.remove('hidden');

      // enlazar clicks método (delegación)
      methodButtonsWrap.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
          // marcar activo
          methodButtonsWrap.querySelectorAll('.btn-option').forEach(b => {
            b.classList.remove(...this.ACTIVE); b.classList.add(...this.INACTIVE);
          });
          btn.classList.add(...this.ACTIVE); btn.classList.remove(...this.INACTIVE);

          // calcular determinante (otra vez por seguridad)
          const d = (this.size === 2) ? this.det2x2(this.matrix) : this.detEliminationWithSteps(this.matrix).det;
          if (d === 0) { errorMsg.classList.remove('hidden'); return; }
          errorMsg.classList.add('hidden');

          // separador y título
          this.addStepCard(stepsStream, { title: '— Resolución —', desc: 'Aplicamos el método elegido.', tone: 'purple' });

          // resolver por método
          let extra = [];
          const m = btn.dataset.method;
          if (m === 'formula' && this.size !== 2) {
            this.addStepCard(stepsStream, { title: 'Fórmula 2×2', desc: 'No aplica para este tamaño.', tone: 'red' });
            return;
          }
          if (m === 'formula') extra = this.metodoFormula2x2(this.matrix, d);
          if (m === 'adj') extra = this.metodoAdjunta(this.matrix, d);
          if (m === 'gauss') extra = this.gaussJordanSteps(this.matrix);

          extra.forEach(step => this.addStepCard(stepsStream, step));
          this.typeset(stepsStream);

          // scroll al final
          stepsStream.scrollTop = stepsStream.scrollHeight;
        });
      });
    });
  }
}

// Exportar para uso global
window.MatrixCalculator = MatrixCalculator;

