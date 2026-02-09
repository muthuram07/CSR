import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import generalChatbot from '../../services/generalChatbot';
import advancedAI from '../../services/advancedAI';
import chatHistory from '../../services/chatHistory';
import './ChatBot.css';

function ChatBot() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const initializedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const isRestoringRef = useRef(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [answerMode, setAnswerMode] = useState('auto');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const persistMessage = useCallback(async (role, text, options = null) => {
    try {
      if (isRestoringRef.current) return;
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;

      const isStructured = typeof text === 'object' && text !== null;
      const content = isStructured ? JSON.stringify(text) : String(text ?? '');
      const contentType = isStructured ? 'structured_json' : 'text';

      await chatHistory.appendMessage(sessionId, {
        role,
        content,
        contentType,
        metadata: options ? options : null,
      });
    } catch (e) {
      console.error('Failed to persist message:', e);
    }
  }, []);

  const restoreMessagesForSession = useCallback(async (sessionId) => {
    const rows = await chatHistory.getSessionMessages(sessionId);
    const restored = rows.map((r) => {
      let text = r.content;
      if (r.contentType === 'structured_json') {
        try {
          text = JSON.parse(r.content);
        } catch (_) {
          text = r.content;
        }
      }

      return {
        id: r.id || Date.now(),
        text,
        sender: r.role === 'user' ? 'user' : 'bot',
        timestamp: r.createdAt ? new Date(r.createdAt) : new Date(),
        type: r.role === 'user' ? 'text' : (r.contentType === 'structured_json' ? 'text' : 'text'),
        options: r.metadata || null,
      };
    });

    isRestoringRef.current = true;
    setMessages(restored);
    isRestoringRef.current = false;
  }, []);

  const bootstrapHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setBootstrapped(true);
        return;
      }

      const today = await chatHistory.getOrCreateTodaySession();
      sessionIdRef.current = today.id;
      setActiveSessionId(today.id);

      const list = await chatHistory.listSessions();
      setSessions(list);

      await restoreMessagesForSession(today.id);
    } catch (e) {
      console.error('Failed to bootstrap chat history:', e);
    } finally {
      setBootstrapped(true);
    }
  }, [restoreMessagesForSession]);

  const tryLocalAnswer = (query) => {
    if (typeof query !== 'string') return null;
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const isDateQuestion =
      /\b(today'?s|todays|current)\b/.test(q) && /\bdate\b/.test(q);
    const isTimeQuestion = /\b(current|now|right now)\b/.test(q) && /\btime\b/.test(q);
    const isDayQuestion = /\bwhat day is it\b/.test(q) || (/\btoday\b/.test(q) && /\bday\b/.test(q));

    if (!(isDateQuestion || isTimeQuestion || isDayQuestion)) return null;

    const now = new Date();
    const dateStr = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(now);

    const timeStr = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }).format(now);

    if (isTimeQuestion) {
      return `Current time: **${timeStr}**`;
    }
    if (isDayQuestion && !isDateQuestion) {
      const dayOnly = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(now);
      return `Today is **${dayOnly}**.`;
    }
    return `Today's date: **${dateStr}**`;
  };

  const buildEnhanceContext = (displayText) => {
    try {
      if (typeof displayText === 'string') return displayText;
      if (!displayText || typeof displayText !== 'object') return '';

      if (displayText.type === 'denial_code_response') {
        const d = displayText.data || {};
        return `Denial Code: ${d.code || ''}\nDescription: ${d.description || ''}\nSuggested Action: ${d.action || ''}`.trim();
      }

      if (displayText.type === 'coverage_response') {
        const a = displayText.data?.answer || '';
        return `Coverage Information:\n${a}`.trim();
      }

      if (displayText.type === 'general_help') {
        const m = displayText.data?.message || '';
        return `Help/Guidance:\n${m}`.trim();
      }

      if (displayText.type === 'out_of_scope') {
        const m = displayText.data?.message || '';
        return `Out of scope response:\n${m}`.trim();
      }

      return JSON.stringify(displayText);
    } catch (_) {
      return '';
    }
  };

  const handleEnhance = async (enhance) => {
    try {
      if (!enhance?.query) return;

      const local = tryLocalAnswer(enhance.query);
      if (local) {
        addBotMessage({
          type: 'ai_response',
          data: {
            provider: 'System',
            response: local
          }
        }, 'text', {
          provider: 'System'
        });
        setConnectionStatus('connected');
        return;
      }

      const backendAnswer = enhance.backendAnswer || '';
      const context = backendAnswer
        ? `The backend system answered as follows. Use it as the starting point and provide a clearer, more detailed explanation for the user.

Backend answer:
${backendAnswer}`
        : 'Provide a clearer, more detailed explanation.';

      setIsTyping(true);
      setConnectionStatus('processing');

      const aiResponse = await advancedAI.processAdvancedQuery(enhance.query, context);
      if (aiResponse.type === 'ai_response') {
        addBotMessage({
          type: 'ai_response',
          data: {
            provider: aiResponse.provider,
            response: aiResponse.response
          }
        }, 'text', {
          quickReplies: aiResponse.suggestions,
          provider: aiResponse.provider
        });
        setConnectionStatus('connected');
      } else if (aiResponse.type === 'ai_failed') {
        addBotMessage({
          type: 'error',
          message: aiResponse.response || 'Enhanced explanation failed. Please try again.',
          isRetryable: true,
          timestamp: new Date().toISOString()
        }, 'error');
        setConnectionStatus('error');
      }
    } catch (e) {
      console.error('Enhance (AI) failed:', e);
      addErrorMessage('Enhanced explanation failed. Please try again.', true);
      setConnectionStatus('error');
    } finally {
      setIsTyping(false);
    }
  };

  const shouldFallbackToAI = (backendDisplay) => {
    try {
      if (!backendDisplay) return true;

      const isGenericBackendHelp = (val) => {
        try {
          // Matches the backend generic guidance:
          // UI may render a "How I can help" header even when it is not present in the message.
          // We match based on the core guidance sentence.
          let msg = '';
          if (typeof val === 'object' && val !== null) {
            if (val.type === 'general_help' && typeof val.data?.message === 'string') {
              msg = val.data.message;
            } else if (typeof val.message === 'string') {
              msg = val.message;
            }
          } else if (typeof val === 'string') {
            msg = val;
          }

          const s = String(msg || '').toLowerCase();
          if (!s) return false;
          return (
            s.includes('i can help you with') &&
            (s.includes('denial code') || s.includes('denial codes')) &&
            (s.includes('member information') || s.includes('member') || s.includes('member info')) &&
            (s.includes('plan coverage') || s.includes('coverage'))
          );
        } catch (_) {
          return false;
        }
      };

      if (typeof backendDisplay === 'object') {
        const t = backendDisplay.type;
        // Only auto-fallback when backend explicitly says it cannot answer.
        // For normal help/guidance responses, we show the backend answer and let the user click "Enhanced explanation".
        if (t === 'out_of_scope') return true;
        if (t === 'general_help' && isGenericBackendHelp(backendDisplay)) return true;
        return false;
      }

      if (typeof backendDisplay === 'string') {
        const s = backendDisplay.trim().toLowerCase();
        if (!s) return true;

        if (isGenericBackendHelp(backendDisplay)) return true;

        // Auto-fallback only when the backend explicitly indicates it can't answer.
        if (s.includes("i don't know") || s.includes('i do not know')) return true;
        if (s.includes("i can't help") || s.includes('i cannot help')) return true;
        if (s.includes('out of scope')) return true;
        if (s.includes("i'm not sure") || s.includes('im not sure')) return true;
        if (s.includes('unable to answer') || s.includes('cannot answer')) return true;
      }

      return false;
    } catch (_) {
      return true;
    }
  };

  const isGenericBackendHelpMessage = (backendDisplay) => {
    try {
      let msg = '';
      if (typeof backendDisplay === 'object' && backendDisplay !== null) {
        if (backendDisplay.type === 'general_help' && typeof backendDisplay.data?.message === 'string') {
          msg = backendDisplay.data.message;
        } else if (typeof backendDisplay.message === 'string') {
          msg = backendDisplay.message;
        }
      } else if (typeof backendDisplay === 'string') {
        msg = backendDisplay;
      }

      const s = String(msg || '').toLowerCase();
      if (!s) return false;
      return (
        s.includes('i can help you with') &&
        (s.includes('denial code') || s.includes('denial codes')) &&
        (s.includes('member information') || s.includes('member') || s.includes('member info')) &&
        (s.includes('plan coverage') || s.includes('coverage'))
      );
    } catch (_) {
      return false;
    }
  };

  const addBotMessage = useCallback((text, type = 'text', options = null) => {
    const cleanText = text;
    
    const message = {
      id: Date.now(),
      text: cleanText,
      sender: 'bot',
      timestamp: new Date(),
      type,
      options
    };
    setMessages(prev => [...prev, message]);
    setLastError(null);
    persistMessage('bot', cleanText, options);
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
    bootstrapHistory();
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;
    if (initializedRef.current) return;
    if (messages.length > 0) {
      initializedRef.current = true;
      return;
    }

    initializedRef.current = true;
    const introCard = {
      id: Date.now(),
      text: {
        type: 'general_help',
        data: {
          message:
            "Hello — I’m your CSR Knowledge Bot. Ask me denial-code, plan coverage, or general knowledge questions.\n\nTry:"
        }
      },
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      options: {
        quickReplies: [
          'What does denial code CO-45 mean?',
          'Is dental covered for member M12345?',
          'What is the capital of India?',
          'Explain quantum computing'
        ]
      }
    };
    setMessages([introCard]);
  }, [bootstrapped, messages.length]);
  
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
    persistMessage('user', text, null);
  };

  const handleSessionChange = async (e) => {
    const nextId = Number(e.target.value);
    if (!nextId || nextId === activeSessionId) return;
    try {
      setActiveSessionId(nextId);
      sessionIdRef.current = nextId;
      await restoreMessagesForSession(nextId);
    } catch (err) {
      console.error('Failed to switch session:', err);
    }
  };

  const handleAnswerModeChange = (e) => {
    setAnswerMode(e.target.value);
  };

  const handleQuickReply = (reply) => {
    addUserMessage(reply);
    
    setTimeout(() => {
      if (reply === 'Denial Code Resolution') {
        addBotMessage("Perfect! I can help you with denial codes. Just tell me naturally, like:\n\n🔹 \"What does denial code D001 mean?\"\n🔹 \"Why was claim rejected with code 96?\"\n\nWhat denial code would you like to know about?");
      } else if (reply === 'Plan Coverage Query') {
        addBotMessage("Great! I can help with plan coverage. Just ask naturally, like:\n\n🔹 \"Is dental covered for member M12345?\"\n🔹 \"What benefits does John Doe have?\"\n\nWhat would you like to know about coverage?");
      } else if (reply === 'Help') {
        addBotMessage("I'm your intelligent CSR assistant! I can understand natural language questions about:\n\n🔍 **Denial Codes**: Ask about any denial code and get step-by-step resolution\n📋 **Plan Coverage**: Check member benefits and coverage details\n🔎 **Member Lookup**: Find member information\n🤖 **Advanced AI**: Complex questions using multiple AI services\n\nJust type your question naturally! What would you like to know?");
      }
    }, 1000);
  };

  const processQuery = async (userQuery, options = {}) => {
    try {
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
      console.log('Backend response:', result);

      if (response.ok) {
        // Handle JSON responses properly
        let displayText = result.response || 'I processed your query successfully.';
        
        // If response is already a JSON object (from backend)
        if (typeof displayText === 'object') {
          console.log('Backend returned object:', displayText);
          // Generic help format returned by some paths: { message, type }
          if (displayText && typeof displayText.message === 'string' && typeof displayText.type === 'string') {
            // Preserve type for UI rendering when useful
            if (displayText.type === 'general_help') {
              displayText = {
                type: 'general_help',
                data: {
                  message: displayText.message
                }
              };
            } else {
              displayText = displayText.message;
            }
          } else
          // Structured payload format: { type, data }
          if (displayText && typeof displayText.type === 'string' && typeof displayText.data === 'object' && displayText.data !== null) {
            if (displayText.type === 'coverage_response') {
              const answer = displayText.data.answer || displayText.data.coverage_answer || '';
              displayText = {
                type: 'coverage_response',
                data: {
                  answer: typeof answer === 'string' ? answer : JSON.stringify(answer)
                }
              };
            } else {
              // Unknown structured object: show its message if present, else stringify
              const msg = displayText.data.message || displayText.message;
              displayText = typeof msg === 'string' ? msg : JSON.stringify(displayText, null, 2);
            }
          } else
          if (displayText.denial_code) {
            displayText = {
              type: 'denial_code_response',
              data: {
                code: displayText.denial_code,
                description: displayText.description || 'No description available',
                action: displayText.suggested_action || 'No specific action suggested',
                original: displayText
              }
            };
          } else if (displayText.coverage_answer) {
            displayText = `📋 **Coverage Information**\n\n${displayText.coverage_answer}`;
          } else if (displayText.member_name) {
            displayText = `👤 **Member Information**\n\n**Name:** ${displayText.member_name || 'N/A'}\n**ID:** ${displayText.member_id || 'N/A'}\n**Status:** ${displayText.status || 'N/A'}`;
          } else {
            displayText = JSON.stringify(displayText, null, 2);
          }
        } else if (typeof displayText === 'string' && displayText.startsWith('{')) {
          // Handle stringified JSON (fallback for older backend versions)
          try {
            const parsed = JSON.parse(displayText);
            if (parsed.denial_code) {
              displayText = `🔍 **Denial Code ${parsed.denial_code}**\n\n**Description:** ${parsed.description || 'No description available'}\n\n**Suggested Action:** ${parsed.suggested_action || 'No specific action suggested'}`;
            } else if (parsed.coverage_answer) {
              displayText = `📋 **Coverage Information**\n\n${parsed.coverage_answer}`;
            } else {
              displayText = JSON.stringify(parsed, null, 2);
            }
          } catch (e) {
            console.log('Could not parse JSON response, showing as-is');
          }
        }
        
        const cleanText = displayText;

        const suppressGenericHelp = !!options?.suppressGenericHelp;
        const shouldSuppress = suppressGenericHelp && isGenericBackendHelpMessage(cleanText);
        let botMessageId = null;
        if (!shouldSuppress) {
          botMessageId = Date.now();
          const msgOptions = {
            source: 'backend',
            enhance: {
              query: userQuery,
              backendAnswer: buildEnhanceContext(cleanText)
            }
          };
          setMessages(prev => [...prev, {
            id: botMessageId,
            text: cleanText,
            sender: 'bot',
            timestamp: new Date(),
            type: 'text',
            options: msgOptions
          }]);
          persistMessage('bot', cleanText, msgOptions);
        }
        
        // Check for denial code patterns in text and reformat
        if (typeof displayText === 'string' && botMessageId) {
          const denialCodePattern = /denial code (\d+).*?description: ([^.]+).*?suggested action: ([^.]+)/i;
          const match = displayText.match(denialCodePattern);
          
          if (match) {
            const [, code, description, action] = match;
            const formattedResponse = {
              type: 'denial_code_response',
              data: {
                code: code,
                description: description.trim(),
                action: action.trim(),
                original: displayText
              }
            };
            
            // Replace the message with formatted version
            setMessages(prev => 
              prev.map(msg => 
                msg.id === botMessageId 
                  ? { ...msg, text: formattedResponse }
                  : msg
              )
            );
          }
        }
        
        setConnectionStatus('connected');
        return { ok: true, display: cleanText, raw: result, suppressed: shouldSuppress };
      } else {
        throw new Error(result.error || 'Failed to process query');
      }
    } catch (error) {
      console.error('Smart Query API Error:', error);
      throw error;
    }
  };

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
        const local = tryLocalAnswer(userQuery);
        if (local) {
          addBotMessage({
            type: 'ai_response',
            data: {
              provider: 'System',
              response: local
            }
          }, 'text', {
            provider: 'System'
          });
          setConnectionStatus('connected');
          return;
        }

        if (answerMode === 'gemini') {
          const aiResponse = await advancedAI.processGeminiOnly(userQuery, 'User selected: Gemini only');
          if (aiResponse.type === 'ai_response') {
            addBotMessage({
              type: 'ai_response',
              data: {
                provider: aiResponse.provider,
                response: aiResponse.response
              }
            }, 'text', {
              quickReplies: aiResponse.suggestions,
              provider: aiResponse.provider
            });
            setConnectionStatus('connected');
            return;
          }

          addErrorMessage(aiResponse.response || 'Gemini failed to respond. Please try again.', true);
          setConnectionStatus('error');
          return;
        }

        const backendResult = await processQuery(userQuery, { suppressGenericHelp: answerMode === 'auto' });

        if (answerMode === 'backend') {
          setConnectionStatus('connected');
          return;
        }

        // Auto mode: Backend-first, fallback to AI when backend explicitly can't answer.
        if (backendResult?.ok && shouldFallbackToAI(backendResult.display)) {
          try {
            const aiResponse = await advancedAI.processAdvancedQuery(userQuery, 'Fallback from backend (no answer)');
            if (aiResponse.type === 'ai_response') {
              addBotMessage({
                type: 'ai_response',
                data: {
                  provider: aiResponse.provider,
                  response: aiResponse.response
                }
              }, 'text', {
                quickReplies: aiResponse.suggestions,
                provider: aiResponse.provider
              });
            }
          } catch (aiError) {
            console.error('Advanced AI failed (post-backend fallback):', aiError);
          }
        }
      } catch (error) {
        console.log('Main system failed, trying fallbacks...');
        console.log('User query:', userQuery);

        console.log('Available AI services:', advancedAI.getServicesStatus());

        // If backend request failed entirely, try AI for ANY query (unless user selected backend only)
        try {
          if (answerMode !== 'backend') {
            const aiResponse = await advancedAI.processAdvancedQuery(userQuery, 'Backend failed - AI fallback');
            if (aiResponse.type === 'ai_response') {
              addBotMessage({
                type: 'ai_response',
                data: {
                  provider: aiResponse.provider,
                  response: aiResponse.response
                }
              }, 'text', {
                quickReplies: aiResponse.suggestions,
                provider: aiResponse.provider
              });
              setConnectionStatus('connected');
              return;
            }
          }
        } catch (aiError) {
          console.error('Advanced AI failed (backend-failure fallback):', aiError);
        }
        
        // Fallback to general chatbot
        console.log('Falling back to general chatbot for:', userQuery);
        try {
          const generalResponse = await generalChatbot.getEnhancedResponse(userQuery);
          console.log('General response:', generalResponse);
          
          if (generalResponse.type === 'general_response' || generalResponse.type === 'help_response' || generalResponse.type === 'general_help') {
            console.log('Displaying general response:', generalResponse.response);
            addBotMessage(generalResponse.response, 'text', {
              quickReplies: generalResponse.suggestions
            });
          } else if (generalResponse.type === 'out_of_scope') {
            addBotMessage({
              type: 'out_of_scope',
              data: { message: generalResponse.response }
            });
          } else {
            // Handle any other types as regular text
            addBotMessage(generalResponse.response || 'I understand your question. Please ask about denial codes or coverage questions.', 'text', {
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <div className="header-content">
          <div className="bot-avatar">🤖</div>
          <div className="header-text">
            <h1>CSR Denial Knowledge Bot</h1>
            <p>Your AI Assistant for Instant Answers</p>
          </div>
        </div>
        
        <div className="header-actions">
          <select
            className="header-btn"
            value={activeSessionId || ''}
            onChange={handleSessionChange}
            disabled={!sessions || sessions.length === 0}
          >
            {sessions && sessions.length > 0 ? (
              sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sessionDate}
                </option>
              ))
            ) : (
              <option value="">History</option>
            )}
          </select>
          <button onClick={() => navigate('/')} className="header-btn">
            ← Back to Home
          </button>
          <button onClick={handleLogout} className="header-btn">
            Sign Out →
          </button>
        </div>
      </header>

      <div className="chat-area">
        <div className="chat-messages">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onQuickReply={handleQuickReply}
              onEnhance={handleEnhance}
            />
          ))}
          
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
              placeholder="Ask about denial codes, plan coverage, or any general knowledge question..."
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
          <select
            className="header-btn"
            value={answerMode}
            onChange={handleAnswerModeChange}
            disabled={isTyping}
          >
            <option value="auto">Smart Assist</option>
            <option value="backend">Denial Assistant</option>
            <option value="gemini">Gemini</option>
          </select>
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

function ChatMessage({ message, onQuickReply, onEnhance }) {
  const renderRichText = (text) => {
    if (typeof text !== 'string') return null;

    const renderInline = (input) => {
      if (typeof input !== 'string') return input;
      const parts = input.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
      return parts.map((p, idx) => {
        if (p.startsWith('**') && p.endsWith('**') && p.length >= 4) {
          return <strong key={idx} className="rt-strong">{p.slice(2, -2)}</strong>;
        }
        return <React.Fragment key={idx}>{p}</React.Fragment>;
      });
    };

    const lines = text.split('\n');
    const blocks = [];
    let buffer = [];

    const flushParagraph = () => {
      const content = buffer.join(' ').trim();
      if (content) {
        blocks.push({ type: 'p', content });
      }
      buffer = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line.trim()) {
        flushParagraph();
        continue;
      }

      // Headings (# / ## / ###)
      const headingMatch = line.trim().match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        blocks.push({ type: `h${headingMatch[1].length}`, content: headingMatch[2].trim() });
        continue;
      }

      // Bullet-style lines
      if (line.startsWith('🔹') || line.startsWith('- ') || line.startsWith('• ')) {
        flushParagraph();
        blocks.push({ type: 'li', content: line.replace(/^(- |• )/, '').trim() });
        continue;
      }

      buffer.push(line.trim());
    }
    flushParagraph();

    const hasList = blocks.some(b => b.type === 'li');
    if (!hasList) {
      return blocks.map((b, idx) => (
        b.type === 'h1' ? <h3 key={idx} className="rt-heading rt-h1">{renderInline(b.content)}</h3>
        : b.type === 'h2' ? <h4 key={idx} className="rt-heading rt-h2">{renderInline(b.content)}</h4>
        : b.type === 'h3' ? <h5 key={idx} className="rt-heading rt-h3">{renderInline(b.content)}</h5>
        : <p key={idx} className="rt-paragraph">{renderInline(b.content)}</p>
      ));
    }

    // Render paragraphs + list items grouped
    const nodes = [];
    let listItems = [];
    const flushList = () => {
      if (listItems.length) {
        nodes.push(
          <ul key={`ul-${nodes.length}`} className="rt-list">
            {listItems.map((li, idx) => (
              <li key={idx} className="rt-list-item">{renderInline(li)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    blocks.forEach((b, idx) => {
      if (b.type === 'li') {
        listItems.push(b.content);
      } else {
        flushList();
        if (b.type === 'h1') nodes.push(<h3 key={`h1-${idx}`} className="rt-heading rt-h1">{renderInline(b.content)}</h3>);
        else if (b.type === 'h2') nodes.push(<h4 key={`h2-${idx}`} className="rt-heading rt-h2">{renderInline(b.content)}</h4>);
        else if (b.type === 'h3') nodes.push(<h5 key={`h3-${idx}`} className="rt-heading rt-h3">{renderInline(b.content)}</h5>);
        else nodes.push(<p key={`p-${idx}`} className="rt-paragraph">{renderInline(b.content)}</p>);
      }
    });
    flushList();

    return nodes;
  };

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
        {typeof message.text === 'object' && message.text?.type === 'error' ? (
          <div className="response-card error-card">
            <div className="card-header error-header">
              <div className="card-icon">⚠️</div>
              <div className="card-title">Error</div>
            </div>
            <div className="card-content">
              <div className="error-message">{message.text.message}</div>
              {message.text.isRetryable && (
                <div className="card-actions">
                  <button 
                    onClick={() => onQuickReply && onQuickReply('Try Again')}
                    className="action-btn primary-btn"
                  >
                    🔄 Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : typeof message.text === 'object' && message.text?.type === 'ai_response' ? (
          <div className="response-card info-card">
            <div className="card-header info-header">
              <div className="card-icon">✨</div>
              <div className="card-title">{message.text.data?.provider || 'AI'} Answer</div>
            </div>
            <div className="card-content">
              <div className="message-text">
                {renderRichText(message.text.data?.response || 'No response received.')}
              </div>

              {message.options?.quickReplies && message.options.quickReplies.length > 0 && (
                <div className="card-actions">
                  <div className="quick-replies-grid">
                    {message.options.quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => onQuickReply && onQuickReply(reply)}
                        className="action-btn secondary-btn"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : typeof message.text === 'object' && message.text?.type === 'coverage_response' ? (
          <div className="response-card coverage-card">
            <div className="card-header coverage-header">
              <div className="card-icon">📋</div>
              <div className="card-title">Coverage Information</div>
            </div>
            <div className="card-content">
              <div className="message-text">
                {renderRichText((message.text.data?.answer || 'No coverage details available.').replace(/^\*+$/, ''))}
              </div>
              {message.options?.enhance?.query && (
                <div className="card-actions">
                  <button
                    onClick={() => onEnhance && onEnhance(message.options.enhance)}
                    className="action-btn secondary-btn"
                  >
                    ✨ Enhanced explanation
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : typeof message.text === 'object' && message.text?.type === 'general_help' ? (
          <div className="response-card help-card">
            <div className="card-header help-header">
              <div className="card-icon">💡</div>
              <div className="card-title">How I can help</div>
            </div>
            <div className="card-content">
              <div className="message-text">
                {message.text.data?.message || 'Ask me about denial codes, plan coverage, or general knowledge questions.'}
              </div>
              {message.options?.enhance?.query && (
                <div className="card-actions">
                  <button
                    onClick={() => onEnhance && onEnhance(message.options.enhance)}
                    className="action-btn secondary-btn"
                  >
                    ✨ Enhanced explanation
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : typeof message.text === 'object' && message.text?.type === 'denial_code_response' ? (
          <div className="response-card denial-card">
            <div className="card-header denial-header">
              <div className="card-icon">🔍</div>
              <div className="card-title">Denial Code Analysis</div>
            </div>
            <div className="card-content">
              <div className="denial-code-main">
                <div className="denial-code-badge">
                  <span className="denial-code-label">Code</span>
                  <span className="denial-code-value">{message.text.data.code}</span>
                </div>
              </div>
              
              <div className="denial-details">
                <div className="detail-section">
                  <div className="detail-label">
                    <span className="detail-icon">📝</span>
                    <span className="detail-title">Description</span>
                  </div>
                  <div className="detail-content">
                    {message.text.data.description}
                  </div>
                </div>
                
                <div className="detail-section">
                  <div className="detail-label">
                    <span className="detail-icon">🎯</span>
                    <span className="detail-title">Suggested Action</span>
                  </div>
                  <div className="detail-content">
                    {message.text.data.action}
                  </div>
                </div>
              </div>
              
              <div className="card-actions">
                <div className="quick-replies-grid">
                  <button 
                    onClick={() => onQuickReply && onQuickReply('Appeal Process')}
                    className="action-btn primary-btn"
                  >
                    📋 Appeal Process
                  </button>
                  <button 
                    onClick={() => onQuickReply && onQuickReply('Similar Codes')}
                    className="action-btn secondary-btn"
                  >
                    🔍 Similar Codes
                  </button>
                  {message.options?.enhance?.query && (
                    <button
                      onClick={() => onEnhance && onEnhance(message.options.enhance)}
                      className="action-btn secondary-btn"
                    >
                      ✨ Enhanced explanation
                    </button>
                  )}
                  <button 
                    onClick={() => onQuickReply && onQuickReply('Help')}
                    className="action-btn secondary-btn"
                  >
                    ❓ Help
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="response-card info-card">
              <div className="card-header info-header">
                <div className="card-icon">🤖</div>
                <div className="card-title">Assistant</div>
              </div>
              <div className="card-content">
                <div className="message-text">
                  {typeof message.text === 'string'
                    ? renderRichText(message.text)
                    : JSON.stringify(message.text)}
                </div>

                {message.options?.provider && (
                  <div className="provider-badge">
                    <span className="provider-icon">⚡</span>
                    <span className="provider-text">{message.options.provider}</span>
                  </div>
                )}

                {message.options?.quickReplies && message.options.quickReplies.length > 0 && (
                  <div className="card-actions">
                    <div className="quick-replies-grid">
                      {message.options.quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => onQuickReply && onQuickReply(reply)}
                          className="action-btn secondary-btn"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.options?.enhance?.query && (
                  <div className="card-actions">
                    <button
                      onClick={() => onEnhance && onEnhance(message.options.enhance)}
                      className="action-btn secondary-btn"
                    >
                      ✨ Enhanced explanation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatBot;
