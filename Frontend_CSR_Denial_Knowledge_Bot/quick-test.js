// Quick fix - bypass complex detection and directly test Gemini
const GEMINI_API_KEY = 'AIzaSyBeZA8f1VtloLTBtUeyzfsJR0y0voh0Ooc';

async function quickGeminiTest(query) {
  console.log('Quick Gemini test for:', query);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful assistant. Answer this question concisely: ${query}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    console.log('Gemini response:', data);
    
    if (data.candidates && data.candidates[0]) {
      const answer = data.candidates[0].content.parts[0].text;
      console.log('✅ Gemini Success:', answer);
      return `🤖 **Google Gemini Response:**\n\n${answer}`;
    } else {
      console.log('❌ Gemini Error:', data);
      return 'Sorry, I had trouble getting an answer. Please try again.';
    }
  } catch (error) {
    console.error('❌ Gemini Error:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

// Test with the exact question
quickGeminiTest("What is the capital of India?").then(result => {
  console.log('Final result:', result);
});
