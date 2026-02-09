// Test Gemini API Integration
const GEMINI_API_KEY = 'AIzaSyBeZA8f1VtloLTBtUeyzfsJR0y0voh0Ooc';

async function testGemini() {
  console.log('Testing Gemini API...');
  
  const testQuery = "What is the capital of India?";
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful assistant. Answer this question: ${testQuery}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    console.log('Gemini Response:', data);
    
    if (data.candidates && data.candidates[0]) {
      const answer = data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini Success:', answer);
      return answer;
    } else {
      console.log('❌ Gemini Error:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    return null;
  }
}

// Run the test
testGemini();
