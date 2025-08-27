'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MdSend, MdPhone, MdVideocam, MdMoreVert, MdArrowBack } from 'react-icons/md';
import { aiService } from '../../services/aiService';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromUser: boolean;
  isTyping?: boolean;
  attachments?: any[];
  buttons?: any[];
}

interface WhatsAppPreviewProps {
  flowSteps: any[];
  isTestMode: boolean;
  companyName?: string;
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({ 
  flowSteps, 
  isTestMode,
  companyName = "Your Company"
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `👋 Welcome! This is a live preview of your automation. Type a message to test how your AI assistant will respond.`,
      timestamp: new Date(),
      isFromUser: false
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateTyping = (callback: () => void, delay: number = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const executeAutomationStep = async (userMessage: string, stepType: string, stepConfig: any) => {
    switch (stepType) {
      case 'ai_response':
        try {
          const result = await aiService.processAIResponse(
            userMessage,
            stepConfig,
            'preview_user',
            'preview_automation'
          );

          if (result.success && result.response) {
            return {
              text: result.response,
              metadata: result.usage
            };
          } else if (result.rate_limited) {
            return {
              text: result.response || 'Rate limit exceeded',
              metadata: { rate_limited: true }
            };
          } else {
            return {
              text: result.response || 'I apologize, but I cannot assist with that request.',
              metadata: { error: result.error }
            };
          }
        } catch (error) {
          return {
            text: 'Sorry, I encountered an error while processing your message.',
            metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
        }

      case 'message':
        // Handle different message formats and show actual configured content
        let messageText = stepConfig.text || stepConfig.message || '';
        
        // If no text configured, show a helpful message
        if (!messageText.trim()) {
          messageText = '💬 Message step (no text configured)';
        }
        
        return {
          text: messageText,
          attachments: stepConfig.attachments,
          buttons: stepConfig.buttons
        };

      case 'condition':
        // For preview, simulate condition evaluation
        const conditions = stepConfig.conditions || [];
        const matchedCondition = conditions.find((cond: any) => {
          if (cond.field === 'message_text' && cond.operator === 'contains') {
            return userMessage.toLowerCase().includes(cond.value.toLowerCase());
          }
          if (cond.field === 'message_text' && cond.operator === 'equals') {
            return userMessage.toLowerCase() === cond.value.toLowerCase();
          }
          if (cond.field === 'message_text' && cond.operator === 'starts_with') {
            return userMessage.toLowerCase().startsWith(cond.value.toLowerCase());
          }
          return false;
        });
        
        if (matchedCondition) {
          return {
            text: `✅ Condition matched: "${matchedCondition.value}"`,
            metadata: { condition_matched: true, matched_condition: matchedCondition }
          };
        } else {
          return {
            text: `❌ No conditions matched`,
            metadata: { condition_matched: false }
          };
        }

      case 'delay':
        const delayTime = stepConfig.delay || 1;
        return {
          text: `⏱️ Waiting ${delayTime} second(s)...`,
          metadata: { delay: delayTime }
        };

      case 'data_input':
        return {
          text: stepConfig.prompt || 'Please provide the required information:',
          metadata: { requesting_input: true, field: stepConfig.field }
        };

      case 'api_call':
        // Simulate API call
        return {
          text: `🔄 API call to ${stepConfig.url || 'external service'} executed`,
          metadata: { api_call: true, url: stepConfig.url }
        };

      case 'webhook':
        return {
          text: `📡 Webhook sent to ${stepConfig.url || 'external endpoint'}`,
          metadata: { webhook: true, url: stepConfig.url }
        };

      case 'custom_action':
        return {
          text: stepConfig.description || '⚡ Custom action executed',
          metadata: { custom_action: true }
        };

      case 'branch':
        return {
          text: `🔀 Flow branched based on conditions`,
          metadata: { branched: true }
        };

      default:
        return {
          text: `📝 ${stepType} step executed`,
          metadata: { step_type: stepType }
        };
    }
  };

  const processUserMessage = async (userMessage: string) => {
    setIsProcessing(true);
    
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      timestamp: new Date(),
      isFromUser: true
    };
    
    setMessages(prev => [...prev, userMsg]);

    // Execute the complete automation flow
    await executeAutomationFlow(userMessage);
    
    setIsProcessing(false);
  };

  const executeAutomationFlow = async (userMessage: string) => {
    // Find trigger step and check if message triggers the automation
    const triggerStep = flowSteps.find(step => step.type === 'trigger');
    
    if (!triggerStep) {
      // If no trigger, find steps with matching keywords or all non-trigger steps
      const relevantSteps = flowSteps.filter(step => {
        if (step.type === 'trigger') return false;
        
        // Check if step has trigger keywords
        if (step.config?.trigger_keywords && typeof step.config.trigger_keywords === 'string') {
          const keywords = step.config.trigger_keywords.split(',').map((k: string) => k.trim().toLowerCase());
          return keywords.some((keyword: string) => userMessage.toLowerCase().includes(keyword));
        }
        
        // For steps without keywords, include them
        return true;
      });

      if (relevantSteps.length === 0) {
        simulateTyping(() => {
          const noResponseMsg: Message = {
            id: Date.now().toString() + '_no_response',
            text: '🤖 No automation triggered by your message. Try using different keywords or check your automation configuration.',
            timestamp: new Date(),
            isFromUser: false
          };
          setMessages(prev => [...prev, noResponseMsg]);
        });
        return;
      }

      // Execute relevant steps
      for (const step of relevantSteps) {
        await executeStepWithDelay(step, userMessage);
      }
      return;
    }

    // Check if trigger conditions are met
    const triggerMatched = checkTriggerConditions(triggerStep, userMessage);
    
    if (!triggerMatched) {
      simulateTyping(() => {
        const noTriggerMsg: Message = {
          id: Date.now().toString() + '_no_trigger',
          text: '🤖 Message did not match trigger conditions.',
          timestamp: new Date(),
          isFromUser: false
        };
        setMessages(prev => [...prev, noTriggerMsg]);
      });
      return;
    }

    // Find the first step after trigger (or first non-trigger step)
    const startingSteps = flowSteps.filter(step => step.type !== 'trigger');
    
    if (startingSteps.length === 0) {
      simulateTyping(() => {
        const noStepsMsg: Message = {
          id: Date.now().toString() + '_no_steps',
          text: '🤖 Automation triggered but no steps configured.',
          timestamp: new Date(),
          isFromUser: false
        };
        setMessages(prev => [...prev, noStepsMsg]);
      });
      return;
    }

    // Execute the automation flow starting from the first step
    await executeStepWithDelay(startingSteps[0], userMessage);
  };

  const checkTriggerConditions = (triggerStep: any, userMessage: string): boolean => {
    if (!triggerStep.config) return true;

    // Check keyword triggers
    if (triggerStep.config.trigger_keywords && typeof triggerStep.config.trigger_keywords === 'string') {
      const keywords = triggerStep.config.trigger_keywords.split(',').map((k: string) => k.trim().toLowerCase());
      return keywords.some((keyword: string) => userMessage.toLowerCase().includes(keyword));
    }

    // Check other trigger types
    if (triggerStep.config.type === 'keyword') {
      const keywords = triggerStep.config.keywords || [];
      return keywords.some((keyword: string) => userMessage.toLowerCase().includes(keyword.toLowerCase()));
    }

    if (triggerStep.config.type === 'exact_match') {
      return userMessage.toLowerCase() === triggerStep.config.match_text?.toLowerCase();
    }

    // Default to triggered if no specific conditions
    return true;
  };

  const executeStepWithDelay = async (step: any, userMessage: string) => {
    return new Promise<void>((resolve) => {
      simulateTyping(async () => {
        const response = await executeAutomationStep(userMessage, step.type, step.config);
        
        // Handle delay steps differently
        if (step.type === 'delay') {
          const delayTime = step.config?.delay || 1;
          setTimeout(() => {
            const delayMsg: Message = {
              id: Date.now().toString() + '_' + step.id,
              text: `⏱️ Waited ${delayTime} second(s)`,
              timestamp: new Date(),
              isFromUser: false
            };
            setMessages(prev => [...prev, delayMsg]);
            resolve();
          }, delayTime * 1000);
          return;
        }
        
        const botMsg: Message = {
          id: Date.now().toString() + '_' + step.id,
          text: response.text,
          timestamp: new Date(),
          isFromUser: false,
          attachments: response.attachments,
          buttons: response.buttons
        };
        
        setMessages(prev => [...prev, botMsg]);
        resolve();
      }, 800 + Math.random() * 1200);
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    const messageText = inputText.trim();
    setInputText('');
    
    await processUserMessage(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="relative">
      {/* Mobile Device Frame */}
      <div className="bg-black rounded-[3rem] p-2 shadow-2xl" style={{ width: '320px', height: '630px' }}>
        {/* Mobile Notch */}
        <div className="relative bg-black rounded-[2.5rem] overflow-hidden h-full">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black rounded-b-xl h-7 w-36 z-50"></div>
          
          {/* WhatsApp Interface */}
          <div className="bg-white h-full flex flex-col rounded-[2.5rem] overflow-hidden">
            {/* Status Bar */}
            <div className="bg-white h-11 flex items-center justify-between px-6 pt-3 pb-1">
              <div className="text-black text-sm font-semibold">9:41</div>
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-black rounded-full"></div>
                  <div className="w-1 h-1 bg-black rounded-full"></div>
                  <div className="w-1 h-1 bg-black rounded-full"></div>
                </div>
                {/* <div className="ml-1 text-black text-sm">100%</div> */}
                <div className="w-6 h-3 border border-black rounded-sm ml-1">
                  <div className="w-full h-full bg-green-500 rounded-sm"></div>
                </div>
              </div>
            </div>

            {/* WhatsApp Header */}
            <div className="bg-[#128C7E] text-white px-4 py-3 flex items-center gap-3 shadow-sm">
              <MdArrowBack className="text-xl" />
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-lg font-semibold text-gray-600 flex-shrink-0">
                {companyName[0]?.toUpperCase() || 'C'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-base truncate">{companyName}</div>
                <div className="text-xs text-gray-200 truncate">
                  {isTestMode ? 'Test Mode • Online' : 'Online'}
                </div>
              </div>
              <div className="flex gap-6 flex-shrink-0">
                <MdVideocam className="text-xl" />
                <MdPhone className="text-xl" />
                <MdMoreVert className="text-xl" />
              </div>
            </div>

            {/* Chat Background */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23128C7E' fill-opacity='0.03'%3E%3Cpath d='M50 50c0 0 20-20 20-20s20 20 20 20-20 20-20 20-20-20-20-20z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: '#ECE5DD'
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm relative ${
                      message.isFromUser
                        ? 'bg-[#DCF8C6] text-gray-800'
                        : 'bg-white text-gray-800'
                    }`}
                    style={{
                      borderRadius: message.isFromUser 
                        ? '18px 18px 4px 18px' 
                        : '18px 18px 18px 4px'
                    }}
                  >
                    {/* Message tail */}
                    <div 
                      className={`absolute bottom-0 w-0 h-0 ${
                        message.isFromUser 
                          ? 'right-0 border-l-[8px] border-l-[#DCF8C6] border-b-[8px] border-b-transparent transform translate-x-1'
                          : 'left-0 border-r-[8px] border-r-white border-b-[8px] border-b-transparent transform -translate-x-1'
                      }`}
                    />
                    
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</div>
                    
                    {/* Message Buttons */}
                    {message.buttons && (
                      <div className="mt-2 space-y-1">
                        {message.buttons.map((button: any, index: number) => (
                          <button
                            key={index}
                            className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors"
                            onClick={() => {
                              if (button.type === 'automation') {
                                processUserMessage(button.text);
                              }
                            }}
                          >
                            {button.text}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className={`text-xs mt-1 text-right ${
                      message.isFromUser ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                      {message.isFromUser && (
                        <span className="ml-1 text-blue-500">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start mb-1">
                  <div 
                    className="bg-white rounded-lg px-4 py-3 shadow-sm relative"
                    style={{ borderRadius: '18px 18px 18px 4px' }}
                  >
                    {/* Typing tail */}
                    <div className="absolute bottom-0 left-0 w-0 h-0 border-r-[8px] border-r-white border-b-[8px] border-b-transparent transform -translate-x-1" />
                    
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#F0F0F0] px-2 py-2 border-t border-gray-200">
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-white rounded-full border border-gray-300 flex items-center px-4 py-3 min-h-[48px]">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isProcessing ? "Processing..." : "Message"}
                    className="flex-1 outline-none text-base text-gray-800"
                    disabled={isProcessing}
                  />
                  <button className="text-gray-400 p-1">
                    📎
                  </button>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isProcessing}
                  className="bg-[#128C7E] text-white p-3 rounded-full hover:bg-[#075E54] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors w-12 h-12 flex items-center justify-center"
                >
                  <MdSend className="text-lg" />
                </button>
              </div>
              
              {isTestMode && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-500 text-center">
                    💡 Quick test messages
                  </div>
                  
                  {/* Quick test buttons */}
                  <div className="flex gap-1 flex-wrap justify-center">
                    {[
                      'Hello, I need help',
                      'What are your prices?',
                      'Tell me about features',
                      'I have a question'
                    ].map((testMsg, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputText(testMsg);
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                        className="text-xs bg-[#128C7E] text-white px-3 py-1 rounded-full hover:bg-[#075E54] transition-colors"
                        disabled={isProcessing}
                      >
                        {testMsg}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
