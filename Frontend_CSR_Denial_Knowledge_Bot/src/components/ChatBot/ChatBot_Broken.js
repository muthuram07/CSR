import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import generalChatbot from '../../services/generalChatbot';
import advancedAI from '../../services/advancedAI';
import './ChatBot.css';

function ChatBot() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const initializedRef = useRef(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = useCallback((text, type = 'text', options = null) => {
    // Clean response inline to avoid dependency issues
    const cleanText = typeof text === 'string' ? text.replace(/\*\*/g, '').replace(/\*/g, '') : text;
    
    const message = {
      id: Date.now(),
      text: cleanText,
      sender: 'bot',
      timestamp: new Date(),
      type,
      options
    };
    setMessages(prev => [...prev, message]);
    setLastError(null); // Clear any previous errors
  }, []);

  const addErrorMessage = useCallback((errorText, isRetryable = false) => {
    const errorMessage = {
      id: Date.now(),
      text: {
        type: 'error',
        message: errorText,
        isRetryable,
        timestamp: new Date().toISOString()
      },
      sender: 'bot',
      timestamp: new Date(),
      type: 'error'
    };
    setMessages(prev => [...prev, errorMessage]);
    setLastError(errorText);
  }, []);

  // Initialize chat with welcome message
  useEffect(() => {
    // Only initialize once to prevent duplicates
    if (!initializedRef.current) {
      initializedRef.current = true;
      
      // Add welcome messages as chat messages
      const welcomeMessage = {
        id: Date.now(),
        text: "👋 Hello! I'm your Smart CSR Knowledge Bot assistant. I can help you with denial codes and plan coverage queries.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      
      const examplesMessage = {
        id: Date.now() + 1,
        text: "💡 Just type your question!\n\nFor example:\n\n🔹 \"What does denial code CO-45 mean?\"\n🔹 \"Is dental covered for member M12345?\"\n🔹 \"Why was my claim rejected with code 96?\"",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages([welcomeMessage, examplesMessage]);
    }
  }, []);
  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addUserMessage = (text) => {
    const message = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const simulateTyping = (callback, delay = 1500) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const handleQuickReply = (reply) => {
    addUserMessage(reply);
    
    simulateTyping(() => {
      if (reply === 'Denial Code Resolution') {
        addBotMessage("Perfect! I can help you with denial codes. Just tell me naturally, like:\n\n🔹 \"What does denial code D001 mean?\"\n🔹 \"Why was claim rejected with code 96?\"\n🔹 \"Explain error code 204\"\n\nWhat denial code would you like to know about?");
      } else if (reply === 'Plan Coverage Query') {
        addBotMessage("Great! I can help with plan coverage. Just ask naturally, like:\n\n🔹 \"Is dental covered for member M12345?\"\n🔹 \"What benefits does John Doe have?\"\n🔹 \"Does plan PPO123 include vision?\"\n\nWhat would you like to know about coverage?");
      } else if (reply === 'Help') {
        addBotMessage("I'm your intelligent CSR assistant! I can understand natural language questions about:\n\n🔍 **Denial Codes**: Ask about any denial code and get step-by-step resolution\n📋 **Plan Coverage**: Check member benefits and coverage details\n🔎 **Member Lookup**: Find member information\n🤖 **Advanced AI**: Complex questions using multiple AI services (OpenAI, Gemini, Claude, etc.)\n\nJust type your question naturally - no forms needed! What would you like to know?");
      }
    });
  };

  // Helper: Normalize API responses to our structured UI types so styling applies consistently
  const normalizeResponse = (rawResult, userQuery) => {
    // 1) Extract possible payload containers
    let payload = null;
    if (rawResult) {
      payload = rawResult.response ?? rawResult.data ?? rawResult.result ?? rawResult.output ?? rawResult;
    }
    if (!payload) return null;

    // 2) If string looks like JSON, attempt to parse once safely
    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          payload = JSON.parse(trimmed);
        } catch (_) {
          // keep as string if parsing fails
        }
      }
    }

    // 3) If nested again inside a 'response' after parsing, unwrap
    if (payload && typeof payload === 'object' && payload.response) {
      payload = payload.response;
    }

    // If backend returned a plain string, try to infer a denial explanation structure
    if (typeof payload === 'string') {
      const text = payload;
      // Try to infer a plan coverage structured response from plain text FIRST
      const memberMatch = text.match(/Member\s*[:-]?\s*([^(\n]+)\s*\((M\d+)\)/i) || text.match(/Member\s*[:-]?\s*([^\n]+)/i);
      const member_name = memberMatch ? (memberMatch[1] || '').trim() : undefined;
      const member_id = (text.match(/\bM\d+\b/i)?.[0] || (memberMatch && memberMatch[2])) || undefined;
      const planIdMatch = text.match(/Plan\s*ID\b[^A-Za-z0-9]*([A-Za-z0-9_-]+)/i);
      const plan_id = planIdMatch ? planIdMatch[1] : undefined;
      const typeMatch = text.match(/\b(HMO|PPO|EPO|POS)\b/i);
      const coverage_type = typeMatch ? typeMatch[1] : undefined;
      const servicesMatch = text.match(/Covered\s*Services\s*[:-]?\s*([^\n]+)/i) || text.match(/Services\s*[:-]?\s*([^\n]+)/i);
      const covered_services = servicesMatch ? servicesMatch[1].trim() : undefined;
      const copayMatch = text.match(/Copay[^:\n]*[:-]?\s*([^\n]+)/i);
      const copay = copayMatch ? copayMatch[1].trim() : undefined;
      const periodMatch = text.match(/(?:effective|coverage)\s*periods?\s*[:-]?\s*([\d/–—'-]+)\s*to\s*([\d/–—'-]+)/i);
      const effective_date = periodMatch ? periodMatch[1].replace(/[’']/g, '-') : undefined;
      const end_date = periodMatch ? periodMatch[2].replace(/[’']/g, '-') : undefined;

      // Infer coverage answer from the user query and covered services
      let coverage_answer;
      const serviceQueryMatch = userQuery.match(/is\s+([a-z\s]+?)\s+covered/i);
      const queriedService = serviceQueryMatch ? serviceQueryMatch[1].trim().toLowerCase() : undefined;
      if (queriedService && covered_services) {
        const normalizedServices = covered_services.toLowerCase();
        coverage_answer = normalizedServices.includes(queriedService)
          ? `Yes, ${queriedService} is covered.`
          : `No, ${queriedService} is not covered.`;
      }

      const hasPlanSignals = member_name || member_id || plan_id || covered_services || copay || coverage_type;
      if (hasPlanSignals) {
        return {
          type: 'plan-result-structured',
          data: {
            coverage_answer: coverage_answer || 'Coverage details found.',
            effective_date,
            end_date,
            member_id,
            member_name,
            plan_details: {
              copay: copay || 'N/A',
              coverage_type: coverage_type || 'N/A',
              covered_services: covered_services || 'N/A',
              notes: undefined,
            },
            plan_id: plan_id || 'N/A',
            status: undefined,
            type: 'member_coverage',
          },
        };
      }

      // If not plan-like, try to infer a denial explanation structure
      const codeFromQuery = userQuery.match(/\b[A-Za-z]{1,3}-?\d{1,3}\b/i)?.[0] || '';
      const codeFromText = text.match(/\b(?:CO|PR|PI|OA|CR|N)-?\d{1,3}\b/i)?.[0] || '';
      const inferredCode = codeFromQuery || codeFromText;

      const actionMatch = text.match(/(?:recommended\s*action|suggested\s*action|next\s*steps|action)\s*[:-]?\s*([\s\S]+)/i);
      const beforeAction = actionMatch ? text.slice(0, actionMatch.index).trim() : text.trim();
      const description = beforeAction
        .replace(/^\s*(denial\s*code[^:]*[:-]?)/i, '')
        .replace(/^\s*(code[^:]*[:-]?)/i, '')
        .replace(/^\s*means\s*[:-]?\s*/i, '')
        .trim();
      const suggested = actionMatch ? (actionMatch[1] || '').trim() : '';

      if (inferredCode || suggested || /denial\s*code/i.test(text)) {
        return {
          type: 'denial-result-structured',
          data: {
            denial_code: inferredCode || codeFromQuery || codeFromText || 'Code',
            description: description || text,
            suggested_action: suggested,
            original_text: text,
            original_query: userQuery,
          },
        };
      }
    }

    // Denial explanations
    if (
      payload?.type === 'denial_explanation' ||
      payload?.type === 'denial' ||
      payload?.denial_code ||
      payload?.explanation ||
      payload?.suggested_action ||
      payload?.description ||
      payload?.reason
    ) {
      const originalCode = userQuery.match(/\b[A-Za-z]{1,3}-?\d{1,3}\b/)?.[0] || payload.denial_code || payload.code;
      const mapped = {
        denial_code: originalCode,
        description: payload.description || payload.explanation || payload.meaning || payload.reason,
        suggested_action: payload.suggested_action || payload.action || payload.recommendation || payload.next_steps,
      };
      return {
        type: 'denial-result-structured',
        data: { ...payload, ...mapped, original_query: userQuery },
      };
    }

    // Plan/member coverage
    if (
      payload?.type === 'plan_coverage' ||
      payload?.type === 'member_coverage' ||
      payload?.coverage_answer ||
      payload?.plan_details ||
      payload?.coverageAnswer ||
      payload?.planDetails
    ) {
      // Map camelCase keys if present
      const data = {
        ...payload,
        coverage_answer: payload.coverage_answer ?? payload.coverageAnswer,
        plan_details: payload.plan_details ?? payload.planDetails,
        member_id: payload.member_id ?? payload.memberId,
        member_name: payload.member_name ?? payload.memberName,
        plan_id: payload.plan_id ?? payload.planId,
        effective_date: payload.effective_date ?? payload.effectiveDate,
        end_date: payload.end_date ?? payload.endDate,
        status: payload.status,
      };
      return { type: 'plan-result-structured', data };
    }

    // Member info
    if (
      payload?.type === 'member_info' ||
      (payload?.member_id && (payload?.member_name || payload?.status)) ||
      (payload?.memberId && (payload?.memberName || payload?.status))
    ) {
      const data = {
        ...payload,
        member_id: payload.member_id ?? payload.memberId,
        member_name: payload.member_name ?? payload.memberName,
      };
      return { type: 'member-result-structured', data };
    }

    // Generated response/help/out of scope passthroughs
    if (payload.type === 'generated_response' && payload.response) {
      return payload.response;
    }
    if (payload.type === 'help_response' || payload.type === 'general_help') {
      return payload.message || payload.response || 'Here to help with denial codes and coverage questions!';
    }
    if (payload.type === 'out_of_scope') {
      return { type: 'out_of_scope', data: { message: payload.message || 'This seems out of scope.' } };
    }

    return payload;
  };

  // Enhanced query processing with general chatbot fallback
  const processQuery = async (userQuery) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        addErrorMessage("Please log in to use the smart query feature.", false);
        setConnectionStatus('error');
        return;
      }

      const response = await fetch(API_ENDPOINTS.SMART_QUERY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: userQuery
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const normalized = normalizeResponse(result, userQuery);
        if (normalized) {
          addBotMessage(normalized);
        } else {
          addBotMessage(result.response || 'I processed your query successfully.');
        }
        setConnectionStatus('connected');
      } else {
        // Handle different error types
        let errorMessage = "I'm having trouble processing your request.";
        let isRetryable = true;
        
        if (response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
          isRetryable = false;
        } else if (response.status === 429) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (response.status >= 500) {
          errorMessage = "Server is experiencing issues. Please try again in a few moments.";
        } else if (result.error) {
          errorMessage = result.error;
        }
        
        addErrorMessage(errorMessage, isRetryable);
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Smart Query API Error:', error);
      
      // Enhanced error messages based on error type
      let errorMessage = "I'm having trouble connecting to my smart processing system.";
      let isRetryable = true;
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Network connection issue. Please check your internet connection and try again.";
      } else if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please try again.";
      } else if (retryCount < 2) {
        errorMessage = "Temporary connection issue. Retrying...";
        setRetryCount(prev => prev + 1);
        
        // Auto-retry for transient errors
        setTimeout(() => {
          if (currentInput.trim()) {
            handleInputSubmit();
          }
        }, 2000);
        return;
      }
      
        try {
          const aiResponse = await advancedAI.processAdvancedQuery(userQuery, 'CSR Denial Code Context: Healthcare insurance, medical billing, claim denials, coverage questions');
          
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
  };

  return (
    <div className="chatbot-container">
      {/* Elegant Header */}
      <header className="chatbot-header">
        <div className="header-content">
          <div className="bot-avatar">🤖</div>
          <div className="header-text">
            <h1>CSR Denial Knowledge Bot</h1>
            <p>Your AI Assistant for Instant Answers</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={() => navigate('/')} className="header-btn">
            ← Back to Home
          </button>
          <button onClick={handleLogout} className="header-btn">
            Sign Out →
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="chat-area">
        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onQuickReply={handleQuickReply}
            />
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="chat-message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="message-text" style={{ fontStyle: 'italic', color: '#64748b' }}>
                  AI is thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="messages-end-spacer" />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="chat-input-container">
        <form onSubmit={handleInputSubmit} className="chat-input-form">
          <div className="input-wrapper">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (currentInput.trim() && !isTyping) {
                    handleInputSubmit(e);
                  }
                }
              }}
              placeholder="Ask about denial codes, plan coverage, or member information..."
              className="chat-input"
              disabled={isTyping}
              autoComplete="off"
              rows="1"
              style={{ resize: 'none', overflow: 'hidden' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          <button 
            type="submit" 
            className="send-button"
            disabled={!currentInput.trim() || isTyping}
          >
            {isTyping ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <span>Ask</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Chat Message Component
function ChatMessage({ message, onQuickReply }) {

  if (message.sender === 'user') {
    return (
      <div className="chat-message user">
        <div className="message-avatar">👤</div>
        <div className="message-content">
          <div className="message-text">{message.text}</div>
        </div>
      </div>
    );
  }

  // Bot message handling
  return (
    <div className="chat-message assistant">
      <div className="message-avatar">🤖</div>
      <div className="message-content">
        {message.text?.type === 'member-result-structured' ? (
          <div className="structured-response">
            <div className="response-header">
              <span>📋</span>
              <h3 className="response-title">Plan & Coverage Query Results</h3>
            </div>

            <div className="coverage-answer">
              {message.text.data.coverage_answer}
            </div>

            <div className="response-grid">
              <div className="response-section">
                <div className="section-title">
                  👤 Member Information
                </div>
                <div className="info-item">
                  <span className="info-label">Member</span>
                  <span className="info-value">
                    {message.text.data.member_name || 'N/A'} ({message.text.data.member_id || 'N/A'})
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value">{message.text.data.status || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Plan</span>
                  <span className="info-value">
                    {message.text.data.plan_id || 'N/A'}
                    {message.text.data.plan_details?.coverage_type && message.text.data.plan_details.coverage_type !== 'N/A' ? 
                      ` (${message.text.data.plan_details.coverage_type})` : ''}
                  </span>
                </div>
                {(message.text.data.effective_date || message.text.data.end_date) && (
                  <div className="info-item">
                    <span className="info-label">Coverage Period</span>
                    <span className="info-value">
                      {message.text.data.effective_date || 'N/A'} to {message.text.data.end_date || 'N/A'}
                    </span>
                  </div>
                )}
              </div>

              <div className="response-section">
                <div className="section-title">
                  📊 Plan Details
                </div>
                {Object.entries(message.text.data.plan_details || {}).map(([key, value]) => (
                  <div key={key} className="info-item">
                    <span className="info-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="info-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {message.text.data.warning && (
              <div className="warning-section" style={{ 
                background: '#fef3cd', 
                border: '1px solid #fbbf24', 
                borderRadius: '8px', 
                padding: '1rem', 
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️</span>
                <span style={{ color: '#92400e' }}>{message.text.data.warning}</span>
              </div>
            )}
          </div>
        ) : message.text?.type === 'denial-result-structured' ? (
          <div className="structured-response">
            <div className="response-header" style={{ justifyContent: 'center', gap: '0.5rem' }}>
              <span>🔍</span>
              <h3 className="response-title" style={{ margin: 0 }}>Denial Code Explanation</h3>
              {message.text.data.denial_code && (
                <span style={{
                  marginLeft: '0.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  {message.text.data.denial_code}
                </span>
              )}
            </div>

            <div className="response-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div className="response-section">
                <div className="section-title">📋 Description</div>
                <div className="section-content">
                  {message.text.data.description || 
                   message.text.data.explanation || 
                   message.text.data.meaning ||
                   message.text.data.details || 
                   'No description available'}
                </div>
              </div>

              <div className="response-section">
                <div className="section-title">✅ Suggested Action</div>
                <div className="section-content">
                  {message.text.data.suggested_action || 
                      message.text.data.action || 
                      message.text.data.recommendation ||
                      message.text.data.next_steps ||
                      'Check payer fee schedule or submit an appeal with documentation'}
                </div>
              </div>
            </div>
          </div>
        ) : message.text?.type === 'plan-result-structured' ? (
          <div className="structured-response">
            <div className="response-header" style={{ justifyContent: 'center' }}>
              <span>📋</span>
              <h3 className="response-title">Plan & Coverage Information</h3>
            </div>

            {/* Coverage Answer - Main Result */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}>
              {message.text.data.coverage_answer}
            </div>

            <div className="response-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {/* Member Information */}
              <div className="response-section">
                <div className="section-title">
                  👤 Member Details
                </div>
                <div style={{
                  display: 'grid',
                  gap: '0.3rem',
                  fontSize: '0.8rem'
                }}>
                  <div><strong>ID:</strong> {message.text.data.member_id}</div>
                  <div><strong>Name:</strong> {message.text.data.member_name}</div>
                  <div><strong>Status:</strong>
                    <span style={{
                      color: message.text.data.status === 'Active' ? '#10b981' : '#ef4444',
                      fontWeight: '600',
                      marginLeft: '0.5rem'
                    }}>
                      {message.text.data.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="response-section">
                <div className="section-title">
                  📋 Plan Information
                </div>
                <div style={{
                  display: 'grid',
                  gap: '0.3rem',
                  fontSize: '0.8rem'
                }}>
                  <div><strong>Plan ID:</strong> {message.text.data.plan_id}</div>
                  <div><strong>Type:</strong> {message.text.data.plan_details?.coverage_type}</div>
                  <div><strong>Copay:</strong> {message.text.data.plan_details?.copay}</div>
                </div>
              </div>

              {/* Coverage Details */}
              <div className="response-section">
                <div className="section-title">
                  🏥 Coverage Details
                </div>
                <div style={{
                  display: 'grid',
                  gap: '0.3rem',
                  fontSize: '0.8rem'
                }}>
                  <div><strong>Services:</strong> {message.text.data.plan_details?.covered_services}</div>
                  <div><strong>Effective:</strong> {message.text.data.effective_date}</div>
                  <div><strong>Expires:</strong> {message.text.data.end_date}</div>
                </div>
              </div>

              {/* Important Notes */}
              {message.text.data.plan_details?.notes ? (
                <div className="response-section">
                  <div className="section-title">
                    📝 Important Notes
                  </div>
                  <div style={{
                    color: '#64748b',
                    fontSize: '0.8rem',
                    fontStyle: 'italic',
                    padding: '0.5rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {message.text.data.plan_details.notes}
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        ) : message.text?.type === 'error' ? (
          <div className="structured-response error-response">
            <div className="response-header" style={{ justifyContent: 'center' }}>
              <span>⚠️</span>
              <h3 className="response-title" style={{ margin: 0, color: '#dc2626' }}>Something went wrong</h3>
            </div>
            
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1rem',
              margin: '1rem 0',
              color: '#991b1b'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Error Details:</div>
              <div>{message.text.message}</div>
            </div>
            
            {message.text.isRetryable && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => onQuickReply && onQuickReply('Try again')}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  🔄 Try Again
                </button>
              </div>
            )}
            
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#0c4a6e'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>💡 Alternative:</div>
              <div>You can still ask me about denial codes, plan coverage, and member information - I'll do my best to help!</div>
            </div>
          </div>
        ) : message.text?.type === 'out_of_scope' ? (
          <div className="structured-response">
            <div className="response-header">
              <span>ℹ️</span>
              <h3 className="response-title">Information</h3>
            </div>
            <div style={{ 
              color: '#64748b', 
              textAlign: 'center',
              padding: '1rem',
              fontStyle: 'italic'
            }}>
              {message.text.data.message}
            </div>
          </div>
        ) : (
          <div className="message-text">
            {typeof message.text === 'string' ? message.text.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            )) : (
              <div>
                {typeof message.text === 'object' ? JSON.stringify(message.text, null, 2) : String(message.text)}
              </div>
            )}
          </div>
        )}

        {message.options?.quickReplies && (
          <div className="quick-replies" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {message.options.quickReplies.map((reply, index) => (
              <button
                key={index}
                className="quick-reply-btn"
                onClick={() => onQuickReply(reply)}
                style={{
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {reply}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatBot; 