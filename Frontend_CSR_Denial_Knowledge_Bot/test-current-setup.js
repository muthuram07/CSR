// Test the current setup
console.log('Testing current setup...');

// Test 1: Check if advanced AI is working
import advancedAI from './src/services/advancedAI.js';

console.log('=== Advanced AI Test ===');
console.log('Available services:', advancedAI.getServicesStatus());
console.log('Needs advanced AI for "What is the capital of India?":', advancedAI.needsAdvancedAI("What is the capital of India?"));

// Test 2: Check general chatbot
import generalChatbot from './src/services/generalChatbot.js';

console.log('=== General Chatbot Test ===');
const testQuery = "What is the capital of India?";
generalChatbot.getEnhancedResponse(testQuery).then(response => {
  console.log('General chatbot response:', response);
}).catch(err => {
  console.error('General chatbot error:', err);
});

console.log('Test completed. Check browser console for results.');
