// Test script to verify API keys are loaded
console.log('Environment Variables Check:');
console.log('REACT_APP_GEMINI_API_KEY:', process.env.REACT_APP_GEMINI_API_KEY ? 'SET' : 'NOT SET');
console.log('REACT_APP_GROQ_API_KEY:', process.env.REACT_APP_GROQ_API_KEY ? 'SET' : 'NOT SET');
console.log('REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY ? 'SET' : 'NOT SET');

// Test advanced AI service
import advancedAI from './src/services/advancedAI.js';

console.log('Testing advanced AI service...');
console.log('Available services:', advancedAI.getServicesStatus());

// Test query detection
const testQueries = [
  'What is the capital of India?',
  'What does CO-45 mean?',
  'Explain quantum computing'
];

testQueries.forEach(query => {
  console.log(`Query: "${query}" -> needsAdvancedAI: ${advancedAI.needsAdvancedAI(query)}`);
});
