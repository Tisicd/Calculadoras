/**
 * Calculadora de Funciones - Módulo Frontend
 * Funcionalidad: Operaciones con funciones matemáticas usando MathJS + SymPy backend
 */

class FunctionsCalculator {
  constructor() {
    this.backendUrl = 'http://localhost:8000'; // URL del backend FastAPI
    this.math = null; // MathJS instance
    this.currentFunction = '';
    this.currentOperation = '';
    this.steps = [];
    
    // Configuración de estilos
    this.ACTIVE = ['bg-blue-600', 'border-blue-600', 'text-white', 'shadow'];
    this.INACTIVE = ['border-blue-300', 'text-blue-700', 'bg-white', 'shadow-sm', 'hover:bg-blue-50', 'transition'];
  }

  // ---- Inicialización ----
  async init() {
    try {
      console.log('Inicializando FunctionsCalculator...');
      
      // Esperar a que MathJS esté disponible
      await this.waitForMathJS();
      
      this.math = math;
      console.log('MathJS configurado correctamente');
      
      this.setupUI();
      this.setupEventListeners();
      console.log('FunctionsCalculator inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando FunctionsCalculator:', error);
      this.showError(`Error al inicializar la calculadora: ${error.message}`);
      
      // Intentar configurar UI básico sin MathJS
      this.setupBasicUI();
    }
  }

  async waitForMathJS() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 segundos máximo
      
      const checkMathJS = () => {
        console.log(`Verificando MathJS... intento ${attempts + 1}/${maxAttempts}`);
        
        // Verificar si MathJS está disponible y completamente cargado
        if (typeof math !== 'undefined' && math.parse && math.evaluate) {
          console.log('✅ MathJS está completamente cargado y funcional');
          resolve();
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('❌ MathJS no está disponible después de 10 segundos');
          console.log('Estado actual:', {
            'typeof math': typeof math,
            'math.parse': typeof math?.parse,
            'math.evaluate': typeof math?.evaluate
          });
          reject(new Error('MathJS no está disponible después de 10 segundos'));
          return;
        }
        
        setTimeout(checkMathJS, 100);
      };
      
      // Iniciar verificación inmediatamente
      checkMathJS();
    });
  }

  setupBasicUI() {
    const container = document.getElementById('functionsContainer');
    if (!container) {
      console.error('Container #functionsContainer no encontrado');
      return;
    }

    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            <i data-lucide="function" class="w-8 h-8 inline-block mr-2"></i>
            Calculadora de Funciones
          </h2>
          
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div class="flex items-center">
              <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-600 mr-2"></i>
              <div>
                <h3 class="text-sm font-medium text-yellow-800">MathJS no disponible</h3>
                <p class="text-sm text-yellow-700 mt-1">
                  La calculadora requiere MathJS para funcionar. Recarga la página o verifica tu conexión a internet.
                </p>
              </div>
            </div>
          </div>
          
          <div class="text-center">
            <button onclick="location.reload()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <i data-lucide="refresh-cw" class="w-4 h-4 inline-block mr-2"></i>
              Recargar página
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Renderizar iconos
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  setupUI() {
    const container = document.getElementById('functionsContainer');
    if (!container) {
      console.error('Container #functionsContainer no encontrado');
      return;
    }

    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            <i data-lucide="function" class="w-8 h-8 inline-block mr-2"></i>
            Calculadora de Funciones
          </h2>
          
          <!-- Input de función -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Función f(x) =
            </label>
            <div class="flex gap-2">
              <input 
                type="text" 
                id="functionInput" 
                placeholder="Ej: x^2 + 2*x + 1, sin(x), exp(x), log(x)"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button 
                id="parseFunctionBtn"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Parsear
              </button>
            </div>
            <div id="functionPreview" class="mt-2 p-3 bg-gray-50 rounded-lg hidden">
              <span class="text-sm text-gray-600">Vista previa: </span>
              <span id="functionPreviewText" class="font-mono"></span>
            </div>
          </div>

          <!-- Operaciones disponibles -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Operación:
            </label>
            <div id="operationButtons" class="flex flex-wrap gap-2">
              <button class="btn-operation" data-operation="evaluate">
                <i data-lucide="calculator" class="w-4 h-4 mr-1"></i>
                Evaluar
              </button>
              <button class="btn-operation" data-operation="derive">
                <i data-lucide="trending-up" class="w-4 h-4 mr-1"></i>
                Derivar
              </button>
              <button class="btn-operation" data-operation="integrate">
                <i data-lucide="area-chart" class="w-4 h-4 mr-1"></i>
                Integrar
              </button>
              <button class="btn-operation" data-operation="simplify">
                <i data-lucide="zap" class="w-4 h-4 mr-1"></i>
                Simplificar
              </button>
            </div>
            
            <!-- Botones de resolución rápida -->
            <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 class="text-sm font-medium text-blue-800 mb-2">
                <i data-lucide="zap" class="w-4 h-4 inline-block mr-1"></i>
                Resolución rápida
              </h4>
              <div class="flex flex-wrap gap-2">
                <button class="btn-quick" onclick="quickSolve('x^2 + 2*x + 1', 'derive')">
                  <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                  Derivar x²+2x+1
                </button>
                <button class="btn-quick" onclick="quickSolve('sin(x)', 'derive')">
                  <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                  Derivar sin(x)
                </button>
                <button class="btn-quick" onclick="quickSolve('exp(x)', 'integrate')">
                  <i data-lucide="area-chart" class="w-3 h-3 mr-1"></i>
                  Integrar eˣ
                </button>
                <button class="btn-quick" onclick="quickSolve('log(x)', 'derive')">
                  <i data-lucide="trending-up" class="w-3 h-3 mr-1"></i>
                  Derivar ln(x)
                </button>
              </div>
            </div>
          </div>

          <!-- Parámetros específicos -->
          <div id="parameterSection" class="mb-6 hidden">
            <div id="evaluateParams" class="hidden">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Evaluar en x =
              </label>
              <input 
                type="number" 
                id="evaluateValue" 
                placeholder="Ej: 2"
                step="any"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Botón calcular -->
          <div class="mb-6 text-center">
            <div class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                <i data-lucide="zap" class="w-5 h-5 inline-block mr-2 text-green-600"></i>
                Resolver Ejercicio
              </h3>
              <p class="text-sm text-gray-600 mb-4">
                Una vez que hayas ingresado la función y seleccionado la operación, podrás resolver el ejercicio paso a paso
              </p>
              <button 
                id="calculateBtn"
                class="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                disabled
              >
                <i data-lucide="play" class="w-5 h-5 inline-block mr-2"></i>
                <span class="font-semibold">Resolver</span>
              </button>
            </div>
            <div id="resolveStatus" class="text-sm text-gray-500">
              <div class="flex items-center justify-center space-x-4">
                <span id="functionStatus" class="flex items-center">
                  <i data-lucide="check-circle" class="w-4 h-4 mr-1 text-gray-400"></i>
                  Función
                </span>
                <span id="operationStatus" class="flex items-center">
                  <i data-lucide="check-circle" class="w-4 h-4 mr-1 text-gray-400"></i>
                  Operación
                </span>
              </div>
            </div>
          </div>

          <!-- Resultados -->
          <div id="resultsSection" class="hidden">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Resultado:</h3>
            <div id="resultDisplay" class="mb-4 p-4 bg-blue-50 rounded-lg">
              <!-- Resultado principal -->
            </div>
            
            <!-- Pasos detallados -->
            <div id="stepsSection" class="mb-4">
              <h4 class="text-md font-semibold text-gray-700 mb-3">Pasos detallados:</h4>
              <div id="stepsStream" class="space-y-3 max-h-96 overflow-y-auto">
                <!-- Pasos se añaden aquí dinámicamente -->
              </div>
            </div>

            <!-- Explicación con LLM (opcional) -->
            <div id="explanationSection" class="hidden">
              <h4 class="text-md font-semibold text-gray-700 mb-3">Explicación:</h4>
              <div id="llmExplanation" class="p-4 bg-gray-50 rounded-lg">
                <!-- Explicación generada por LLM -->
              </div>
              <button 
                id="generateExplanationBtn"
                class="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <i data-lucide="brain" class="w-4 h-4 inline-block mr-1"></i>
                Generar explicación
              </button>
            </div>
          </div>

          <!-- Estado del backend -->
          <div id="backendStatus" class="mt-4 p-3 rounded-lg">
            <div class="flex items-center">
              <div id="statusIndicator" class="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
              <span id="statusText" class="text-sm text-gray-600">Verificando conexión...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Aplicar estilos a los botones de operación
    this.styleOperationButtons();
  }

  styleOperationButtons() {
    const buttons = document.querySelectorAll('.btn-operation');
    buttons.forEach(btn => {
      btn.className = 'btn-operation border border-blue-300 text-blue-700 bg-white shadow-sm hover:bg-blue-50 transition px-4 py-2 rounded-xl flex items-center';
    });
    
    // Estilos para botones de resolución rápida
    const quickButtons = document.querySelectorAll('.btn-quick');
    quickButtons.forEach(btn => {
      btn.className = 'btn-quick border border-blue-400 text-blue-800 bg-blue-100 shadow-sm hover:bg-blue-200 transition px-3 py-1 rounded-lg flex items-center text-sm';
    });
  }

  setupEventListeners() {
    // Parsear función
    document.getElementById('parseFunctionBtn').addEventListener('click', () => {
      this.parseFunction();
    });

    // Input de función con Enter
    document.getElementById('functionInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.parseFunction();
      }
    });

    // Botones de operación
    document.querySelectorAll('.btn-operation').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectOperation(e.target.dataset.operation);
      });
    });

    // Calcular
    document.getElementById('calculateBtn').addEventListener('click', () => {
      this.calculate();
    });

    // Generar explicación
    document.getElementById('generateExplanationBtn').addEventListener('click', () => {
      this.generateExplanation();
    });

    // Verificar estado del backend
    this.checkBackendStatus();
    
    // Renderizar iconos
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  async checkBackendStatus() {
    try {
      const response = await fetch(`${this.backendUrl}/health`);
      if (response.ok) {
        this.updateStatus('Conectado', 'bg-green-400');
      } else {
        this.updateStatus('Error de conexión', 'bg-red-400');
      }
    } catch (error) {
      this.updateStatus('Backend no disponible', 'bg-red-400');
    }
  }

  updateStatus(text, colorClass) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    indicator.className = `w-3 h-3 rounded-full ${colorClass} mr-2`;
    statusText.textContent = text;
  }

  parseFunction() {
    const input = document.getElementById('functionInput').value.trim();
    if (!input) {
      this.showError('Por favor ingresa una función');
      return;
    }

    try {
      // Verificar que MathJS esté disponible
      if (!this.math) {
        this.showError('MathJS no está disponible. Recarga la página.');
        return;
      }
      
      // Validar con MathJS
      const parsed = this.math.parse(input);
      this.currentFunction = input;
      
      // Mostrar vista previa
      const preview = document.getElementById('functionPreview');
      const previewText = document.getElementById('functionPreviewText');
      if (preview && previewText) {
        previewText.textContent = `f(x) = ${input}`;
        preview.classList.remove('hidden');
      }
      
      // Habilitar botón calcular si ya hay una operación seleccionada
      this.updateCalculateButton();
      
      console.log('Función parseada correctamente:', input);
    } catch (error) {
      this.showError(`Error al parsear la función: ${error.message}`);
      const calculateBtn = document.getElementById('calculateBtn');
      if (calculateBtn) {
        calculateBtn.disabled = true;
      }
    }
  }

  updateCalculateButton() {
    const calculateBtn = document.getElementById('calculateBtn');
    const functionStatus = document.getElementById('functionStatus');
    const operationStatus = document.getElementById('operationStatus');
    
    if (calculateBtn) {
      // Habilitar si hay función y operación
      const hasFunction = !!this.currentFunction;
      const hasOperation = !!this.currentOperation;
      const isEnabled = hasFunction && hasOperation;
      
      calculateBtn.disabled = !isEnabled;
      
      // Actualizar estado visual del botón
      if (isEnabled) {
        calculateBtn.classList.remove('from-gray-400', 'to-gray-500');
        calculateBtn.classList.add('from-green-600', 'to-green-700');
      } else {
        calculateBtn.classList.remove('from-green-600', 'to-green-700');
        calculateBtn.classList.add('from-gray-400', 'to-gray-500');
      }
      
      // Actualizar indicadores de estado
      if (functionStatus) {
        const icon = functionStatus.querySelector('i');
        if (hasFunction) {
          icon.className = 'w-4 h-4 mr-1 text-green-500';
          functionStatus.classList.remove('text-gray-500');
          functionStatus.classList.add('text-green-600');
        } else {
          icon.className = 'w-4 h-4 mr-1 text-gray-400';
          functionStatus.classList.remove('text-green-600');
          functionStatus.classList.add('text-gray-500');
        }
      }
      
      if (operationStatus) {
        const icon = operationStatus.querySelector('i');
        if (hasOperation) {
          icon.className = 'w-4 h-4 mr-1 text-green-500';
          operationStatus.classList.remove('text-gray-500');
          operationStatus.classList.add('text-green-600');
        } else {
          icon.className = 'w-4 h-4 mr-1 text-gray-400';
          operationStatus.classList.remove('text-green-600');
          operationStatus.classList.add('text-gray-500');
        }
      }
    }
  }

  selectOperation(operation) {
    this.currentOperation = operation;
    
    // Actualizar estilos de botones
    document.querySelectorAll('.btn-operation').forEach(btn => {
      btn.classList.remove(...this.ACTIVE);
      btn.classList.add(...this.INACTIVE);
    });
    
    const selectedBtn = document.querySelector(`[data-operation="${operation}"]`);
    selectedBtn.classList.add(...this.ACTIVE);
    selectedBtn.classList.remove(...this.INACTIVE);

    // Mostrar parámetros específicos
    this.showParameters(operation);
    
    // Actualizar estado del botón calcular
    this.updateCalculateButton();
  }

  showParameters(operation) {
    const section = document.getElementById('parameterSection');
    const evaluateParams = document.getElementById('evaluateParams');
    
    // Ocultar todos los parámetros
    evaluateParams.classList.add('hidden');
    
    // Mostrar parámetros según la operación
    if (operation === 'evaluate') {
      evaluateParams.classList.remove('hidden');
    }
    
    section.classList.remove('hidden');
  }

  async calculate() {
    if (!this.currentFunction || !this.currentOperation) {
      this.showError('Por favor selecciona una función y una operación');
      return;
    }

    try {
      // Mostrar loading con progreso
      const calculateBtn = document.getElementById('calculateBtn');
      const originalText = calculateBtn.innerHTML;
      calculateBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 inline-block mr-2 animate-spin"></i>Resolviendo...';
      calculateBtn.disabled = true;
      
      // Mostrar notificación de progreso
      this.showProgress('Iniciando cálculo...');

      // Preparar datos para el backend
      const requestData = {
        function: this.currentFunction,
        operation: this.currentOperation
      };

      // Añadir parámetros específicos
      if (this.currentOperation === 'evaluate') {
        const value = document.getElementById('evaluateValue').value;
        if (!value) {
          throw new Error('Por favor ingresa un valor para evaluar');
        }
        requestData.value = parseFloat(value);
      }

      // Llamar al backend
      this.showProgress('Enviando solicitud al servidor...');
      const response = await fetch(`${this.backendUrl}/function/${this.currentOperation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      this.showProgress('Procesando respuesta...');

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      
      this.showProgress('Mostrando resultados...');
      
      // Mostrar resultados
      this.displayResults(result);
      
      // Verificación numérica con MathJS (si es posible)
      this.verifyWithMathJS(result);
      
      // Ocultar progreso
      this.hideProgress();

    } catch (error) {
      this.showError(`Error al calcular: ${error.message}`);
      this.hideProgress();
     } finally {
       // Restaurar botón
       const calculateBtn = document.getElementById('calculateBtn');
       calculateBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 inline-block mr-2"></i>Resolver';
       this.updateCalculateButton();
     }
  }

  displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const resultDisplay = document.getElementById('resultDisplay');
    const stepsStream = document.getElementById('stepsStream');
    
    // Mostrar resultado principal
    resultDisplay.innerHTML = `
      <div class="text-lg">
        <strong>f(x) = ${this.currentFunction}</strong><br>
        <strong>${this.getOperationName(this.currentOperation)}:</strong> 
        <span class="font-mono text-blue-600">${result.result}</span>
      </div>
    `;

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
    document.getElementById('explanationSection').classList.remove('hidden');
    
    resultsSection.classList.remove('hidden');
    
    // Renderizar MathJax si está disponible
    this.typeset(resultsSection);
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

  async verifyWithMathJS(result) {
    try {
      if (this.currentOperation === 'evaluate') {
        const value = parseFloat(document.getElementById('evaluateValue').value);
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

  addStepCard(container, { title, desc, tone = 'blue' }) {
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
      p.className = 'text-slate-800 leading-relaxed mb-2 font-mono text-sm';
      p.textContent = desc;
      card.appendChild(p);
    }
    container.appendChild(card);
  }

  async generateExplanation() {
    try {
      const btn = document.getElementById('generateExplanationBtn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 inline-block mr-1 animate-spin"></i>Generando...';
      btn.disabled = true;

      const explanation = await this.callLLM();
      
      const explanationDiv = document.getElementById('llmExplanation');
      explanationDiv.innerHTML = `<p class="text-gray-700">${explanation}</p>`;
      
    } catch (error) {
      this.showError(`Error generando explicación: ${error.message}`);
    } finally {
      const btn = document.getElementById('generateExplanationBtn');
      btn.innerHTML = '<i data-lucide="brain" class="w-4 h-4 inline-block mr-1"></i>Generar explicación';
      btn.disabled = false;
    }
  }

  async callLLM() {
    // Implementación básica - en producción usar Ollama/LocalAI
    const steps = this.steps.join('\n');
    const prompt = `
    Explica de forma natural y didáctica el siguiente cálculo matemático:
    
    Función: f(x) = ${this.currentFunction}
    Operación: ${this.getOperationName(this.currentOperation)}
    Pasos: ${steps}
    
    Proporciona una explicación clara y educativa.
    `;

    // Por ahora retornamos una explicación estática
    // En producción, esto se conectaría con Ollama/LocalAI
    return `Esta es una explicación generada por el LLM local. 
    La función ${this.currentFunction} fue procesada usando ${this.getOperationName(this.currentOperation)}.
    Los pasos mostrados arriba detallan el procedimiento matemático utilizado.`;
  }

  typeset(el) {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([el]).catch(() => {});
    }
  }

  showProgress(message) {
    // Crear o actualizar mensaje de progreso
    let progressDiv = document.getElementById('progressMessage');
    if (!progressDiv) {
      progressDiv = document.createElement('div');
      progressDiv.id = 'progressMessage';
      progressDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50';
      document.body.appendChild(progressDiv);
    }
    
    progressDiv.innerHTML = `
      <div class="flex items-center">
        <i data-lucide="loader-2" class="w-5 h-5 mr-2 animate-spin"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Renderizar iconos
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
    // Crear o actualizar mensaje de error
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'errorMessage';
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
      document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i data-lucide="alert-circle" class="w-5 h-5 mr-2"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>
    `;
    
    // Renderizar iconos
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }
}

// Exportar para uso global
window.FunctionsCalculator = FunctionsCalculator;

