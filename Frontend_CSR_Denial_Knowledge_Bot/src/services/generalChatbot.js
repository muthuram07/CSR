// Lightweight General Knowledge Chatbot Service
// Integrates with open-source NLP capabilities for general questions

class GeneralChatbot {
  constructor() {
    this.initialized = false;
    this.fallbackResponses = [
      "I can help with denial codes, plan coverage, and member information. For general questions like 'What is the capital of India?', I'll try my best to help!",
      "While I specialize in healthcare insurance topics, I can attempt to answer general knowledge questions. Please ask me about denial codes or coverage for more detailed help.",
      "My main focus is denial codes and insurance coverage, but I'll try to assist with your question. For CSR-specific help, just ask!",
      "I'm designed primarily for healthcare and insurance questions. For general knowledge, I'll provide basic assistance. Try asking about denial codes for detailed help!"
    ];
    
    // Simple pattern-based responses for common general questions
    this.generalPatterns = {
      greeting: [
        /hello|hi|hey|good morning|good afternoon|good evening/i,
        /how are you|how do you do/i
      ],
      help: [
        /help|what can you do|capabilities|features/i,
        /how to use|how do i/i
      ],
      weather: [
        /weather|temperature|rain|sunny|cloudy/i
      ],
      time: [
        /what time|current time|time now/i
      ],
      general: [
        /what is|define|explain|tell me about/i,
        /capital of|what is the capital/i
      ]
    };
    
    this.responses = {
      greeting: [
        "Hello! I'm your CSR Knowledge Bot. I can help you with denial codes, plan coverage, and member information. What would you like to know?",
        "Hi there! I'm here to help with insurance-related questions. How can I assist you today?",
        "Greetings! I specialize in denial codes and coverage questions. What can I help you with?"
      ],
      help: [
        "I can help you with: 🔍 Denial Codes - Get explanations and resolution steps 📋 Plan Coverage - Check member benefits 👤 Member Information - Find member details Just ask your question naturally!",
        "My capabilities include: • Denial code explanations • Plan coverage queries • Member lookups • General guidance What would you like to explore?"
      ],
      weather: [
        "I don't have access to current weather information, but I can help you with insurance questions! Is there a denial code or coverage question I can assist with?"
      ],
      time: [
        "I don't have access to current time information, but I'm here 24/7 to help with denial codes and coverage questions!"
      ],
      general: [
        "That's an interesting question! While I specialize in denial codes and insurance coverage, I'll try to help. Could you provide more context?",
        "I'm primarily designed for CSR-related questions. For general knowledge, I have limited information. Can I help you with a denial code or coverage query instead?",
        "My main expertise is in denial codes and plan coverage. For general knowledge, I'll provide what assistance I can.",
        "For capital cities and countries, I can try to help! The capital of India is New Delhi. For more accurate geographic information, you might want to use a dedicated geography service."
      ]
    };
  }

  // Initialize the chatbot (could connect to external services)
  async initialize() {
    if (this.initialized) return;
    
    // In a real implementation, you might connect to:
    // - Rasa Open Source
    // - Botpress
    // - Microsoft Bot Framework
    // - Custom NLP service
    
    this.initialized = true;
    console.log('General Chatbot initialized');
  }

  // Process general questions
  async processGeneralQuery(query) {
    await this.initialize();
    
    const lowerQuery = query.toLowerCase();
    
    // Check for greeting patterns
    if (this.matchesPattern(lowerQuery, this.generalPatterns.greeting)) {
      return {
        type: 'general_response',
        response: this.getRandomResponse('greeting'),
        confidence: 0.9,
        suggestions: ['What does denial code CO-45 mean?', 'Is dental covered for member M12345?', 'Help']
      };
    }
    
    // Check for help patterns
    if (this.matchesPattern(lowerQuery, this.generalPatterns.help)) {
      return {
        type: 'help_response',
        response: this.getRandomResponse('help'),
        confidence: 0.95,
        suggestions: ['Denial Code Resolution', 'Plan Coverage Query', 'Member Lookup']
      };
    }
    
    // Check for weather/time patterns
    if (this.matchesPattern(lowerQuery, this.generalPatterns.weather)) {
      return {
        type: 'out_of_scope',
        response: this.getRandomResponse('weather'),
        confidence: 0.8,
        suggestions: ['What does denial code CO-45 mean?', 'Check plan coverage']
      };
    }
    
    if (this.matchesPattern(lowerQuery, this.generalPatterns.time)) {
      return {
        type: 'out_of_scope',
        response: this.getRandomResponse('time'),
        confidence: 0.8,
        suggestions: ['Ask about denial codes', 'Check member coverage']
      };
    }
    
    // General knowledge questions
    if (this.matchesPattern(lowerQuery, this.generalPatterns.general)) {
      return {
        type: 'general_response',
        response: this.getRandomResponse('general'),
        confidence: 0.6,
        suggestions: ['Focus on denial codes', 'Check plan coverage', 'Member information']
      };
    }
    
    // Default fallback
    return {
      type: 'out_of_scope',
      response: this.getRandomFallback(),
      confidence: 0.3,
      suggestions: ['Denial Code Resolution', 'Plan Coverage Query', 'Help']
    };
  }

  // Check if query matches any pattern in the array
  matchesPattern(query, patterns) {
    return patterns.some(pattern => pattern.test(query));
  }

  // Get random response from category
  getRandomResponse(category) {
    const responses = this.responses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Get random fallback response
  getRandomFallback() {
    return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
  }

  // Enhanced response with suggestions - ALWAYS return simple string responses
  async getEnhancedResponse(query) {
    const response = await this.processGeneralQuery(query);
    
    // Always return a simple object with string response to avoid JSON display issues
    return {
      type: 'general_response', // Normalize all types to general_response
      response: typeof response.response === 'string' ? response.response : 'I can help with denial codes and coverage questions. Please ask about those topics.',
      confidence: response.confidence || 0.5,
      suggestions: response.suggestions || []
    };
  }
}

// Export as singleton
const generalChatbot = new GeneralChatbot();
export default generalChatbot;
