"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChatContext } from "../../contexts/ChatContext";
import { useRealTimeChat } from "../../hooks/useRealTimeChat";
import { motion, AnimatePresence } from "framer-motion";
import { SERVER_URI } from "@/config/server";

// Helper components for better code structure
// (These are defined below the main component)

// --- TYPE DEFINITIONS ---
type Message = {
  id: string;
  phone: string;
  message: string;
  message_type: 'text' | 'image' | 'video' | 'document' | 'template';
  direction: 'outgoing' | 'incoming';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  template_name?: string;
  media_url?: string;
  media_filename?: string;
  reply_to?: string;
};

type Contact = {
  phone: string;
  name?: string;
  profile_pic?: string;
  is_online?: boolean;
  last_seen?: string;
  is_typing?: boolean;
};

// --- MAIN COMPONENT ---
export default function ChatConversation() {
  const params = useParams();
  const router = useRouter();
  const phone = decodeURIComponent(params.phone as string);
  const { markAsRead } = useChatContext();
  
  // All your state and logic hooks are preserved
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- DATA FETCHING & REAL-TIME LOGIC (UNCHANGED) ---
  const loadMessages = useCallback(async () => {
    // This logic remains the same
    try {
      const response = await fetch(`${SERVER_URI}/chat/messages/${encodeURIComponent(phone)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      // console.log('Loading messages for', phone, ':', data.messages?.length || 0, 'messages');
      setMessages(data.messages || []);
    } catch (error) { console.error("Failed to load messages:", error); } 
    finally { setLoading(false); }
  }, [phone]);

  const loadContact = useCallback(async () => {
    // This logic remains the same
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${SERVER_URI}/chat/contact/${encodeURIComponent(phone)}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await response.json();
      setContact(data.contact);
    } catch (error) { console.error("Failed to load contact:", error); }
  }, [phone]);

  useRealTimeChat({
    pollingInterval: 3000,
    onNewMessage: (msgContact) => {
      // console.log('Real-time new message detected for:', msgContact.phone, 'current phone:', phone);
      if (msgContact.phone === phone) {
        // console.log('Reloading messages for current chat');
        loadMessages();
      }
    }
  });

  useEffect(() => {
    markAsRead(phone);
    loadMessages();
    loadContact();
  }, [phone, markAsRead, loadMessages, loadContact]);

  useEffect(() => {
    const interval = setInterval(() => { 
      // console.log('Auto-refreshing messages every 10 seconds...');
      loadMessages(); 
    }, 10000); // Check for new messages every 10 seconds
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => { loadContact(); }, 15000); // Check for contact status updates
    return () => clearInterval(interval);
  }, [loadContact]);

  // --- UI & INTERACTION LOGIC ---
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };
  
  useEffect(() => {
    if (messages.length > 0) {
      // console.log('Messages updated, scrolling to bottom. Total messages:', messages.length);
      scrollToBottom('auto');
    }
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 200;
    setShowScrollButton(!isAtBottom);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  const playNotificationSound = () => {
    audioRef.current?.play().catch(() => {});
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !mediaFile) return;
    setSending(true);

    const endpoint = mediaFile ? `${SERVER_URI}/chat/send-media` : `${SERVER_URI}/chat/send-text`;
    let body: any;
    const headers: any = {};
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
    
    if (mediaFile) {
        const formData = new FormData();
        formData.append('phone', phone);
        formData.append('message', newMessage || '');
        formData.append('media_file', mediaFile);
        if (replyTo) formData.append('reply_to', replyTo.id);
        body = formData;
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ phone, message: newMessage, reply_to: replyTo?.id });
    }

    try {
        const response = await fetch(endpoint, { method: "POST", headers, body });
        // console.log('Send message response:', response.status, response.statusText);
        if (response.ok) {
            const responseData = await response.json();
            // console.log('Message sent successfully:', responseData);
            setNewMessage("");
            setMediaFile(null);
            setReplyTo(null);
            // console.log('Reloading messages after send...');
            loadMessages();
            playNotificationSound();
            setTimeout(() => scrollToBottom('smooth'), 100);
        } else {
            const errorData = await response.text();
            console.error('Send message failed:', response.status, errorData);
            showNotification(`Failed to send message: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Network error sending message:', error);
        showNotification('Network error: Failed to send message', 'error');
    } finally {
        setSending(false);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = new Date(message.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});
  
  const sortedDateKeys = Object.keys(groupedMessages).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center -m-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 -m-8 font-sans">
      <ChatHeader contact={contact} phone={phone} onBack={() => router.back()} />

      <div onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-1 relative">
          <AnimatePresence>
            {sortedDateKeys.length > 0 ? (
              sortedDateKeys.map(date => (
                <div key={date}>
                  <DateSeparator date={date} />
                  {groupedMessages[date].map((message) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message}
                      allMessages={messages}
                      onReply={() => setReplyTo(message)} 
                    />
                  ))}
                </div>
              ))
            ) : (
              <EmptyChat />
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
      </div>

      <MessageComposer
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSend={handleSend}
        sending={sending}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        mediaFile={mediaFile}
        setMediaFile={setMediaFile}
      />

      {showScrollButton && <ScrollToBottomButton onClick={() => scrollToBottom('smooth')} />}
      
      {notification && <Notification type={notification.type} message={notification.message} />}

      <audio ref={audioRef} src="/notification.wav" preload="auto" />
    </div>
  );
}

// --- SUB-COMPONENTS ---

const ChatHeader = ({ contact, phone, onBack }: { contact: Contact | null; phone: string; onBack: () => void; }) => (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="flex items-center justify-between p-3 md:p-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                        {contact?.profile_pic ? (
                            <img src={contact.profile_pic} alt={contact.name || phone} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-semibold">
                                {(contact?.name || phone).charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {contact?.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                </div>
                <div>
                    <h2 className="font-semibold text-slate-900">{contact?.name || phone}</h2>
                    <p className="text-xs text-slate-500">
                        {contact?.is_typing ? <span className="text-indigo-600 font-medium">typing...</span> :
                         contact?.is_online ? "Online" :
                         contact?.last_seen ? `Last seen at ${new Date(contact.last_seen).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}` : "Offline"}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg></button>
            </div>
        </div>
    </div>
);

const MessageBubble = ({ message, allMessages, onReply }: { message: Message; allMessages: Message[]; onReply: () => void; }) => {
    const isOutgoing = message.direction === 'outgoing';
    const originalMessage = message.reply_to ? allMessages.find(m => m.id === message.reply_to) : null;

    const getStatusIcon = (status: string) => {
        const tick = <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg>;
        switch (status) {
            case 'sent': return <div className="text-slate-400">{tick}</div>;
            case 'delivered': return <div className="flex text-slate-400">{tick}{tick}</div>;
            case 'read': return <div className="flex text-blue-500">{tick}{tick}</div>;
            case 'failed': return <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0l-.35-3.507z"/></svg>;
            default: return null;
        }
    };
    
    return (
        <div className={`flex items-end gap-2 my-1 group ${isOutgoing ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-sm md:max-w-md p-3 rounded-2xl ${
                isOutgoing 
                ? 'bg-indigo-600 text-white rounded-br-lg' 
                : 'bg-white text-slate-800 rounded-bl-lg border border-slate-200'
            }`}>
                {originalMessage && (
                    <div className={`p-2 mb-2 rounded-lg border-l-2 ${isOutgoing ? 'bg-indigo-500/80 border-indigo-300' : 'bg-slate-100 border-slate-300'}`}>
                        <p className={`text-xs font-semibold ${isOutgoing ? 'text-indigo-100' : 'text-slate-600'}`}>
                            {originalMessage.direction === 'outgoing' ? 'You' : originalMessage.phone}
                        </p>
                        <p className="text-sm opacity-90 line-clamp-2">{originalMessage.message}</p>
                    </div>
                )}

                {message.media_url && message.message_type === 'image' && (
                    <img src={message.media_url} alt="attachment" className="rounded-lg mb-2 max-w-full h-auto" />
                )}

                <p className="text-[15px] whitespace-pre-wrap break-words">{message.message}</p>
                <div className={`flex items-center gap-1.5 mt-1.5 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs ${isOutgoing ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
                    </span>
                    {isOutgoing && getStatusIcon(message.status)}
                </div>
            </div>
            {!isOutgoing && (
                <button onClick={onReply} className="mb-1 p-1.5 rounded-full text-slate-400 bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                </button>
            )}
        </div>
    );
};

const MessageComposer = ({ newMessage, setNewMessage, onSend, sending, replyTo, onCancelReply, mediaFile, setMediaFile }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { // Auto-resize textarea
        if(textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [newMessage]);

    return (
        <div className="sticky bottom-0 z-20 bg-white/80 backdrop-blur-lg border-t border-slate-200 pt-3 pb-4 px-4">
            <AnimatePresence>
                {replyTo && <ReplyPreview message={replyTo} onCancel={onCancelReply} />}
                {mediaFile && <MediaPreview file={mediaFile} onCancel={() => setMediaFile(null)} />}
            </AnimatePresence>
            <div className="flex items-end gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 resize-none border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white max-h-32"
                    disabled={sending}
                />
                <button onClick={onSend} disabled={(!newMessage.trim() && !mediaFile) || sending} className="w-11 h-11 flex items-center justify-center rounded-full bg-indigo-600 text-white transition-all duration-200 disabled:bg-slate-300 disabled:scale-95 hover:bg-indigo-700">
                    {sending ? 
                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> :
                        <svg className="w-6 h-6 -mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    }
                </button>
                <input ref={fileInputRef} type="file" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} className="hidden" />
            </div>
        </div>
    );
};

const DateSeparator = ({ date }: { date: string }) => (
    <div className="flex justify-center my-4">
        <span className="bg-white/80 backdrop-blur-sm text-xs font-semibold text-slate-500 px-3 py-1 rounded-full border border-slate-200">{date}</span>
    </div>
);

const ReplyPreview = ({ message, onCancel }: { message: Message; onCancel: () => void; }) => (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="p-2 mb-2 bg-slate-100 rounded-lg border-l-4 border-indigo-500 flex justify-between items-center">
        <div>
            <p className="text-sm font-semibold text-indigo-600">Replying to {message.direction === 'outgoing' ? 'yourself' : message.phone}</p>
            <p className="text-sm text-slate-600 line-clamp-1">{message.message}</p>
        </div>
        <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-slate-200"><svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
    </motion.div>
);

const MediaPreview = ({ file, onCancel }: { file: File; onCancel: () => void; }) => (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="p-2 mb-2 bg-slate-100 rounded-lg border-l-4 border-green-500 flex justify-between items-center">
        <div className="flex items-center gap-2">
            {file.type.startsWith('image/') ? 
                <img src={URL.createObjectURL(file)} alt="preview" className="w-10 h-10 rounded object-cover" /> :
                <div className="w-10 h-10 rounded bg-green-200 flex items-center justify-center"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
            }
            <div>
                <p className="text-sm font-semibold text-green-700">Attaching file</p>
                <p className="text-sm text-slate-600 line-clamp-1">{file.name}</p>
            </div>
        </div>
        <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-slate-200"><svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
    </motion.div>
);

const EmptyChat = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No messages yet</h3>
        <p className="max-w-xs mt-1">Start the conversation by sending your first message below.</p>
    </div>
);

const ScrollToBottomButton = ({ onClick }: { onClick: () => void; }) => (
    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-24 right-6 z-10">
        <button onClick={onClick} className="p-3 rounded-full shadow-lg bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:bg-slate-50 hover:scale-110 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </button>
    </motion.div>
);

const Notification = ({ message, type }: { message: string, type: 'success' | 'error' }) => (
    <motion.div 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white font-medium shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
    >
        {message}
    </motion.div>
);
