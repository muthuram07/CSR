// Simple working fix - replace the problematic handleInputSubmit function
// Add this to your ChatBot.js to replace the current handleInputSubmit function

const handleInputSubmit = async (e) => {
  e.preventDefault();
  
  if (currentInput.trim()) {
    const userQuery = currentInput.trim();
    addUserMessage(userQuery);
    setCurrentInput('');
    setRetryCount(0);
    setConnectionStatus('processing');

    setIsTyping(true);
    
    try {
      // First try the main CSR system
      await processQuery(userQuery);
    } catch (error) {
      console.log('Main system failed, trying fallbacks...');
      
      // SIMPLIFIED LOGIC: Direct check for general knowledge questions
      const isGeneralKnowledge = /what is|who is|where is|when was|capital of|define|explain/i.test(userQuery);
      
      console.log('Is general knowledge:', isGeneralKnowledge);
      console.log('Available AI services:', advancedAI.getServicesStatus());
      
      if (isGeneralKnowledge) {
        console.log('Using advanced AI for general knowledge question:', userQuery);
        try {
          const aiResponse = await advancedAI.processAdvancedQuery(userQuery, 'General knowledge question');
          console.log('AI Response received:', aiResponse);
          
          if (aiResponse.type === 'ai_response') {
            addBotMessage(`🤖 **${aiResponse.provider} Response:**\n\n${aiResponse.response}`, 'text', {
              quickReplies: aiResponse.suggestions,
              provider: aiResponse.provider
            });
          } else if (aiResponse.type === 'ai_failed') {
            addBotMessage({
              type: 'error',
              data: { 
                message: aiResponse.response,
                isRetryable: true,
                provider: 'Advanced AI'
              }
            });
          } else {
            addBotMessage(aiResponse.response, 'text', {
              quickReplies: aiResponse.suggestions
            });
          }
          
          setConnectionStatus('connected');
          return;
        } catch (aiError) {
          console.error('Advanced AI failed:', aiError);
        }
      }
      
      // Fallback to general chatbot
      console.log('Falling back to general chatbot for:', userQuery);
      try {
        const generalResponse = await generalChatbot.getEnhancedResponse(userQuery);
        console.log('General response:', generalResponse);
        
        if (generalResponse.type === 'general_response' || generalResponse.type === 'help_response') {
          addBotMessage(generalResponse.response, 'text', {
            quickReplies: generalResponse.suggestions
          });
        } else if (generalResponse.type === 'out_of_scope') {
          addBotMessage({
            type: 'out_of_scope',
            data: { message: generalResponse.response }
          });
        } else {
          addBotMessage(generalResponse.response, 'text', {
            quickReplies: generalResponse.suggestions
          });
        }
        
        setConnectionStatus('connected');
      } catch (fallbackError) {
        console.error('General chatbot fallback failed:', fallbackError);
        addErrorMessage("I'm having trouble processing your request. Please try again later.", true);
        setConnectionStatus('error');
      }
    } finally {
      setIsTyping(false);
    }
  }
};

console.log('Copy this handleInputSubmit function and replace the existing one in ChatBot.js');
