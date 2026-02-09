// Advanced AI Integration Service
// Integrates multiple powerful free AI services for enhanced capabilities

class AdvancedAIIntegration {
  constructor() {
    this.services = {
      // OpenAI (Free tier - $5 credit)
      openai: {
        apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
        enabled: !!process.env.REACT_APP_OPENAI_API_KEY
      },
      
      // Google Gemini (Free)
      gemini: {
        apiKey: 'AIzaSyBeZA8f1VtloLTBtUeyzfsJR0y0voh0Ooc', // Hardcoded for testing - remove this line later
        model: 'gemini-2.5-flash',
        maxTokens: 2048,
        enabled: true // Force enabled for testing
      },
      
      // Hugging Face (Free)
      huggingface: {
        apiKey: process.env.REACT_APP_HUGGINGFACE_API_KEY || '',
        model: 'microsoft/DialoGPT-medium',
        enabled: !!process.env.REACT_APP_HUGGINGFACE_API_KEY
      },
      
      // Groq (Free tier - very fast)
      groq: {
        apiKey: process.env.REACT_APP_GROQ_API_KEY || '',
        model: 'llama2-70b-4096',
        maxTokens: 1000,
        enabled: !!process.env.REACT_APP_GROQ_API_KEY
      },
      
      // Anthropic Claude (Free tier)
      anthropic: {
        apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY || '',
        model: 'claude-3-haiku-20240307',
        maxTokens: 1000,
        enabled: !!process.env.REACT_APP_ANTHROPIC_API_KEY
      }
    };
    
    this.fallbackChain = ['openai', 'gemini', 'groq', 'anthropic', 'huggingface'];
    this.currentServiceIndex = 0;
  }

  // Gemini-only: bypass fallback chain and force Gemini
  async processGeminiOnly(query, context = '') {
    if (!this.services.gemini?.enabled) {
      return {
        type: 'ai_failed',
        response: 'Google Gemini is not configured or is disabled.',
        error: 'Gemini disabled'
      };
    }

    const result = await this.callGemini(query, context);
    if (result.success) {
      return {
        type: 'ai_response',
        response: result.response,
        provider: result.provider,
        confidence: 0.9,
        suggestions: this.generateSuggestions(query, result.response)
      };
    }

    return {
      type: 'ai_failed',
      response: result.error || 'Gemini failed to respond. Please try again.',
      error: result.error,
      suggestions: [
        'Try again in a moment',
        'Shorten the question',
        'Check your internet connection'
      ]
    };
  }

  // Detect if query needs advanced AI
  needsAdvancedAI(query) {
    const advancedPatterns = [
      /explain|analyze|compare|recommend|suggest/i,
      /what if|how to|why does|when should/i,
      /complex|complicated|detailed|in-depth/i,
      /strategy|approach|method|technique/i,
      /medical|clinical|treatment|diagnosis/i,
      /billing|coding|reimbursement|claim/i,
      /policy|coverage|benefit|eligibility/i,
      // General knowledge patterns
      /what is|who is|where is|when was|how many/i,
      /capital|country|city|state|president/i,
      /history|geography|science|technology/i,
      /definition|meaning|example|information/i,
      // Question words
      /\b(what|who|where|when|why|how)\b/i
    ];
    
    return advancedPatterns.some(pattern => pattern.test(query));
  }

  // Try next available AI service
  getNextAvailableService() {
    const attempts = this.fallbackChain.length;
    
    for (let i = 0; i < attempts; i++) {
      const serviceIndex = (this.currentServiceIndex + i) % attempts;
      const serviceName = this.fallbackChain[serviceIndex];
      
      if (this.services[serviceName].enabled) {
        this.currentServiceIndex = serviceIndex;
        return serviceName;
      }
    }
    
    return null; // No services available
  }

  // OpenAI Integration
  async callOpenAI(prompt, context = '') {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.services.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.services.openai.model,
          messages: [
            {
              role: 'system',
              content: `You are a helpful CSR (Customer Service Representative) assistant specializing in healthcare insurance, denial codes, and medical billing. ${context}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.services.openai.maxTokens,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return {
        success: true,
        provider: 'OpenAI',
        response: data.choices[0]?.message?.content || 'No response received',
        usage: data.usage
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return { success: false, error: error.message, provider: 'OpenAI' };
    }
  }

  // Google Gemini Integration
  async callGemini(prompt, context = '') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.services.gemini.model}:generateContent?key=${this.services.gemini.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant. ${context}

Answer the user's question thoroughly and completely.
- Use clear headings when helpful.
- Prefer 2-4 short paragraphs.
- If the user asks for an explanation, include an analogy and a simple example.

User question: ${prompt}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: this.services.gemini.maxTokens,
            temperature: 0.7,
            topP: 0.95
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error?.message || `Gemini request failed with status ${response.status}`;
        return { success: false, error: message, provider: 'Google Gemini' };
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || typeof text !== 'string') {
        return { success: false, error: 'Gemini returned an empty response', provider: 'Google Gemini' };
      }

      return {
        success: true,
        provider: 'Google Gemini',
        response: text
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return { success: false, error: error.message, provider: 'Google Gemini' };
    }
  }

  // Groq Integration (Very Fast)
  async callGroq(prompt, context = '') {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.services.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.services.groq.model,
          messages: [
            {
              role: 'system',
              content: `You are a helpful CSR assistant specializing in healthcare insurance, denial codes, and medical billing. ${context}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.services.groq.maxTokens,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return {
        success: true,
        provider: 'Groq',
        response: data.choices[0]?.message?.content || 'No response received',
        usage: data.usage
      };
    } catch (error) {
      console.error('Groq API Error:', error);
      return { success: false, error: error.message, provider: 'Groq' };
    }
  }

  // Anthropic Claude Integration
  async callAnthropic(prompt, context = '') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.services.anthropic.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.services.anthropic.model,
          max_tokens: this.services.anthropic.maxTokens,
          messages: [
            {
              role: 'user',
              content: `You are a helpful CSR assistant specializing in healthcare insurance and denial codes. ${context}\n\n${prompt}`
            }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      return {
        success: true,
        provider: 'Anthropic Claude',
        response: data.content[0]?.text || 'No response received',
        usage: data.usage
      };
    } catch (error) {
      console.error('Anthropic API Error:', error);
      return { success: false, error: error.message, provider: 'Anthropic Claude' };
    }
  }

  // Hugging Face Integration
  async callHuggingFace(prompt, context = '') {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${this.services.huggingface.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.services.huggingface.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `You are a helpful CSR assistant specializing in healthcare insurance and denial codes. ${context}\n\nUser: ${prompt}`,
          parameters: {
            max_new_tokens: this.services.huggingface.maxTokens,
            temperature: 0.7,
            return_full_text: false
          }
        })
      });

      const data = await response.json();
      return {
        success: true,
        provider: 'Hugging Face',
        response: data[0]?.generated_text || 'No response received'
      };
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      return { success: false, error: error.message, provider: 'Hugging Face' };
    }
  }

  // Main method to process advanced queries
  async processAdvancedQuery(query, context = '') {
    console.log('processAdvancedQuery called with:', query);
    console.log('Available services:', Object.entries(this.services).filter(([_, service]) => service.enabled));
    
    // Check if any AI service is available
    const hasAnyService = Object.values(this.services).some(service => service.enabled);
    
    console.log('Has any service:', hasAnyService);
    
    if (!hasAnyService) {
      console.log('No AI services available');
      return {
        type: 'no_ai_available',
        response: 'Advanced AI features are not configured. Please add API keys to enable powerful AI capabilities.',
        suggestions: [
          'Get free API keys from OpenAI, Google Gemini, or Groq',
          'Add keys to environment variables',
          'Restart the application'
        ]
      };
    }

    // Try each available service in order
    const maxAttempts = this.fallbackChain.length;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const serviceName = this.getNextAvailableService();
      
      if (!serviceName) {
        break; // No more services to try
      }

      console.log(`Trying AI service: ${serviceName} (attempt ${attempt + 1})`);
      
      let result;
      switch (serviceName) {
        case 'openai':
          result = await this.callOpenAI(query, context);
          break;
        case 'gemini':
          result = await this.callGemini(query, context);
          break;
        case 'groq':
          result = await this.callGroq(query, context);
          break;
        case 'anthropic':
          result = await this.callAnthropic(query, context);
          break;
        case 'huggingface':
          result = await this.callHuggingFace(query, context);
          break;
      }

      if (result.success) {
        return {
          type: 'ai_response',
          response: result.response,
          provider: result.provider,
          usage: result.usage,
          confidence: 0.9,
          suggestions: this.generateSuggestions(query, result.response)
        };
      } else {
        console.warn(`${serviceName} failed:`, result.error);
        // Try next service
        this.currentServiceIndex = (this.currentServiceIndex + 1) % maxAttempts;
      }
    }

    // All services failed
    return {
      type: 'ai_failed',
      response: 'I apologize, but all AI services are currently unavailable. Please try again later or contact support.',
      error: 'All AI services failed',
      suggestions: [
        'Check your internet connection',
        'Verify API keys are valid',
        'Try again in a few minutes'
      ]
    };
  }

  // Generate contextual suggestions based on query and response
  generateSuggestions(query, response) {
    const suggestions = [];
    
    // If query is about denial codes
    if (/denial|code|reject/i.test(query)) {
      suggestions.push('Ask about specific denial code examples');
      suggestions.push('Learn about appeal processes');
    }
    
    // If query is about coverage
    if (/coverage|benefit|plan/i.test(query)) {
      suggestions.push('Check specific service coverage');
      suggestions.push('Ask about copay and deductibles');
    }
    
    // If query is complex
    if (/complex|complicated|detailed/i.test(query)) {
      suggestions.push('Request step-by-step guidance');
      suggestions.push('Ask for examples');
    }
    
    return suggestions;
  }

  // Get available AI services status
  getServicesStatus() {
    return {
      available: Object.entries(this.services)
        .filter(([_, service]) => service.enabled)
        .map(([name, service]) => ({
          name: this.getServiceDisplayName(name),
          model: service.model,
          status: 'available'
        })),
      configured: Object.values(this.services).some(service => service.enabled),
      total: Object.keys(this.services).length
    };
  }

  getServiceDisplayName(serviceName) {
    const displayNames = {
      openai: 'OpenAI GPT-3.5',
      gemini: 'Google Gemini Pro',
      groq: 'Groq Llama2',
      anthropic: 'Anthropic Claude',
      huggingface: 'Hugging Face'
    };
    return displayNames[serviceName] || serviceName;
  }

  // Test all configured services
  async testServices() {
    const testQuery = "Hello, can you help with healthcare insurance questions?";
    const results = {};
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      if (!service.enabled) {
        results[serviceName] = { status: 'not_configured' };
        continue;
      }
      
      try {
        const result = await this.processAdvancedQuery(testQuery);
        results[serviceName] = {
          status: result.success ? 'working' : 'failed',
          provider: result.provider,
          error: result.error
        };
      } catch (error) {
        results[serviceName] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    return results;
  }
}

// Export singleton instance
const advancedAI = new AdvancedAIIntegration();
export default advancedAI;
