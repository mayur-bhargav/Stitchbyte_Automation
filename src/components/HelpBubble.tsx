"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { getApiBaseUrl } from '../app/config/backend';

const logDebug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

type TabType = 'home' | 'messages' | 'help' | 'news';
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  buttons?: { label: string; route: string }[];
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
};

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I connect my WhatsApp Business Account?',
    answer: 'Go to Settings page, scroll to WhatsApp Configuration section, and click "Connect WhatsApp". Follow the Facebook login flow to connect your WABA.',
    category: 'Setup',
    keywords: ['connect', 'whatsapp', 'waba', 'setup', 'configuration', 'settings']
  },
  {
    id: '2',
    question: 'How do I create a message template?',
    answer: 'Navigate to Templates page from the sidebar, click "Create Template", fill in the template details including name, category, language, and content. Submit for WhatsApp approval.',
    category: 'Templates',
    keywords: ['template', 'create', 'message', 'approval', 'whatsapp']
  },
  {
    id: '3',
    question: 'Why can\'t I see the Send Message page?',
    answer: 'You need to: 1) Connect your WhatsApp Business Account in Settings, 2) Create and get at least one template approved. Once both are done, you can access Send Message.',
    category: 'Troubleshooting',
    keywords: ['send', 'message', 'not', 'showing', 'access', 'permission']
  },
  {
    id: '4',
    question: 'How long does template approval take?',
    answer: 'WhatsApp typically reviews templates within 24-48 hours. You can check the status in the Templates page.',
    category: 'Templates',
    keywords: ['template', 'approval', 'time', 'review', 'status']
  },
  {
    id: '5',
    question: 'How do I send a broadcast message?',
    answer: 'Go to Broadcasts page, click "Create Broadcast", select your approved template, choose recipients from contacts or segments, and schedule or send immediately.',
    category: 'Broadcasts',
    keywords: ['broadcast', 'send', 'bulk', 'message', 'campaign']
  },
  {
    id: '6',
    question: 'What is a segment and how do I create one?',
    answer: 'Segments are groups of contacts based on filters. Go to Segments page, click "Create Segment", define your filters (tags, attributes, etc.), and save.',
    category: 'Contacts',
    keywords: ['segment', 'filter', 'group', 'contacts', 'organize']
  },
  {
    id: '7',
    question: 'How do I import contacts?',
    answer: 'Go to Contacts page, click "Import Contacts", download the CSV template, fill it with your contacts data, and upload the file.',
    category: 'Contacts',
    keywords: ['import', 'contacts', 'csv', 'upload', 'bulk']
  },
  {
    id: '8',
    question: 'How do I set up automation workflows?',
    answer: 'Navigate to Automations page, click "Create Automation", choose a trigger (new contact, keyword, etc.), add actions (send message, add tag, etc.), and activate.',
    category: 'Automation',
    keywords: ['automation', 'workflow', 'trigger', 'action', 'bot']
  },
  {
    id: '9',
    question: 'What are the subscription plans?',
    answer: 'We offer multiple plans: Free (limited features), Starter, Professional, and Enterprise. Visit the Plans page or contact support for detailed pricing.',
    category: 'Billing',
    keywords: ['plan', 'pricing', 'subscription', 'billing', 'upgrade']
  },
  {
    id: '10',
    question: 'How do I view analytics and reports?',
    answer: 'Go to Analytics page to view message delivery rates, engagement metrics, campaign performance, and contact growth statistics.',
    category: 'Analytics',
    keywords: ['analytics', 'report', 'stats', 'metrics', 'performance']
  }
];

export default function HelpBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFaqs, setFilteredFaqs] = useState(faqs);
  const [isCapturingEmail, setIsCapturingEmail] = useState(false);
  const [isCapturingName, setIsCapturingName] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on login/auth pages
  const excludedPaths = ['/login', '/signup', '/auth', '/forgot-password'];
  const shouldShow = !excludedPaths.some(path => pathname?.startsWith(path));

  useEffect(() => {
    // Get user info from localStorage or API
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          // Logged in user - parse and set all details
          const userData = JSON.parse(storedUser);
          const name = userData.name || userData.email?.split('@')[0] || "";
          const email = userData.email || "";
          const id = userData.id || userData._id || userData.user_id || "";
          const compId = userData.company_id || userData.companyId || "";
          
          setUserName(name);
          setUserEmail(email);
          setUserId(id);
          setCompanyId(compId);
          
          logDebug('Logged in user detected:', { name, email, id, compId });
          
          // Load chat history from localStorage
          loadChatHistory(id || email);
        } else {
          // Guest user - check if they provided details before
          const guestEmail = localStorage.getItem('guest_email');
          const guestName = localStorage.getItem('guest_name');
          
          if (guestEmail) {
            setUserEmail(guestEmail);
            setUserName(guestName || guestEmail.split('@')[0]);
            setUserId(guestEmail); // Use email as userId for guests
            
            // Load chat history for guest
            loadChatHistory(guestEmail);
          }
        }
      } catch (e) {
        console.error('Error fetching user info:', e);
      }
    };
    
    fetchUserInfo();
    
    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'help_chat_messages') {
        const messages = e.newValue ? JSON.parse(e.newValue) : [];
        setChatMessages(messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadChatHistory = (identifier: string) => {
    try {
      const storageKey = `help_chat_${identifier}`;
      const savedMessages = localStorage.getItem(storageKey);
      
      if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        setChatMessages(messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (e) {
      console.error('Error loading chat history:', e);
    }
  };

  const saveChatHistory = (messages: ChatMessage[], identifier: string) => {
    try {
      const storageKey = `help_chat_${identifier}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
      
      // Also save to a common key for cross-tab sync
      localStorage.setItem('help_chat_messages', JSON.stringify(messages));
      
      // Trigger storage event manually for same tab
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'help_chat_messages',
        newValue: JSON.stringify(messages)
      }));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  };

  useEffect(() => {
    // Auto-scroll chat to bottom
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    // Filter FAQs based on search query using AI-like matching
    if (searchQuery.trim() === '') {
      setFilteredFaqs(faqs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = faqs.filter(faq => {
        // Check if query matches question, answer, or keywords
        return (
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query) ||
          faq.keywords.some(keyword => keyword.includes(query)) ||
          // Fuzzy matching - check if any word in query matches
          query.split(' ').some(word => 
            faq.question.toLowerCase().includes(word) ||
            faq.answer.toLowerCase().includes(word) ||
            faq.keywords.some(k => k.includes(word))
          )
        );
      });
      setFilteredFaqs(filtered);
    }
  }, [searchQuery]);

  const sendMessageToGemini = async (message: string) => {
    setIsTyping(true);
    
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyA3p-ZqNqHA5mGaPLhWyBY9c9u-mCUfd_s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are Stitchbyte AI Assistant, a helpful support bot for Stitchbyte - an advanced WhatsApp Business Automation Platform. You were built and developed by Stitchbyte team, not Google or Gemini.

About Stitchbyte:
- WhatsApp Business API automation platform
- Features: Message templates, broadcasts, automation workflows, contact management, analytics
- Users need to: 1) Connect WhatsApp Business Account in Settings, 2) Create and approve templates, 3) Then they can send messages
- Main pages: Dashboard, Send Message, Templates, Contacts, Segments, Broadcasts, Automations, Analytics, Settings
- Template approval takes 24-48 hours from WhatsApp

Common Issues & Solutions:
- Can't see Send Message: Need to connect WABA in Settings AND have approved templates
- Create template: Go to Templates page → Create Template → Fill details → Submit for approval
- Import contacts: Contacts page → Import Contacts → Download CSV template → Upload
- Setup automation: Automations page → Create Automation → Choose trigger → Add actions

User's question: ${message}

Provide a helpful, concise answer. If the user needs to navigate somewhere, include specific page names. Be friendly and represent Stitchbyte brand.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      });

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help! Could you please rephrase your question?";
      
      // Parse response for navigation buttons
      const buttons = extractNavigationButtons(aiResponse);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        buttons
      };
      
      setChatMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        // Save to localStorage
        saveChatHistory(newMessages, userId || userEmail);
        return newMessages;
      });
      
      // Save to database
      saveChatToDatabase(message, aiResponse);
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again or contact support at support@stitchbyte.com",
        timestamp: new Date()
      };
      setChatMessages(prev => {
        const newMessages = [...prev, errorMessage];
        saveChatHistory(newMessages, userId || userEmail);
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const extractNavigationButtons = (text: string): { label: string; route: string }[] => {
    const buttons: { label: string; route: string }[] = [];
    const routes: { [key: string]: string } = {
      'settings': '/settings',
      'templates': '/templates',
      'send message': '/send-message',
      'contacts': '/contacts',
      'segments': '/segments',
      'broadcasts': '/broadcasts',
      'automations': '/automations',
      'analytics': '/analytics',
      'dashboard': '/dashboard'
    };
    
    Object.entries(routes).forEach(([keyword, route]) => {
      if (text.toLowerCase().includes(keyword)) {
        const label = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!buttons.find(b => b.route === route)) {
          buttons.push({ label: `Go to ${label}`, route });
        }
      }
    });
    
    return buttons.slice(0, 2); // Max 2 buttons
  };

  const saveChatToDatabase = async (userMessage: string, aiResponse: string) => {
    try {
      await fetch(`${getApiBaseUrl()}/support/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify({
          user_id: userId,
          company_id: companyId,
          user_email: userEmail,
          user_name: userName,
          user_message: userMessage,
          ai_response: aiResponse,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    // Handle email capture
    if (isCapturingEmail) {
      const email = currentMessage.trim();
      if (email.includes('@')) {
        localStorage.setItem('guest_email', email);
        setUserEmail(email);
        setUserId(email);
        setIsCapturingEmail(false);
        setIsCapturingName(true);
        
        const userMsg: ChatMessage = {
          role: 'user',
          content: email,
          timestamp: new Date()
        };
        
        const botMsg: ChatMessage = {
          role: 'assistant',
          content: "Great! And what's your name?",
          timestamp: new Date()
        };
        
        setChatMessages(prev => {
          const newMessages = [...prev, userMsg, botMsg];
          saveChatHistory(newMessages, email);
          return newMessages;
        });
        setCurrentMessage("");
        return;
      } else {
        const botMsg: ChatMessage = {
          role: 'assistant',
          content: "Please enter a valid email address.",
          timestamp: new Date()
        };
        setChatMessages(prev => {
          const newMessages = [...prev, botMsg];
          saveChatHistory(newMessages, userEmail || 'guest');
          return newMessages;
        });
        setCurrentMessage("");
        return;
      }
    }
    
    // Handle name capture
    if (isCapturingName) {
      const name = currentMessage.trim();
      localStorage.setItem('guest_name', name);
      setUserName(name);
      setIsCapturingName(false);
      
      const userMsg: ChatMessage = {
        role: 'user',
        content: name,
        timestamp: new Date()
      };
      
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: `Nice to meet you, ${name}! 👋 How can I help you today?`,
        timestamp: new Date()
      };
      
      setChatMessages(prev => {
        const newMessages = [...prev, userMsg, botMsg];
        saveChatHistory(newMessages, userEmail || userId);
        return newMessages;
      });
      setCurrentMessage("");
      return;
    }
    
    // Check if guest user needs to provide email (only if not logged in)
    if (!userId && !userEmail) {
      const welcomeMsg: ChatMessage = {
        role: 'assistant',
        content: "Hi! To help you better, please provide your email address so we can save our conversation and follow up if needed.",
        timestamp: new Date()
      };
      setChatMessages([welcomeMsg]);
      saveChatHistory([welcomeMsg], 'guest');
      setIsCapturingEmail(true);
      return;
    }
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => {
      const newMessages = [...prev, userMessage];
      saveChatHistory(newMessages, userId || userEmail);
      return newMessages;
    });
    setCurrentMessage("");
    
    sendMessageToGemini(currentMessage);
  };

  const handleQuickStart = (type: 'question' | 'message') => {
    setActiveTab('messages');
    
    if (type === 'question') {
      const welcomeMsg: ChatMessage = {
        role: 'assistant',
        content: `Hi ${userName || 'there'}! 👋 I'm your Stitchbyte AI Assistant. I'm here to help you with anything related to WhatsApp Business automation. What would you like to know?`,
        timestamp: new Date()
      };
      setChatMessages([welcomeMsg]);
    } else {
      const welcomeMsg: ChatMessage = {
        role: 'assistant',
        content: `Hi ${userName || 'there'}! I can help you start sending messages. First, make sure you've:\n\n1. Connected your WhatsApp Business Account (Settings)\n2. Created and got approval for at least one template (Templates page)\n\nHave you completed these steps?`,
        timestamp: new Date(),
        buttons: [
          { label: 'Go to Settings', route: '/settings' },
          { label: 'Go to Templates', route: '/templates' }
        ]
      };
      setChatMessages([welcomeMsg]);
    }
  };

  if (!shouldShow) return null;

  const renderHomeTab = () => (
    <div className="h-full flex flex-col pt-24 pb-6 px-6 overflow-y-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Hi {userName || 'there'} 👋
        </h1>
        <p className="text-xl text-gray-700 font-medium">
          Explore Docs, News or Chat with us
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-3 mb-6">
        <button 
          onClick={() => handleQuickStart('question')}
          className="w-full bg-white rounded-2xl p-4 hover:shadow-lg transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Ask a question</h3>
              <p className="text-sm text-gray-600">AI Agent and team can help</p>
            </div>
            <svg className="w-8 h-8 text-gray-700 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('help')}
          className="w-full bg-white rounded-2xl p-4 hover:shadow-lg transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Search for help</h3>
            </div>
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </button>
      </div>

      {/* News Section */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop" 
            alt="News"
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
              New
            </span>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Latest updates and features
            </h3>
            <p className="text-xs text-gray-600">
              Check out our newest features and improvements
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesTab = () => (
    <div className="h-full flex flex-col pt-20 pb-6">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-600">Start a conversation with our AI assistant</p>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-3`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.buttons.map((btn, btnIdx) => (
                        <button
                          key={btnIdx}
                          onClick={() => {
                            router.push(btn.route);
                            setIsOpen(false);
                          }}
                          className="w-full bg-white text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const renderHelpTab = () => (
    <div className="h-full flex flex-col pt-20 pb-6">
      {/* Search Bar */}
      <div className="px-6 mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* FAQs */}
      <div className="flex-1 overflow-y-auto px-6">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No FAQs found matching your search</p>
            <button
              onClick={() => {
                setActiveTab('messages');
                handleQuickStart('question');
              }}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Ask our AI assistant instead
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <details key={faq.id} className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow group">
                <summary className="cursor-pointer font-semibold text-gray-900 flex justify-between items-center">
                  <span>{faq.question}</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-600">{faq.answer}</p>
                <span className="inline-block mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">{faq.category}</span>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderNewsTab = () => (
    <div className="h-full flex flex-col pt-20 pb-6 overflow-y-auto px-6">
      <div className="space-y-4">
        <div className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img 
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop" 
            alt="News"
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
              New
            </span>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Introducing Gemini 2.0 AI Assistant
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Our new AI-powered support assistant is here to help you 24/7 with all your WhatsApp automation needs.
            </p>
            <p className="text-xs text-gray-500">2 days ago</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop" 
            alt="News"
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              New Analytics Dashboard
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get deeper insights into your message performance with our enhanced analytics dashboard.
            </p>
            <p className="text-xs text-gray-500">1 week ago</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop" 
            alt="News"
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Advanced Automation Workflows
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Create complex automation workflows with our new drag-and-drop builder.
            </p>
            <p className="text-xs text-gray-500">2 weeks ago</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 z-[9998]"
          />
        )}
      </AnimatePresence>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed bottom-24 right-8 w-[400px] h-[600px] bg-gradient-to-br from-green-100 to-green-300 rounded-3xl shadow-2xl z-[9999] overflow-hidden flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/30 hover:bg-white/50 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Avatar Group */}
            <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg">
                S
              </div>
              <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg">
                B
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'home' && renderHomeTab()}
              {activeTab === 'messages' && renderMessagesTab()}
              {activeTab === 'help' && renderHelpTab()}
              {activeTab === 'news' && renderNewsTab()}
            </div>

            {/* Bottom Navigation */}
            <div className="bg-white rounded-t-2xl shadow-lg p-2">
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setActiveTab('home')}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl transition-colors ${
                    activeTab === 'home' ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <svg className={`w-6 h-6 mb-1 ${activeTab === 'home' ? 'text-green-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className={`text-xs ${activeTab === 'home' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Home</span>
                </button>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl transition-colors ${
                    activeTab === 'messages' ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <svg className={`w-6 h-6 mb-1 ${activeTab === 'messages' ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className={`text-xs ${activeTab === 'messages' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Messages</span>
                </button>
                <button 
                  onClick={() => setActiveTab('help')}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl transition-colors ${
                    activeTab === 'help' ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <svg className={`w-6 h-6 mb-1 ${activeTab === 'help' ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-xs ${activeTab === 'help' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>Help</span>
                </button>
                <button 
                  onClick={() => setActiveTab('news')}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl transition-colors ${
                    activeTab === 'news' ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <svg className={`w-6 h-6 mb-1 ${activeTab === 'news' ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span className={`text-xs ${activeTab === 'news' ? 'font-semibold text-green-600' : 'text-gray-500'}`}>News</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bubble Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#25D366] rounded-full shadow-2xl flex items-center justify-center z-[9999] hover:bg-[#20BD5A] transition-colors group"
        aria-label="Help & Support"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
