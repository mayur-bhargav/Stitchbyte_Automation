"use client";
import React, {useState, useEffect, cloneElement} from "react";
import { motion, AnimatePresence, easeInOut, easeOut } from "framer-motion";
import { 
    LuMessageSquare, LuFileText, LuUsers, LuMessageCircle, LuRocket, LuZap, 
    LuMegaphone, LuPhone, LuSparkles, LuSend, LuX 
} from "react-icons/lu";
import { useRouter } from "next/navigation";

interface QuickAction {
    title: string;
    route: string | null;
    icon: React.ReactElement;
    color: string;
    onClick?: () => void;
}

interface AiSupportChatProps {
    onClose: () => void;
}

interface Message {
    role: 'user' | 'ai';
    text: string;
}

// --- Mock Components and Hooks for Self-Contained Demo ---

const useUser = () => ({ isAuthenticated: true });

// --- ✨ Gemini AI Support Chat Component (TSX) ---

const AiSupportChat: React.FC<AiSupportChatProps> = ({ onClose }) => {
    const [conversation, setConversation] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const chatContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversation, isLoading]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMessage: Message = { role: 'user', text: input };
        setConversation(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        const systemPrompt = "You are 'Stitch,' a friendly and highly capable AI support agent for Stitchbyte. Your tone is empathetic, professional, and slightly enthusiastic. You are an expert on the Stitchbyte platform. Keep your answers concise and helpful. If a user asks about something you don't know, politely state that it's outside your expertise but you're happy to help with any Stitchbyte-related questions.";
        const userQuery = input;
        const apiKey = "AIzaSyAQYZH3OOGzJ0TrIjTlIV_6aKvZRYYAvjQ"; // Replace with your actual key or environment variable
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.statusText}`);

            const result = await response.json();
            const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (aiText) {
                setConversation(prev => [...prev, { role: 'ai', text: aiText }]);
            } else {
                throw new Error("No content received from API.");
            }
        } catch (e) {
            console.error("AI Support Error:", e);
            setConversation(prev => [...prev, { role: 'ai', text: "I'm sorry, but I'm having a little trouble connecting right now. Please try again in a moment." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            // --- CHANGE: Reduced height from h-[28rem] to h-[26rem] ---
            className="absolute bottom-20 right-0 w-[24rem] h-[26rem] flex flex-col bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl"
        >
            <div className="flex-shrink-0 p-4 border-b border-white/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 shadow-lg">
                        <LuSparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">AI Support</h2>
                        <p className="text-xs text-gray-600">Powered by Gemini</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-white/50 hover:text-gray-800 transition-colors">
                    <LuX size={20} />
                </button>
            </div>

            <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                {conversation.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-700 flex items-center justify-center"><LuSparkles className="w-5 h-5 text-white"/></div>}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white/80 text-gray-800 rounded-bl-none'}`}>
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                         <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-700 flex items-center justify-center"><LuSparkles className="w-5 h-5 text-white"/></div>
                         <div className="p-3 rounded-2xl bg-white/80 text-gray-800 rounded-bl-none">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-0"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                            </div>
                         </div>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-white/30">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Ask about billing, features..."
                        className="flex-grow p-3 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="p-3 bg-slate-800 text-white font-semibold rounded-lg shadow-md hover:bg-slate-900 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all"
                    >
                        <LuSend size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// --- Main QuickActions Component (TSX) ---

// --- Main QuickActions Component (TSX) ---

export default function QuickActions() {
  const router = useRouter();
  const { isAuthenticated } = useUser();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showSupport, setShowSupport] = useState<boolean>(false);

  const quickActions: QuickAction[] = [
    { title: "Send Message", route: "/send-message", icon: <LuMessageSquare />, color: "from-teal-400 to-teal-600" },
    { title: "Templates", route: "/templates", icon: <LuFileText />, color: "from-purple-400 to-purple-600" },
    { title: "Contacts", route: "/contacts", icon: <LuUsers />, color: "from-emerald-400 to-emerald-600" },
    { title: "Live Chat", route: "/chats", icon: <LuMessageCircle />, color: "from-blue-400 to-blue-600" },
    { title: "Campaigns", route: "/campaigns", icon: <LuRocket />, color: "from-red-400 to-red-600" },
    { title: "Automations", route: "/automations", icon: <LuZap />, color: "from-orange-400 to-orange-600" },
    { title: "Broadcasts", route: "/broadcasts", icon: <LuMegaphone />, color: "from-pink-400 to-pink-600" },
    { title: "AI Support", route: null, icon: <LuPhone />, color: "from-gray-600 to-gray-800", onClick: () => { setIsExpanded(false); setShowSupport(true); } }
  ];

  if (!isAuthenticated) return null;

  const containerVariants = {
    closed: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2, ease: easeOut } },
    open: {
      opacity: 1, y: 0, scale: 1,
      transition: {
        duration: 0.3,
        ease: easeInOut,
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    closed: { y: 10, opacity: 0 },
    open: { y: 0, opacity: 1 },
  };

  const handleActionClick = (action: QuickAction) => {
    if (action.route) {
        router.push(action.route);
    } else if (action.onClick) {
        action.onClick();
    }
  };
  
  const handleButtonClick = () => {
      if(showSupport) {
          setShowSupport(false);
      } else {
          setIsExpanded(v => !v);
      }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="quick-actions-menu"
              initial="closed"
              animate="open"
              exit="closed"
              variants={containerVariants}
              className="absolute bottom-20 right-0 w-[17rem] p-1.5 bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl"
            >
              <h3 className="font-bold text-gray-800 text-base mb-2 px-1.5">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-0.5">
                {quickActions.map((action) => (
                  <motion.div key={action.title} variants={itemVariants}>
                    <button
                      onClick={() => handleActionClick(action)}
                      // --- CHANGE: Removed 'aspect-square' and added 'py-3' for less vertical space ---
                      className="flex flex-col items-center justify-center gap-1 w-full py-3 rounded-xl transition-all duration-200 hover:bg-white/60"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br ${action.color} shadow-lg`}>
                        {cloneElement(action.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 text-white' })}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{action.title}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {showSupport && <AiSupportChat key="ai-support-chat" onClose={() => setShowSupport(false)} />}
        </AnimatePresence>

        <motion.button
          onClick={handleButtonClick}
          className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-2xl transition-all duration-300 flex items-center justify-center relative focus:outline-none focus:ring-4 focus:ring-slate-500/50"
          aria-label="Toggle Quick Actions"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={isExpanded || showSupport ? "close" : "open"}
              initial={{ rotate: -45, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 45, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded || showSupport ? <LuX className="w-7 h-7" /> : <LuZap className="w-7 h-7" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
    </div>
  );
}