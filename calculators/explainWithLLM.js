/**
 * Módulo de Explicaciones con LLM Local
 * Integración con Ollama/LocalAI para generar explicaciones naturales
 */

class LLMExplainer {
  constructor(options = {}) {
    this.llmUrl = options.llmUrl || 'http://localhost:11434'; // URL por defecto de Ollama
    this.model = options.model || 'mistral:7b'; // Modelo por defecto
    this.enabled = options.enabled !== false; // Habilitado por defecto
    this.fallbackEnabled = options.fallbackEnabled !== false; // Fallback habilitado por defecto
    
    // Cache simple para explicaciones
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Verifica si el servicio LLM está disponible
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.llmUrl}/api/tags`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        const hasModel = data.models?.some(m => m.name.includes(this.model.split(':')[0]));
        
        return {
          available: true,
          hasModel: hasModel,
          models: data.models || []
        };
      }
      
      return { available: false, error: 'Servicio no disponible' };
    } catch (error) {
      return { 
        available: false, 
        error: error.message,
        suggestion: 'Asegúrate de que Ollama esté ejecutándose en localhost:11434'
      };
    }
  }

  /**
   * Genera una explicación natural para un cálculo matemático
   */
  async generateExplanation(calculationData) {
    const cacheKey = this.getCacheKey(calculationData);
    
    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.explanation;
      }
      this.cache.delete(cacheKey);
    }

    try {
      // Verificar disponibilidad del LLM
      const availability = await this.checkAvailability();
      
      if (!availability.available) {
        return this.getFallbackExplanation(calculationData);
      }

      // Generar prompt
      const prompt = this.buildPrompt(calculationData);
      
      // Llamar al LLM
      const explanation = await this.callLLM(prompt);
      
      // Guardar en cache
      this.cache.set(cacheKey, {
        explanation: explanation,
        timestamp: Date.now()
      });
      
      return explanation;
      
    } catch (error) {
      console.warn('Error generando explicación con LLM:', error);
      
      if (this.fallbackEnabled) {
        return this.getFallbackExplanation(calculationData);
      }
      
      throw error;
    }
  }

  /**
   * Construye el prompt para el LLM
   */
  buildPrompt(calculationData) {
    const { function: func, operation, result, steps } = calculationData;
    
    const operationNames = {
      'evaluate': 'evaluación',
      'derive': 'derivación',
      'integrate': 'integración',
      'simplify': 'simplificación'
    };
    
    const operationName = operationNames[operation] || operation;
    
    return `Eres un tutor de matemáticas experto. Explica de forma clara y didáctica el siguiente cálculo:

FUNCIÓN: f(x) = ${func}
OPERACIÓN: ${operationName}
RESULTADO: ${result}

PASOS REALIZADOS:
${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Por favor proporciona una explicación:
1. Breve (máximo 3-4 oraciones)
2. En lenguaje natural y comprensible
3. Que explique qué se hizo y por qué
4. Enfocada en el aprendizaje del estudiante

Responde solo con la explicación, sin formato adicional.`;
  }

  /**
   * Llama al LLM (Ollama)
   */
  async callLLM(prompt) {
    const response = await fetch(`${this.llmUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 200
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error del LLM: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.trim() || 'No se pudo generar explicación';
  }

  /**
   * Explicación de fallback cuando el LLM no está disponible
   */
  getFallbackExplanation(calculationData) {
    const { function: func, operation, result } = calculationData;
    
    const explanations = {
      'evaluate': `Hemos evaluado la función f(x) = ${func} en el punto especificado. El resultado ${result} representa el valor que toma la función en ese punto.`,
      
      'derive': `Calculamos la derivada de f(x) = ${func}. La derivada f'(x) = ${result} nos indica la tasa de cambio instantánea de la función en cualquier punto x.`,
      
      'integrate': `Integramos la función f(x) = ${func}. El resultado ∫f(x)dx = ${result} + C representa el área bajo la curva de la función (indefinida) o la función cuya derivada es f(x).`,
      
      'simplify': `Simplificamos la expresión ${func} para obtener una forma más compacta y fácil de trabajar: ${result}. Esto facilita cálculos posteriores y análisis de la función.`
    };

    const baseExplanation = explanations[operation] || 
      `Realizamos la operación ${operation} sobre la función f(x) = ${func}, obteniendo como resultado ${result}.`;

    return baseExplanation + ' Los pasos detallados arriba muestran el procedimiento matemático utilizado.';
  }

  /**
   * Genera clave de cache
   */
  getCacheKey(calculationData) {
    const { function: func, operation, result } = calculationData;
    return `${operation}:${func}:${result}`.replace(/\s+/g, '');
  }

  /**
   * Obtiene lista de modelos disponibles
   */
  async getAvailableModels() {
    try {
      const availability = await this.checkAvailability();
      if (availability.available) {
        return availability.models.map(m => ({
          name: m.name,
          size: m.size,
          modified_at: m.modified_at
        }));
      }
      return [];
    } catch (error) {
      console.warn('Error obteniendo modelos:', error);
      return [];
    }
  }

  /**
   * Configura el modelo a usar
   */
  setModel(modelName) {
    this.model = modelName;
    // Limpiar cache al cambiar modelo
    this.cache.clear();
  }

  /**
   * Configura la URL del servicio LLM
   */
  setLLMUrl(url) {
    this.llmUrl = url;
    // Limpiar cache al cambiar URL
    this.cache.clear();
  }

  /**
   * Limpia el cache de explicaciones
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => now - entry.timestamp < this.cacheTimeout);
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length
    };
  }
}

// Instancia global
window.llmExplainer = new LLMExplainer();

// Función de conveniencia para usar desde otros módulos
window.generateExplanation = async function(calculationData) {
  return await window.llmExplainer.generateExplanation(calculationData);
};

// Exportar la clase
window.LLMExplainer = LLMExplainer;

