// ============================================
// Calculadora Sistemas EDO Lineales
// ============================================

// Funciones globales ANTES de la IIFE para que estén disponibles inmediatamente
window.setEDOSysExample = function(example) {
  console.log('🔧 setEDOSysExample llamada con:', example);
  
  try {
    const matrix = JSON.parse(example);
    const size = matrix.length;
    
    // Simular click en botón de tamaño correcto
    const sizeButtons = document.querySelectorAll('.edosys-size-btn');
    sizeButtons.forEach(btn => {
      if (parseInt(btn.dataset.size) === size) {
        btn.click(); // Simular click para que actualice el grid
      }
    });
    
    // Esperar un poco y luego establecer valores
    setTimeout(() => {
      const grid = document.getElementById('edosysMatrixGrid');
      if (grid) {
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const inp = document.getElementById(`edosys-input-${i}-${j}`);
            if (inp) {
              inp.value = matrix[i][j] || '0';
              // Disparar evento input para actualizar estado
              inp.dispatchEvent(new Event('input'));
            }
          }
        }
        console.log('✅ Valores de ejemplo establecidos');
      }
    }, 100);
    
    console.log('✅ setEDOSysExample: proceso iniciado');
  } catch(err) {
    console.error('❌ Error en setEDOSysExample:', err);
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
    } catch(e) {
      console.warn('Error en typeset:', e);
    }
  }

  function addStep(container, title, latex, desc){
    const card = document.createElement('div');
    card.className = 'border-l-4 pl-3 py-3 bg-slate-50 rounded border-blue-500';
    if(title){
      const h = document.createElement('h4');
      h.className = 'font-semibold text-slate-800 mb-1';
      h.textContent = title;
      card.appendChild(h);
    }
    if(desc){
      const d = document.createElement('p');
      d.className = 'text-sm text-slate-600 mb-2';
      d.textContent = desc;
      card.appendChild(d);
    }
    if(latex){
      const m = document.createElement('div');
      m.className = 'bg-gray-50 p-2 rounded border text-center';
      m.innerHTML = latex;
      card.appendChild(m);
      typeset(m);
    }
    container.appendChild(card);
  }

  // Formatear números con fracciones
  function fmt(v){
    if (typeof v !== 'number' || !isFinite(v)) return v;
    const n = Math.round(v * 10000) / 10000;
    return n;
  }

  // Calcular fracción para LaTeX
  function toFraction(x, maxDen = 1000, eps = 1e-10) {
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
    return sgn === 1 ? `${h1}/${k1}` : `-${h1}/${k1}`;
  }

  // LaTeX de matriz
  function latexMatrix(M){
    return `\\begin{bmatrix}${M.map(r => r.map(fmt).join(' & ')).join('\\\\')}\\end{bmatrix}`;
  }

  // Calcular autovalores para matriz 2x2
  function eigvals2x2(A) {
    const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
    const trace = a + d;
    const det = a*d - b*c;
    const discriminant = trace*trace - 4*det;
    
    if (discriminant > 0) {
      const lambda1 = (trace + Math.sqrt(discriminant))/2;
      const lambda2 = (trace - Math.sqrt(discriminant))/2;
      return [lambda1, lambda2];
    } else if (discriminant === 0) {
      const lambda = trace/2;
      return [lambda, lambda];
    } else {
      const real = trace/2;
      const imag = Math.sqrt(-discriminant)/2;
      return [{re: real, im: imag}];
    }
  }

  // Inicialización
  window.initEDOSys = function(){
    console.log('🧮 initEDOSys: inicializando calculadora sistemas EDO');
    
    // Listar todos los elementos en el DOM con esos IDs para debug
    console.log('🔍 Buscando elementos en el DOM...');
    console.log('edosysMatrixGrid existe:', !!document.getElementById('edosysMatrixGrid'));
    console.log('edosysSolve existe:', !!document.getElementById('edosysSolve'));
    console.log('edosysSteps existe:', !!document.getElementById('edosysSteps'));
    console.log('edosysContainer existe:', !!document.getElementById('edosysContainer'));
    
    const sizeButtons = document.querySelectorAll('.edosys-size-btn');
    const matrixGrid = document.getElementById('edosysMatrixGrid');
    const btn = document.getElementById('edosysSolve');
    const steps = document.getElementById('edosysSteps');
    
    console.log('🔍 Elementos:', { 
      sizeButtons: sizeButtons.length, 
      matrixGrid: !!matrixGrid, 
      btn: !!btn, 
      steps: !!steps 
    });
    
    if(!matrixGrid||!btn||!steps) {
      console.error('❌ initEDOSys: elementos no encontrados', {
        matrixGrid: !!matrixGrid,
        btn: !!btn,
        steps: !!steps
      });
      
      // Intentar encontrar el elemento de otra forma
      console.log('🔍 Contenido del DOM:');
      console.log('querySelector .edosys-size-btn:', document.querySelectorAll('.edosys-size-btn').length);
      console.log('querySelectorAll [id="edosysMatrixGrid"]:', document.querySelectorAll('[id="edosysMatrixGrid"]').length);
      
      return;
    }

      console.log('✅ initEDOSys: elementos encontrados');

      let currentSize = 2;
      let A = [[0,0],[0,0]];

      // Clases para botones activos/inactivos
      const ACTIVE = ['bg-indigo-600', 'border-indigo-600', 'text-white', 'shadow'];
      const INACTIVE = ['border-indigo-300', 'text-indigo-700', 'bg-white', 'shadow-sm', 'hover:bg-indigo-50', 'transition'];

      const setActive = (group, btn) => {
        group.forEach(b => { b.classList.remove(...ACTIVE); b.classList.add(...INACTIVE); });
        btn.classList.add(...ACTIVE);
        btn.classList.remove(...INACTIVE);
      };

      // Construir grid con estilo mejorado
      function buildGrid(n){
        matrixGrid.innerHTML = '';
        matrixGrid.style.gridTemplateColumns = `repeat(${n}, minmax(72px, 1fr))`;
        matrixGrid.classList.add('max-w-fit', 'mx-auto');
        
        for(let i=0; i<n; i++){
          for(let j=0; j<n; j++){
            const inp = document.createElement('input');
            inp.type = 'number';
            inp.id = `edosys-input-${i}-${j}`;
            inp.placeholder = `${i+1},${j+1}`;
            inp.className = 'w-20 h-14 text-center text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white';
            inp.addEventListener('input', () => {
              A = getMatrixFromGrid(currentSize);
              updateButtonState();
            });
            matrixGrid.appendChild(inp);
          }
        }
        currentSize = n;
      }

    // Obtener matriz del grid
    function getMatrixFromGrid(n){
      const matrix = [];
      for(let i=0; i<n; i++){
        const row = [];
        for(let j=0; j<n; j++){
          const inp = document.getElementById(`edosys-input-${i}-${j}`);
          const val = parseFloat(inp.value) || 0;
          row.push(val);
        }
        matrix.push(row);
      }
      return matrix;
    }

    // Actualizar estado del botón
    function updateButtonState(){
      const hasData = A.some(row => row.some(val => val !== 0));
      btn.disabled = !hasData;
      if (hasData) {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.classList.add('hover:bg-indigo-700');
      } else {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.classList.remove('hover:bg-indigo-700');
      }
    }

    // Botones de tamaño con setActive
    const sizeButtonsArray = [...sizeButtons];
    sizeButtonsArray.forEach(btn => {
      if (btn.dataset.size === '2') setActive(sizeButtonsArray, btn);
      btn.addEventListener('click', () => {
        setActive(sizeButtonsArray, btn);
        const size = parseInt(btn.dataset.size);
        currentSize = size;
        buildGrid(size);
        A = getMatrixFromGrid(size);
        updateButtonState();
      });
    });

    // Event listeners para botones de ejemplo
    const exampleButtons = document.querySelectorAll('.edosys-example-btn');
    exampleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const example = button.getAttribute('data-example');
        if (example) {
          window.setEDOSysExample(example);
        }
      });
    });

    // Construir grid inicial (2x2 por defecto)
    console.log('🔧 Construyendo grid inicial 2x2...');
    buildGrid(2);
    A = getMatrixFromGrid(2);
    updateButtonState();
    console.log('✅ Grid inicial construido, matriz:', A);
    
    // Aplicar clase inicial al botón 2x2
    const initialBtn = sizeButtonsArray.find(btn => btn.dataset.size === '2');
    if (initialBtn) setActive(sizeButtonsArray, initialBtn);
    
    // Exponer funciones internas para setEDOSysExample
    window.currentEDOSysSize = currentSize;
    window.edosysGetMatrix = () => getMatrixFromGrid(currentSize);
    window.edosysBuildGrid = buildGrid;

    // Resolver sistema
    btn.addEventListener('click', function() {
      console.log('🧮 initEDOSys: click en Resolver Sistema');
      steps.innerHTML = '';
      
      A = getMatrixFromGrid(currentSize);
      console.log('📝 EDOSys: matriz ingresada:', A);
      
      // Validar matriz
      if (A.length === 0) {
        addStep(steps, 'Error', 'La matriz está vacía');
        return;
      }

      // Mostrar matriz del sistema
      addStep(steps, 'Matriz del sistema', '$$A = ' + latexMatrix(A) + '$$');
      
      addStep(steps, 'Sistema de EDO', 
        '$$\\frac{d\\mathbf{Y}}{dx} = A\\mathbf{Y}$$',
        'Donde \\mathbf{Y} = (y_1, y_2, ..., y_n)^T');

      // Calcular autovalores
      try {
        if (currentSize === 2) {
          const [lambda1, lambda2] = eigvals2x2(A);
          
          if (typeof lambda1 === 'object' && lambda1.im !== undefined) {
            // Autovalores complejos
            addStep(steps, 'Autovalores', 
              `$$\\lambda_1 = ${fmt(lambda1.re)} + ${fmt(lambda1.im)}i, \\quad \\lambda_2 = ${fmt(lambda1.re)} - ${fmt(lambda1.im)}i$$`);
            
            addStep(steps, 'Solución general',
              `$$\\mathbf{Y}(x) = e^{${fmt(lambda1.re)}x}\\left(\\mathbf{C}_1\\cos(${fmt(lambda1.im)}x) + \\mathbf{C}_2\\sin(${fmt(lambda1.im)}x)\\right)$$`);
          } else {
            if (lambda1 !== lambda2) {
              // Autovalores reales distintos
              addStep(steps, 'Autovalores', 
                `$$\\lambda_1 = ${fmt(lambda1)}, \\quad \\lambda_2 = ${fmt(lambda2)}$$`);
              
              addStep(steps, 'Solución general',
                `$$\\mathbf{Y}(x) = \\mathbf{C}_1e^{${fmt(lambda1)}x} + \\mathbf{C}_2e^{${fmt(lambda2)}x}$$`);
            } else {
              // Raíz doble
              addStep(steps, 'Autovalor doble', 
                `$$\\lambda = ${fmt(lambda1)}$$`);
              
              addStep(steps, 'Solución general',
                `$$\\mathbf{Y}(x) = e^{${fmt(lambda1)}x}(\\mathbf{C}_1 + x\\mathbf{C}_2)$$`);
            }
          }
        } else {
          // Para matrices 3x3 o 4x4, usar MathJS si está disponible
          if (typeof math !== 'undefined') {
            const matrixA = math.matrix(A);
            
            try {
              const eig = math.eigs(matrixA);
              const eigValues = eig.values.map(v => fmt(v));
              
              addStep(steps, 'Autovalores', 
                `$$\\lambda = ${eigValues.join(',\\quad ')}$$`);
              
              if (eig.vectors) {
                const vectorsLatex = eig.vectors.map((col, idx) => {
                  const vecValues = Array.isArray(col) ? col.map(v => fmt(v)) : fmt(col);
                  return `\\mathbf{v}_${idx+1} = \\begin{pmatrix} ${vecValues} \\end{pmatrix}`;
                }).join('$$, $$');
                
                addStep(steps, 'Autovectores',
                  `$$${vectorsLatex}$$`);
              }
              
              addStep(steps, 'Solución general',
                '$$\\mathbf{Y}(x) = \\sum_{i=1}^{' + currentSize + '} C_i e^{\\lambda_i x}\\mathbf{v}_i$$');
              
            } catch(eigError) {
              console.error('Error calculando con MathJS:', eigError);
              addStep(steps, 'Nota', 'No se pudieron calcular autovectores automáticamente');
              addStep(steps, 'Solución general',
                '$$\\mathbf{Y}(x) = e^{Ax}\\mathbf{C}$$');
            }
          } else {
            addStep(steps, 'Nota', 'Solo se pueden calcular autovalores manualmente para matrices 2x2');
            addStep(steps, 'Solución general',
              '$$\\mathbf{Y}(x) = e^{Ax}\\mathbf{C}$$');
          }
        }
        
        addStep(steps, 'Vector de constantes', 
          '$$\\mathbf{C} = \\begin{pmatrix} C_1 \\\\ C_2 \\\\ \\vdots \\\\ C_' + currentSize + ' \\end{pmatrix}$$');
        
      } catch(err) {
        console.error('Error:', err);
        addStep(steps, 'Error', 'Error al calcular la solución: ' + err.message);
      }
    });
  }; // Cerrar initEDOSys
})(); // Cerrar IIFE

