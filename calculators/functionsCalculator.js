/**
 * Calculadora de Funciones - Módulo Frontend Refactorizado
 * Funcionalidad: Operaciones con funciones matemáticas usando MathJS + SymPy backend
 * Características: Control de estado dinámico, KaTeX, símbolos matemáticos, validación robusta
 */

class FunctionsCalculator {
  constructor() {
    console.log('🚀 Cargando FunctionsCalculator REFACTORIZADA v2.5 - Botón Resolver Visible');
    this.backendUrl = 'http://localhost:8000';
    this.math = null;
    this.currentFunction = '';
    this.currentOperation = '';
    this.isCalculating = false;
    this.isBackendConnected = false;
    
    // Estado del botón resolver
    this.isResolveButtonEnabled = false;
    
    // Configuración de símbolos matemáticos
    this.mathSymbols = [
      // Operadores básicos
      { label: '+', value: '+', title: 'Suma' },
      { label: '−', value: '-', title: 'Resta' },
      { label: '×', value: '*', title: 'Multiplicación' },
      { label: '÷', value: '/', title: 'División' },
      { label: '^', value: '^', title: 'Potencia' },
      { label: '(', value: '(', title: 'Paréntesis izquierdo' },
      { label: ')', value: ')', title: 'Paréntesis derecho' },
      { label: 'x', value: 'x', title: 'Variable x' },
      
      // Funciones matemáticas
      { label: 'sin', value: 'sin(', title: 'Seno' },
      { label: 'cos', value: 'cos(', title: 'Coseno' },
      { label: 'tan', value: 'tan(', title: 'Tangente' },
      { label: 'ln', value: 'log(', title: 'Logaritmo natural' },
      { label: 'eˣ', value: 'exp(', title: 'Exponencial' },
      { label: '√', value: 'sqrt(', title: 'Raíz cuadrada' },
      { label: '|x|', value: 'abs(', title: 'Valor absoluto' },
      { label: 'π', value: 'pi', title: 'Pi' },
      
      // Números
      { label: '0', value: '0', title: 'Cero' },
      { label: '1', value: '1', title: 'Uno' },
      { label: '2', value: '2', title: 'Dos' },
      { label: '3', value: '3', title: 'Tres' },
      { label: '4', value: '4', title: 'Cuatro' },
      { label: '5', value: '5', title: 'Cinco' },
      { label: '6', value: '6', title: 'Seis' },
      { label: '7', value: '7', title: 'Siete' },
      { label: '8', value: '8', title: 'Ocho' },
      { label: '9', value: '9', title: 'Nueve' },
      { label: '.', value: '.', title: 'Punto decimal' },
      { label: 'e', value: 'e', title: 'Número e' },
      
      // Utilidades
      { label: '⎵', value: ' ', title: 'Espacio' },
      { label: '⌫', value: 'Backspace', title: 'Borrar' },
      { label: '⌧', value: 'Clear', title: 'Limpiar' },
      { label: '📋', value: 'Copy', title: 'Copiar función' }
    ];
  }

  // ---- Inicialización ----
  async init() {
    try {
      console.log('🚀 Inicializando FunctionsCalculator...');
      
      // Esperar a que MathJS esté disponible
      await this.waitForMathJS();
      
      this.math = math;
      console.log('✅ MathJS configurado correctamente');
      
      this.setupUI();
      this.setupEventListeners();
      this.checkBackendConnection();
      
      console.log('✅ FunctionsCalculator inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando FunctionsCalculator:', error);
      this.showError(`Error al inicializar la calculadora: ${error.message}`);
      this.setupBasicUI();
    }
  }

  async waitForMathJS() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100;
      
      const checkMathJS = () => {
        if (typeof math !== 'undefined' && math.parse && math.evaluate) {
          console.log('✅ MathJS está completamente cargado');
          resolve();
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('MathJS no está disponible después de 10 segundos'));
          return;
        }
        
        setTimeout(checkMathJS, 100);
      };
      
      checkMathJS();
    });
  }

  setupBasicUI() {
    const container = document.getElementById('functionsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-6xl mx-auto p-6">
        <div class="bg-white rounded-xl shadow-xl p-8">
          <h2 class="text-3xl font-bold text-indigo-600 mb-8 text-center">
            <i data-lucide="calculator" class="w-8 h-8 inline-block mr-2"></i>
            Calculadora de Funciones
          </h2>
          
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <div class="flex items-center">
              <i data-lucide="alert-triangle" class="w-6 h-6 text-yellow-600 mr-3"></i>
              <div>
                <h3 class="text-lg font-semibold text-yellow-800">MathJS no disponible</h3>
                <p class="text-yellow-700 mt-1">
                  La calculadora requiere MathJS para funcionar. Recarga la página o verifica tu conexión a internet.
                </p>
              </div>
            </div>
          </div>
          
          <div class="text-center mt-6">
            <button onclick="location.reload()" class="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <i data-lucide="refresh-cw" class="w-5 h-5 inline-block mr-2"></i>
              Recargar página
            </button>
          </div>
        </div>
      </div>
    `;
    
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  setupUI() {
    const container = document.getElementById('functionsContainer');
    if (!container) {
      console.error('❌ Container #functionsContainer no encontrado');
      return;
    }

    container.innerHTML = `
      <!-- Layout principal centralizado tipo calculadora científica -->
      <div class="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl">
          <!-- Título principal -->
          <h2 class="text-2xl font-bold text-center text-indigo-700 mb-6">
            <i data-lucide="calculator" class="w-6 h-6 inline-block mr-2"></i>
            Calculadora Científica
          </h2>
          
          <!-- Input y símbolos -->
          <div class="mb-6">
            <label class="block text-gray-700 font-semibold mb-2">
              <i data-lucide="function" class="w-4 h-4 inline-block mr-1"></i>
              Función f(x) =
            </label>
            
            <!-- Input principal -->
            <div class="mb-4">
            <div class="flex gap-2">
              <input 
                type="text" 
                id="functionInput" 
                  placeholder="Ej: sin(x) + x^2, log(x), exp(x)"
                  class="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg transition-all duration-200"
                  autocomplete="off"
              />
              <button 
                  id="validateFunctionBtn"
                  class="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm flex items-center justify-center"
                  title="Validar función"
              >
                  <i data-lucide="check" class="w-5 h-5"></i>
              </button>
            </div>
            </div>
            
            <!-- Barra de símbolos matemáticos - GRID UNIFORME -->
            <div class="mt-4">
              <h4 class="text-sm font-medium text-gray-600 mb-2">
                <i data-lucide="keyboard" class="w-4 h-4 inline-block mr-1"></i>
                Símbolos matemáticos
              </h4>
              <div id="symbolButtons" style="display: grid; grid-template-columns: repeat(16, 1fr); gap: 4px;">
                ${this.mathSymbols.map(symbol => `
                  <button 
                    class="symbol-btn bg-gray-100 hover:bg-indigo-100 active:bg-indigo-200 text-gray-800 font-medium rounded-lg shadow-sm transition-all duration-150 hover:scale-105 flex items-center justify-center text-xs border border-gray-200" 
                    data-symbol="${symbol.value}" 
                    title="${symbol.title}"
                    style="aspect-ratio: 1; min-height: 30px;"
                  >
                    ${symbol.label}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Vista previa con KaTeX -->
          <div id="functionPreview" class="mb-6">
            <div class="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-4 text-center">
              <div class="flex items-center justify-center mb-2">
                <i data-lucide="eye" class="w-4 h-4 text-indigo-600 mr-2"></i>
                <span class="text-sm font-medium text-indigo-700">Vista previa en tiempo real</span>
              </div>
              <div id="functionPreviewMath" class="text-lg text-gray-800 min-h-[60px] flex items-center justify-center bg-white rounded-lg border border-indigo-100 shadow-sm"></div>
            </div>
          </div>

          <!-- Botones de operaciones -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-600 mb-2">
              <i data-lucide="settings" class="w-4 h-4 inline-block mr-1"></i>
              Operaciones
            </h4>
            <div id="operationButtons" style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn-operation flex-1 py-3 rounded-lg font-semibold transition-all duration-150 hover:scale-105 bg-gray-200 hover:bg-indigo-500 text-gray-700 hover:text-white border border-gray-300 min-w-0" data-operation="evaluate">
                <i data-lucide="calculator" class="w-4 h-4 inline-block mr-1"></i>
                Evaluar
              </button>
              <button class="btn-operation flex-1 py-3 rounded-lg font-semibold transition-all duration-150 hover:scale-105 bg-gray-200 hover:bg-indigo-500 text-gray-700 hover:text-white border border-gray-300 min-w-0" data-operation="derive">
                <i data-lucide="trending-up" class="w-4 h-4 inline-block mr-1"></i>
                Derivar
              </button>
              <button class="btn-operation flex-1 py-3 rounded-lg font-semibold transition-all duration-150 hover:scale-105 bg-gray-200 hover:bg-indigo-500 text-gray-700 hover:text-white border border-gray-300 min-w-0" data-operation="integrate">
                <i data-lucide="area-chart" class="w-4 h-4 inline-block mr-1"></i>
                Integrar
              </button>
              <button class="btn-operation flex-1 py-3 rounded-lg font-semibold transition-all duration-150 hover:scale-105 bg-gray-200 hover:bg-indigo-500 text-gray-700 hover:text-white border border-gray-300 min-w-0" data-operation="simplify">
                <i data-lucide="zap" class="w-4 h-4 inline-block mr-1"></i>
                Simplificar
              </button>
            </div>
          </div>

          <!-- Parámetros específicos -->
          <div id="parameterSection" class="mb-6 hidden">
            <div id="evaluateParams" class="hidden">
              <label class="block text-sm font-medium text-gray-600 mb-2">
                <i data-lucide="target" class="w-4 h-4 inline-block mr-1"></i>
                Evaluar en x =
              </label>
              <input 
                type="number" 
                id="evaluateValue" 
                placeholder="Ej: 2"
                step="any"
                class="w-full max-w-xs p-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <!-- Botón resolver ejercicio -->
          <div class="mb-6">
              <button 
                id="calculateBtn"
              class="w-full py-3 rounded-lg font-semibold transition-all duration-150 hover:scale-105 bg-gray-200 hover:bg-red-500 text-gray-700 hover:text-white border border-gray-300 cursor-not-allowed"
                disabled
              >
              <i data-lucide="play" class="w-4 h-4 inline-block mr-1"></i>
              Resolver Ejercicio
              </button>
            </div>
          
          <!-- Indicadores de estado -->
          <div id="resolveStatus" class="flex items-center justify-center space-x-6 text-sm mb-6">
            <span id="functionStatus" class="flex items-center px-3 py-1 rounded-full bg-gray-100">
              <i data-lucide="circle" class="w-3 h-3 mr-1 text-gray-400"></i>
              <span class="font-medium">Función</span>
                </span>
            <span id="operationStatus" class="flex items-center px-3 py-1 rounded-full bg-gray-100">
              <i data-lucide="circle" class="w-3 h-3 mr-1 text-gray-400"></i>
              <span class="font-medium">Operación</span>
                </span>
          </div>

          <!-- Resultados -->
          <div id="resultsSection" class="hidden">
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
              <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-600 mr-2"></i>
                Resultado
              </h3>
              <div id="resultDisplay" class="text-center">
              <!-- Resultado principal -->
              </div>
            </div>
            
            <!-- Pasos detallados -->
            <div id="stepsSection" class="mb-6">
              <h4 class="text-base font-bold text-gray-700 mb-3 flex items-center">
                <i data-lucide="list" class="w-4 h-4 mr-2"></i>
                Pasos detallados
              </h4>
              <div id="stepsStream" class="space-y-3 max-h-64 overflow-y-auto">
                <!-- Pasos se añaden aquí dinámicamente -->
              </div>
            </div>

            <!-- Explicación con LLM (opcional) -->
            <div id="explanationSection" class="hidden">
              <h4 class="text-base font-bold text-gray-700 mb-3 flex items-center">
                <i data-lucide="brain" class="w-4 h-4 mr-2"></i>
                Explicación
              </h4>
              <div id="llmExplanation" class="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4 text-sm">
                <!-- Explicación generada por LLM -->
              </div>
              <button 
                id="generateExplanationBtn"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                <i data-lucide="brain" class="w-4 h-4 inline-block mr-1"></i>
                Generar explicación
              </button>
            </div>
          </div>

          <!-- Estado del backend -->
          <div id="backendStatus" class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center">
              <div id="statusIndicator" class="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
              <span id="statusText" class="text-xs text-gray-600 font-medium">Verificando conexión...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Aplicar estilos a los botones
    this.styleOperationButtons();
    this.styleSymbolButtons();
    
    // Forzar grid después de un breve delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.forceGridLayout();
      this.forceOperationsLayout();
      this.forceResolveButtonVisibility();
    }, 100);
  }

  styleOperationButtons() {
    // Los estilos ya están aplicados en el HTML, solo actualizar el estado activo
    const buttons = document.querySelectorAll('.btn-operation');
    buttons.forEach(btn => {
      // Mantener los estilos base del HTML y solo cambiar el estado activo
      btn.addEventListener('click', function() {
        // Remover estado activo de todos los botones
        buttons.forEach(b => {
          b.classList.remove('bg-indigo-600', 'text-white');
          b.classList.add('bg-gray-200', 'text-gray-700');
        });
        // Activar botón seleccionado
        this.classList.remove('bg-gray-200', 'text-gray-700');
        this.classList.add('bg-indigo-600', 'text-white');
      });
    });
  }

  styleSymbolButtons() {
    // Los estilos ya están aplicados en el HTML
    // Solo agregar efectos adicionales si es necesario
    const buttons = document.querySelectorAll('.symbol-btn');
    buttons.forEach(btn => {
      // Agregar efecto de click
      btn.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.95)';
      });
      btn.addEventListener('mouseup', function() {
        this.style.transform = 'scale(1)';
      });
      btn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
      });
    });
  }

  forceGridLayout() {
    console.log('🔧 Forzando layout de grid...');
    const symbolContainer = document.getElementById('symbolButtons');
    if (symbolContainer) {
      // Aplicar estilos CSS directamente
      symbolContainer.style.display = 'grid';
      symbolContainer.style.gridTemplateColumns = 'repeat(16, 1fr)';
      symbolContainer.style.gap = '4px';
      symbolContainer.style.width = '100%';
      symbolContainer.style.maxWidth = '100%';
      
      // Aplicar estilos a cada botón
      const buttons = symbolContainer.querySelectorAll('.symbol-btn');
      buttons.forEach(btn => {
        btn.style.aspectRatio = '1';
        btn.style.minHeight = '30px';
        btn.style.fontSize = '11px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.width = '100%';
        btn.style.height = 'auto';
      });
      
      console.log(`✅ Grid aplicado a ${buttons.length} botones`);
    } else {
      console.warn('❌ Contenedor symbolButtons no encontrado');
    }
  }

  forceOperationsLayout() {
    console.log('🔧 Forzando layout horizontal de operaciones...');
    const operationsContainer = document.getElementById('operationButtons');
    if (operationsContainer) {
      // Aplicar layout flex horizontal
      operationsContainer.style.display = 'flex';
      operationsContainer.style.gap = '12px';
      operationsContainer.style.flexWrap = 'wrap';
      operationsContainer.style.width = '100%';
      
      // Aplicar estilos a cada botón de operación
      const buttons = operationsContainer.querySelectorAll('.btn-operation');
      buttons.forEach(btn => {
        btn.style.flex = '1';
        btn.style.minWidth = '0';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
      });
      
      console.log(`✅ Layout horizontal aplicado a ${buttons.length} botones de operaciones`);
    } else {
      console.warn('❌ Contenedor operationButtons no encontrado');
    }
  }

  forceResolveButtonVisibility() {
    console.log('🔧 Forzando visibilidad del botón resolver...');
    const resolveBtn = document.getElementById('calculateBtn');
    if (resolveBtn) {
      // Forzar visibilidad y estilos
      resolveBtn.style.display = 'flex';
      resolveBtn.style.alignItems = 'center';
      resolveBtn.style.justifyContent = 'center';
      resolveBtn.style.backgroundColor = '#e5e7eb';
      resolveBtn.style.color = '#374151';
      resolveBtn.style.border = '1px solid #d1d5db';
      resolveBtn.style.opacity = '1';
      resolveBtn.style.visibility = 'visible';
      resolveBtn.style.position = 'relative';
      resolveBtn.style.zIndex = '10';
      resolveBtn.style.width = '100%';
      resolveBtn.style.padding = '12px';
      resolveBtn.style.borderRadius = '8px';
      resolveBtn.style.fontWeight = '600';
      resolveBtn.style.transition = 'all 0.15s ease';
      
      console.log('✅ Botón resolver forzado a ser visible');
    } else {
      console.warn('❌ Botón calculateBtn no encontrado');
    }
  }

  setupEventListeners() {
    // Input de función con control de estado en tiempo real
    const functionInput = document.getElementById('functionInput');
    if (functionInput) {
      functionInput.addEventListener('input', (e) => {
        this.handleFunctionInput(e.target.value);
      });
      
      functionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.validateFunction();
        }
      });
    }

    // Botón de validación
    const validateBtn = document.getElementById('validateFunctionBtn');
    if (validateBtn) {
      validateBtn.addEventListener('click', () => {
        this.validateFunction();
      });
    }

    // Botones de operación
    document.querySelectorAll('.btn-operation').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectOperation(e.target.closest('.btn-operation').dataset.operation);
      });
    });

    // Botones de símbolos matemáticos
    document.querySelectorAll('.symbol-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.insertSymbol(e.target.dataset.symbol);
      });
    });

    // Botón calcular
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => {
      this.calculate();
    });
    }

    // Botón generar explicación
    const explanationBtn = document.getElementById('generateExplanationBtn');
    if (explanationBtn) {
      explanationBtn.addEventListener('click', () => {
      this.generateExplanation();
    });
    }
    
    // Renderizar iconos
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // ---- Control de Estado Dinámico ----
  
  handleFunctionInput(value) {
    this.currentFunction = value.trim();
    this.updateLivePreview(value);
    this.updateResolveButtonState();
  }

  updateResolveButtonState() {
    const hasValidFunction = this.currentFunction.length > 0 && this.isValidFunction(this.currentFunction);
    const hasOperation = !!this.currentOperation;
    const isEnabled = hasValidFunction && hasOperation && !this.isCalculating && this.isBackendConnected;

    this.isResolveButtonEnabled = isEnabled;
    this.updateResolveButton(isEnabled);
    this.updateStatusIndicators(hasValidFunction, hasOperation);
  }

  updateResolveButton(isEnabled) {
    const calculateBtn = document.getElementById('calculateBtn');
    if (!calculateBtn) return;

    calculateBtn.disabled = !isEnabled;
    
    if (isEnabled) {
      calculateBtn.className = 'w-full py-3 rounded-lg font-semibold transition-all duration-150 hover:scale-105 bg-red-500 hover:bg-red-600 text-white cursor-pointer border border-red-600';
      } else {
      calculateBtn.className = 'w-full py-3 rounded-lg font-semibold transition-all duration-150 hover:scale-105 bg-gray-200 hover:bg-red-500 text-gray-700 hover:text-white border border-gray-300 cursor-not-allowed';
    }
  }

  updateStatusIndicators(hasFunction, hasOperation) {
    this.updateStatusIndicator('functionStatus', hasFunction, 'Función');
    this.updateStatusIndicator('operationStatus', hasOperation, 'Operación');
  }

  updateStatusIndicator(elementId, isActive, label) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const icon = element.querySelector('i');
    const text = element.querySelector('span');
    
    if (icon) {
      icon.className = `w-4 h-4 mr-2 ${isActive ? 'text-green-500' : 'text-gray-400'}`;
      icon.setAttribute('data-lucide', isActive ? 'check-circle' : 'circle');
    }
    
    if (text) {
      text.textContent = label;
      element.className = `flex items-center px-4 py-2 rounded-full transition-all duration-200 ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`;
    }
    
    // Re-renderizar iconos
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // ---- Validación de Funciones ----
  
  isValidFunction(func) {
    if (!func || !func.trim()) return false;
    
    try {
      if (!this.math) return false;
      const parsed = this.math.parse(func.trim());
      return parsed !== null;
    } catch (error) {
      return false;
    }
  }

  validateFunction() {
    const functionInput = document.getElementById('functionInput');
    if (!functionInput) return;
    
    const input = functionInput.value.trim();
    if (!input) {
      this.showError('Por favor ingresa una función');
      return;
    }

    try {
      if (!this.math) {
        this.showError('MathJS no está disponible. Recarga la página.');
        return;
      }
      
      const parsed = this.math.parse(input);
      this.currentFunction = input;
      this.updateResolveButtonState();
      this.showNotification('Función válida', 'success');
      
    } catch (error) {
      this.showError(`Función inválida: ${error.message}`);
      this.currentFunction = '';
      this.updateResolveButtonState();
    }
  }

  // ---- Inserción de Símbolos Matemáticos ----
  
  insertSymbol(symbol) {
    const functionInput = document.getElementById('functionInput');
    if (!functionInput) return;

    const cursorPosition = functionInput.selectionStart;
    const currentValue = functionInput.value;
    
    let newValue = '';
    let newCursorPosition = cursorPosition;

    switch (symbol) {
      case 'Backspace':
        if (cursorPosition > 0) {
          newValue = currentValue.slice(0, cursorPosition - 1) + currentValue.slice(cursorPosition);
          newCursorPosition = cursorPosition - 1;
        }
        break;
      case 'Clear':
        newValue = '';
        newCursorPosition = 0;
        break;
      case 'Copy':
        if (currentValue) {
          navigator.clipboard.writeText(currentValue).then(() => {
            this.showNotification('Función copiada al portapapeles', 'success');
          }).catch(() => {
            this.showError('No se pudo copiar la función');
          });
        }
        return;
      default:
        newValue = currentValue.slice(0, cursorPosition) + symbol + currentValue.slice(cursorPosition);
        newCursorPosition = cursorPosition + symbol.length;
    }

    functionInput.value = newValue;
    functionInput.setSelectionRange(newCursorPosition, newCursorPosition);
    
    // Actualizar estado
    this.handleFunctionInput(newValue);
    functionInput.focus();
  }

  // ---- Renderizado KaTeX en Tiempo Real ----
  
  updateLivePreview(input) {
    const preview = document.getElementById('functionPreview');
    const previewMath = document.getElementById('functionPreviewMath');
    
    if (!preview || !previewMath) return;
    
    // Siempre mostrar la vista previa
    preview.classList.remove('hidden');
    
    if (input.trim()) {
      try {
        if (!this.isValidFunction(input)) {
          previewMath.innerHTML = `<span class="text-red-500 text-lg">⚠️ Función inválida</span>`;
          return;
        }
        
        const latex = this.mathToLatex(input);
        this.renderWithKaTeX(previewMath, `f(x) = ${latex}`);
        
      } catch (error) {
        previewMath.innerHTML = '<span class="text-red-500 text-lg">Error en formato matemático</span>';
      }
          } else {
      previewMath.innerHTML = `<span class="text-gray-400 text-lg">Ingresa una función para ver la vista previa</span>`;
    }
  }

  renderWithKaTeX(container, expression) {
    if (!container) return;
    
    try {
      container.innerHTML = '';
      
      if (window.katex) {
        const rendered = window.katex.renderToString(expression, {
          throwOnError: false,
          strict: false,
          trust: true,
          displayMode: true,
          errorColor: '#cc0000',
          fontSize: '1.2em'
        });
        container.innerHTML = rendered;
          } else {
        container.innerHTML = `<span class="text-gray-800 font-mono">${expression}</span>`;
      }
    } catch (error) {
      console.warn('Error renderizando con KaTeX:', error);
      container.innerHTML = `<span class="text-red-500">Error renderizando: ${expression}</span>`;
    }
  }

  mathToLatex(expression) {
    try {
      let latex = expression
        .replace(/\*\*/g, '^')
        .replace(/\*([a-zA-Z])/g, '\\cdot $1')
        .replace(/sin\(/g, '\\sin(')
        .replace(/cos\(/g, '\\cos(')
        .replace(/tan\(/g, '\\tan(')
        .replace(/log\(/g, '\\log(')
        .replace(/exp\(/g, 'e^')
        .replace(/sqrt\(/g, '\\sqrt{')
        .replace(/abs\(/g, '\\left|')
        .replace(/pi/g, '\\pi');
      
      // Manejar fracciones
      latex = latex.replace(/([^\/\s]+)\/([^\/\s]+)/g, (match, num, den) => {
        if (num.includes('\\frac') || den.includes('\\frac')) {
          return match;
        }
        return `\\frac{${num}}{${den}}`;
      });
      
      // Manejar exponentes
      latex = latex.replace(/\^([a-zA-Z0-9\(\)]+)/g, '^{$1}');
      
      return latex;
    } catch (error) {
      console.warn('Error convirtiendo a LaTeX:', error);
      return expression;
    }
  }

  // ---- Selección de Operaciones ----

  selectOperation(operation) {
    console.log('Operación seleccionada:', operation);
    this.currentOperation = operation;
    
    try {
      const operationButtons = document.querySelectorAll('.btn-operation');
      if (operationButtons.length === 0) return;
      
      // Resetear todos los botones al estado base
      operationButtons.forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
      });
      
      // Activar botón seleccionado
      const selectedBtn = document.querySelector(`[data-operation="${operation}"]`);
      if (selectedBtn) {
        selectedBtn.classList.remove('bg-gray-200', 'text-gray-700');
        selectedBtn.classList.add('bg-indigo-600', 'text-white');
      }

      // Mostrar parámetros específicos
      this.showParameters(operation);
      
      // Actualizar estado del botón calcular
      this.updateResolveButtonState();
      
      // Renderizar iconos
      if (window.lucide) {
        lucide.createIcons();
      }
    } catch (error) {
      console.error('Error en selectOperation:', error);
    }
  }

  showParameters(operation) {
    const section = document.getElementById('parameterSection');
    const evaluateParams = document.getElementById('evaluateParams');
    
    if (!section || !evaluateParams) return;
    
    // Ocultar todos los parámetros
    evaluateParams.classList.add('hidden');
    
    // Mostrar parámetros según la operación
    if (operation === 'evaluate') {
      evaluateParams.classList.remove('hidden');
    }
    
    section.classList.remove('hidden');
  }

  // ---- Cálculo y Backend ----

  async calculate() {
    if (!this.isResolveButtonEnabled) {
      this.showError('Por favor completa todos los campos requeridos');
      return;
    }

    const functionInput = document.getElementById('functionInput');
    const input = functionInput ? functionInput.value.trim() : '';
    
    if (!input || !this.currentOperation) {
      this.showError('Por favor ingresa una función y selecciona una operación');
      return;
    }

    try {
      this.isCalculating = true;
      this.updateResolveButtonState();

      // Verificar conectividad del backend
      if (!this.isBackendConnected) {
        throw new Error('Backend no disponible. Verifica que el servidor esté ejecutándose.');
      }

      // Mostrar loading
      const calculateBtn = document.getElementById('calculateBtn');
      if (calculateBtn) {
        calculateBtn.innerHTML = '<i data-lucide="loader-2" class="w-6 h-6 inline-block mr-3 animate-spin"></i><span class="font-bold">Resolviendo...</span>';
        calculateBtn.disabled = true;
      }
      
      this.showProgress('Enviando solicitud al servidor...');

      // Preparar datos para el backend
      const requestData = {
        function: input,
        operation: this.currentOperation
      };

      // Añadir parámetros específicos
      if (this.currentOperation === 'evaluate') {
        const evaluateInput = document.getElementById('evaluateValue');
        if (!evaluateInput) {
          throw new Error('Campo de evaluación no encontrado');
        }
        const value = evaluateInput.value;
        if (!value) {
          throw new Error('Por favor ingresa un valor para evaluar');
        }
        requestData.value = parseFloat(value);
      }

      // Llamar al backend
      const response = await fetch(`${this.backendUrl}/function/${this.currentOperation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      this.showProgress('Procesando respuesta...');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      
      this.showProgress('Mostrando resultados...');
      
      // Actualizar currentFunction
      this.currentFunction = input;
      
      // Mostrar resultados
      this.displayResults(result);
      
      // Verificación numérica con MathJS
      this.verifyWithMathJS(result);
      
      // Ocultar progreso
      this.hideProgress();
      
      // Mostrar notificación de éxito
      this.showNotification('Cálculo completado exitosamente', 'success');

    } catch (error) {
      console.error('Error en calculate:', error);
      let errorMessage = 'Error al calcular';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión: No se puede conectar con el servidor backend. Verifica que esté ejecutándose en http://localhost:8000';
      } else if (error.message.includes('Backend no disponible')) {
        errorMessage = error.message;
      } else if (error.message.includes('Error del servidor:')) {
        errorMessage = `Error del servidor: ${error.message}`;
      } else if (error.message.includes('Error parseando función')) {
        errorMessage = `Error en la función: ${error.message}`;
      } else {
        errorMessage = `Error al calcular: ${error.message}`;
      }
      
      this.showError(errorMessage);
      this.hideProgress();
     } finally {
      this.isCalculating = false;
      
       // Restaurar botón
       const calculateBtn = document.getElementById('calculateBtn');
       if (calculateBtn) {
        calculateBtn.innerHTML = '<i data-lucide="play" class="w-6 h-6 inline-block mr-3"></i><span class="font-bold">Resolver Ejercicio</span>';
         if (window.lucide) {
           lucide.createIcons();
         }
       }
      this.updateResolveButtonState();
     }
  }

  displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const resultDisplay = document.getElementById('resultDisplay');
    const stepsStream = document.getElementById('stepsStream');
    
    if (!resultsSection || !resultDisplay || !stepsStream) {
      console.error('Elementos de resultados no encontrados');
      return;
    }
    
    // Mostrar resultado principal con KaTeX
    resultDisplay.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div class="flex-shrink-0">
            <span class="text-xl font-bold text-gray-700">Función:</span>
        </div>
          <div id="functionMathDisplay" class="flex-1 text-center md:text-left"></div>
        </div>
        <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div class="flex-shrink-0">
            <span class="text-xl font-bold text-gray-700">${this.getOperationName(this.currentOperation)}:</span>
          </div>
          <div id="resultMathDisplay" class="flex-1 text-center md:text-left"></div>
        </div>
      </div>
    `;
    
    // Renderizar matemáticas con KaTeX
    const functionLatex = this.mathToLatex(this.currentFunction);
    
    const functionMathContainer = resultDisplay.querySelector('#functionMathDisplay');
    const resultMathContainer = resultDisplay.querySelector('#resultMathDisplay');
    
    if (functionMathContainer) {
      this.renderWithKaTeX(functionMathContainer, `f(x) = ${functionLatex}`);
    }
    
    if (resultMathContainer) {
      if (result.result.includes('Integral no') || result.result.includes('no se pudo calcular')) {
        resultMathContainer.innerHTML = `<span class="text-orange-600 font-medium text-lg">${result.result}</span>`;
      } else {
        const resultLatex = this.mathToLatex(result.result);
        this.renderWithKaTeX(resultMathContainer, resultLatex);
      }
    }

    // Mostrar pasos
    stepsStream.innerHTML = '';
    if (result.steps && result.steps.length > 0) {
      result.steps.forEach((step, index) => {
        this.addStepCard(stepsStream, {
          title: `Paso ${index + 1}`,
          desc: step,
          tone: 'blue'
        });
      });
    }

    // Mostrar sección de explicación
    const explanationSection = document.getElementById('explanationSection');
    if (explanationSection) {
      explanationSection.classList.remove('hidden');
    }
    
    resultsSection.classList.remove('hidden');
  }

  getOperationName(operation) {
    const names = {
      'evaluate': 'Evaluación',
      'derive': 'Derivada',
      'integrate': 'Integral',
      'simplify': 'Simplificación'
    };
    return names[operation] || operation;
  }

  addStepCard(container, { title, desc, tone = 'blue' }) {
    const card = document.createElement('div');
    card.className = `border-l-4 pl-3 py-3 bg-slate-50 rounded border-${tone}-500`;

    if (title) {
      const h = document.createElement('h4');
      h.className = 'font-semibold text-slate-800 mb-1';
      h.textContent = title;
      card.appendChild(h);
    }
    if (desc) {
      const p = document.createElement('p');
      p.className = 'text-slate-800 leading-relaxed mb-2 text-sm';
      p.innerHTML = desc;
      card.appendChild(p);
    }
    container.appendChild(card);
  }

  async verifyWithMathJS(result) {
    try {
      if (this.currentOperation === 'evaluate') {
        const evaluateInput = document.getElementById('evaluateValue');
        if (!evaluateInput) return;
        
        const value = parseFloat(evaluateInput.value);
        const mathResult = this.math.evaluate(this.currentFunction, { x: value });
        
        console.log('Verificación MathJS:', {
          backend: result.result,
          mathjs: mathResult,
          match: Math.abs(parseFloat(result.result) - mathResult) < 1e-10
        });
      }
    } catch (error) {
      console.warn('No se pudo verificar con MathJS:', error.message);
    }
  }

  // ---- Backend Connection ----
  
  async checkBackendConnection() {
    try {
      const response = await fetch(`${this.backendUrl}/health`);
      if (response.ok) {
        this.isBackendConnected = true;
        this.updateBackendStatus('Conectado', 'bg-green-400');
        this.updateResolveButtonState();
      } else {
        this.isBackendConnected = false;
        this.updateBackendStatus('Error de conexión', 'bg-red-400');
        this.updateResolveButtonState();
      }
    } catch (error) {
      this.isBackendConnected = false;
      this.updateBackendStatus('Backend no disponible', 'bg-red-400');
      this.updateResolveButtonState();
    }
  }

  updateBackendStatus(text, colorClass) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (indicator && statusText) {
      indicator.className = `w-4 h-4 rounded-full ${colorClass} mr-3`;
      statusText.textContent = text;
    }
  }

  // ---- Explicación con LLM ----

  async generateExplanation() {
    const btn = document.getElementById('generateExplanationBtn');
    if (!btn) return;
    
    try {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 inline-block mr-2 animate-spin"></i>Generando...';
      btn.disabled = true;

      const explanation = await this.callLLM();
      
      const explanationDiv = document.getElementById('llmExplanation');
      if (explanationDiv) {
        explanationDiv.innerHTML = `<p class="text-gray-700">${explanation}</p>`;
      }
      
    } catch (error) {
      this.showError(`Error generando explicación: ${error.message}`);
    } finally {
      if (btn) {
        btn.innerHTML = '<i data-lucide="brain" class="w-4 h-4 inline-block mr-2"></i>Generar explicación';
        btn.disabled = false;
        if (window.lucide) {
          lucide.createIcons();
        }
      }
    }
  }

  async callLLM() {
    const prompt = `
    Explica de forma natural y didáctica el siguiente cálculo matemático:
    
    Función: f(x) = ${this.currentFunction}
    Operación: ${this.getOperationName(this.currentOperation)}
    
    Proporciona una explicación clara y educativa.
    `;

    // Por ahora retornamos una explicación estática
    return `Esta es una explicación generada por el LLM local. 
    La función ${this.currentFunction} fue procesada usando ${this.getOperationName(this.currentOperation)}.
    Los pasos mostrados arriba detallan el procedimiento matemático utilizado.`;
  }

  // ---- Utilidades de UI ----

  showProgress(message) {
    let progressDiv = document.getElementById('progressMessage');
    if (!progressDiv) {
      progressDiv = document.createElement('div');
      progressDiv.id = 'progressMessage';
      progressDiv.className = 'fixed top-4 right-4 bg-indigo-500 text-white p-4 rounded-xl shadow-xl z-50';
      document.body.appendChild(progressDiv);
    }
    
    progressDiv.innerHTML = `
      <div class="flex items-center">
        <i data-lucide="loader-2" class="w-5 h-5 mr-2 animate-spin"></i>
        <span>${message}</span>
      </div>
    `;
    
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  hideProgress() {
    const progressDiv = document.getElementById('progressMessage');
    if (progressDiv && progressDiv.parentElement) {
      progressDiv.remove();
    }
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-xl shadow-xl z-50 transform transition-all duration-300 ${
      type === 'error' ? 'bg-red-500 text-white' : 
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-indigo-500 text-white'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-center">
        <i data-lucide="${
          type === 'error' ? 'alert-circle' : 
          type === 'success' ? 'check-circle' : 
          type === 'warning' ? 'alert-triangle' :
          'info'
        }" class="w-5 h-5 mr-3"></i>
        <span class="font-medium">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200 transition-colors">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
    `;
    
    // Añadir animación de entrada
    notification.style.transform = 'translateX(100%)';
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Renderizar iconos
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }
}

// Función global para resolución rápida
window.quickSolve = function(functionStr, operation) {
  console.log('quickSolve llamada con:', functionStr, operation);
  
  if (window.functionsCalculator) {
    // Establecer la función
    const functionInput = document.getElementById('functionInput');
    if (functionInput) {
      functionInput.value = functionStr;
      window.functionsCalculator.handleFunctionInput(functionStr);
    }
    
    // Seleccionar la operación
    setTimeout(() => {
      window.functionsCalculator.selectOperation(operation);
      
      // Calcular automáticamente
      setTimeout(() => {
        window.functionsCalculator.calculate();
      }, 100);
    }, 100);
  } else {
    console.error('FunctionsCalculator no está disponible');
  }
};

// Exportar para uso global
window.FunctionsCalculator = FunctionsCalculator;