// Quick test to check if AI service is working
console.log('=== AI Service Test ===');
console.log('Testing Gemini API directly...');

const GEMINI_API_KEY = 'AIzaSyBeZA8f1VtloLTBtUeyzfsJR0y0voh0Ooc';
const testQuery = "What is the capital of India?";

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: `Answer this question concisely: ${testQuery}`
      }]
    }],
    generationConfig: {
      maxOutputTokens: 100,
      temperature: 0.7
    }
  })
})
.then(response => response.json())
.then(data => {
  console.log('Gemini API Response:', data);
  if (data.candidates && data.candidates[0]) {
    const answer = data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini Working:', answer);
  } else {
    console.log('❌ Gemini Error:', data);
  }
})
.catch(error => {
  console.log('❌ Gemini Network Error:', error);
});
