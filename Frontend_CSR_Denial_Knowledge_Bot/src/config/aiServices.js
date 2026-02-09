// AI Services Configuration
// Add these environment variables to enable advanced AI features

const AI_SERVICES_CONFIG = {
  // OpenAI Configuration (Free tier: $5 credit)
  OPENAI: {
    API_KEY: process.env.REACT_APP_OPENAI_API_KEY || '',
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 1000,
    BASE_URL: 'https://api.openai.com/v1',
    FREE_TIER_LIMITS: {
      requests_per_minute: 3,
      tokens_per_month: 5000
    }
  },

  // Google Gemini Configuration (Completely Free)
  GEMINI: {
    API_KEY: process.env.REACT_APP_GEMINI_API_KEY || '',
    MODEL: 'gemini-pro',
    MAX_TOKENS: 1000,
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    FREE_TIER_LIMITS: {
      requests_per_minute: 60,
      tokens_per_minute: 32000
    }
  },

  // Groq Configuration (Free tier: Very Fast)
  GROQ: {
    API_KEY: process.env.REACT_APP_GROQ_API_KEY || '',
    MODEL: 'llama2-70b-4096',
    MAX_TOKENS: 1000,
    BASE_URL: 'https://api.groq.com/openai/v1',
    FREE_TIER_LIMITS: {
      requests_per_minute: 30,
      tokens_per_minute: 14000
    }
  },

  // Anthropic Claude Configuration (Free tier)
  ANTHROPIC: {
    API_KEY: process.env.REACT_APP_ANTHROPIC_API_KEY || '',
    MODEL: 'claude-3-haiku-20240307',
    MAX_TOKENS: 1000,
    BASE_URL: 'https://api.anthropic.com/v1',
    FREE_TIER_LIMITS: {
      requests_per_minute: 5,
      tokens_per_minute: 40000
    }
  },

  // Hugging Face Configuration (Free tier)
  HUGGINGFACE: {
    API_KEY: process.env.REACT_APP_HUGGINGFACE_API_KEY || '',
    MODEL: 'microsoft/DialoGPT-medium',
    MAX_TOKENS: 1000,
    BASE_URL: 'https://api-inference.huggingface.co/models',
    FREE_TIER_LIMITS: {
      requests_per_minute: 30,
      tokens_per_minute: 16000
    }
  }
};

// Service priority for fallback
const SERVICE_PRIORITY = ['openai', 'gemini', 'groq', 'anthropic', 'huggingface'];

// Get enabled services
const getEnabledServices = () => {
  return SERVICE_PRIORITY.filter(service => {
    const config = AI_SERVICES_CONFIG[service.toUpperCase()];
    return config && config.API_KEY;
  });
};

// Get service display name
const getServiceDisplayName = (service) => {
  const displayNames = {
    openai: 'OpenAI GPT-3.5',
    gemini: 'Google Gemini Pro',
    groq: 'Groq Llama2',
    anthropic: 'Anthropic Claude',
    huggingface: 'Hugging Face'
  };
  return displayNames[service] || service;
};

// Check if any AI service is configured
const isAnyAIConfigured = () => {
  return getEnabledServices().length > 0;
};

// Get service limits
const getServiceLimits = (service) => {
  const config = AI_SERVICES_CONFIG[service.toUpperCase()];
  return config?.FREE_TIER_LIMITS || null;
};

// Validate API key format
const validateAPIKey = (service, apiKey) => {
  const patterns = {
    openai: /^sk-[A-Za-z0-9]{48}$/,
    gemini: /^[A-Za-z0-9_-]{39}$/,
    groq: /^gsk_[A-Za-z0-9_-]{51}$/,
    anthropic: /^sk-ant-api03-[A-Za-z0-9_-]{95}$/,
    huggingface: /^hf_[A-Za-z0-9_-]{34}$/
  };
  
  return patterns[service] ? patterns[service].test(apiKey) : false;
};

export {
  AI_SERVICES_CONFIG,
  SERVICE_PRIORITY,
  getEnabledServices,
  getServiceDisplayName,
  isAnyAIConfigured,
  getServiceLimits,
  validateAPIKey
};
