"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { getApiBaseUrl } from '../config/backend';
import { SERVER_URI } from '@/config/server';
import { useChatContext } from "../contexts/ChatContext";
import { useRealTimeChat } from "../hooks/useRealTimeChat";
import { motion, AnimatePresence } from "framer-motion";

type Contact = {
  phone: string;
  name?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  profile_pic?: string;
  is_online?: boolean;
  last_seen?: string;
  is_typing?: boolean;
};

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

type TabType = 'ACTIVE' | 'REQUESTING' | 'INTERVENED';

export default function ChatContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const { unreadCounts, initializeCounts, markAsRead } = useChatContext();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contactListRef = useRef<HTMLDivElement>(null);
  const contactListScrollPosition = useRef<number>(0);

  const fetchContacts = useCallback(async () => {
    // Save current scroll position before fetching
    if (contactListRef.current) {
      contactListScrollPosition.current = contactListRef.current.scrollTop;
    }
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/contacts`);
      const data = await response.json();
      
      const contactList = data.contacts || [];
      setContacts(contactList);
      initializeCounts(contactList);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [initializeCounts]);

  const loadMessages = useCallback(async (phone: string) => {
    if (!phone) return;
    setMessagesLoading(true);
    try {
      const response = await fetch(`${SERVER_URI}/chat/messages/${encodeURIComponent(phone)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const loadContact = useCallback(async (phone: string) => {
    if (!phone) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${SERVER_URI}/chat/contact/${encodeURIComponent(phone)}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await response.json();
      setSelectedContact(data.contact);
    } catch (error) {
      console.error("Failed to load contact:", error);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    
    const interval = setInterval(fetchContacts, 30000);
    return () => clearInterval(interval);
  }, [fetchContacts]);

  // Restore scroll position after contacts update
  useEffect(() => {
    if (contactListRef.current && contactListScrollPosition.current > 0) {
      contactListRef.current.scrollTop = contactListScrollPosition.current;
    }
  }, [contacts]);

  useEffect(() => {
    if (selectedPhone) {
      markAsRead(selectedPhone);
      loadMessages(selectedPhone);
      loadContact(selectedPhone);
      
      // Auto-scroll to bottom when opening a chat
      setTimeout(() => scrollToBottom('auto'), 300);
      
      const interval = setInterval(() => {
        loadMessages(selectedPhone);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [selectedPhone, markAsRead, loadMessages, loadContact]);

  useEffect(() => {
    if (selectedPhone) {
      const interval = setInterval(() => {
        loadContact(selectedPhone);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [selectedPhone, loadContact]);

  useEffect(() => {
    if (messages.length > 0 && selectedPhone) {
      // Only auto-scroll if user is near bottom
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 200;
        if (isNearBottom) {
          scrollToBottom('smooth');
        }
      }
    }
  }, [messages.length, selectedPhone]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const handleNewMessage = useCallback((msgContact: Contact) => {
    if (msgContact.phone === selectedPhone) {
      loadMessages(selectedPhone);
    }
    // Fetch contacts without affecting scroll position
    fetchContacts();
  }, [fetchContacts, selectedPhone, loadMessages]);

  useRealTimeChat({
    enabled: true,
    pollingInterval: 5000,
    onNewMessage: handleNewMessage
  });

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

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
    if (!selectedPhone) return;
    
    setSending(true);

    const endpoint = mediaFile ? `${SERVER_URI}/chat/send-media` : `${SERVER_URI}/chat/send-text`;
    let body: any;
    const headers: any = {};
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
    
    if (mediaFile) {
        const formData = new FormData();
        formData.append('phone', selectedPhone);
        formData.append('message', newMessage || '');
        formData.append('media_file', mediaFile);
        if (replyTo) formData.append('reply_to', replyTo.id);
        body = formData;
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ phone: selectedPhone, message: newMessage, reply_to: replyTo?.id });
    }

    try {
        const response = await fetch(endpoint, { method: "POST", headers, body });
        if (response.ok) {
            setNewMessage("");
            setMediaFile(null);
            setReplyTo(null);
            loadMessages(selectedPhone);
            playNotificationSound();
            setTimeout(() => scrollToBottom('smooth'), 100);
        } else {
            showNotification(`Failed to send message: ${response.status}`, 'error');
        }
    } catch (error) {
        showNotification('Network error: Failed to send message', 'error');
    } finally {
        setSending(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    (contact.phone && contact.phone.includes(searchQuery)) ||
    (contact.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const openChat = (phone: string) => {
    setSelectedPhone(phone);
    const contact = contacts.find(c => c.phone === phone);
    if (contact) {
      setSelectedContact(contact);
    }
  };

  const closeChat = () => {
    setSelectedPhone(null);
    setSelectedContact(null);
    setMessages([]);
    setNewMessage("");
    setMediaFile(null);
    setReplyTo(null);
    setShowCloseConfirm(false);
  };

  const handleAvatarDoubleClick = () => {
    setShowCloseConfirm(true);
  };

  const getTabCount = (tab: TabType) => {
    if (tab === 'ACTIVE') return contacts.length;
    return 0;
  };

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

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = new Date(message.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});
  
  const sortedDateKeys = Object.keys(groupedMessages).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#F8F9FA] -m-8 overflow-hidden">
      {/* Left Sidebar - Contact List - FIXED */}
      <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search name or mobile number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:border-[#2A8B8A] focus:ring-1 focus:ring-[#2A8B8A]"
            />
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Filter and Navigation Icons */}
          <div className="flex items-center gap-3 mt-3">
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#156D6C] text-white">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === 'ACTIVE' 
                  ? 'bg-[#1a7a79] border-b-2 border-white' 
                  : 'hover:bg-[#1a7a79]/50'
              }`}
            >
              ACTIVE ({getTabCount('ACTIVE')})
            </button>
            <button
              onClick={() => setActiveTab('REQUESTING')}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === 'REQUESTING' 
                  ? 'bg-[#1a7a79] border-b-2 border-white' 
                  : 'hover:bg-[#1a7a79]/50'
              }`}
            >
              REQUESTING ({getTabCount('REQUESTING')})
            </button>
            <button
              onClick={() => setActiveTab('INTERVENED')}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === 'INTERVENED' 
                  ? 'bg-[#1a7a79] border-b-2 border-white' 
                  : 'hover:bg-[#1a7a79]/50'
              }`}
            >
              INTERVENED ({getTabCount('INTERVENED')})
            </button>
          </div>
        </div>

        {/* Contact List */}
        <div ref={contactListRef} className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2A8B8A] border-t-transparent"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <div className="mb-4">
                <svg className="w-32 h-32 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-8">Seems clear !</p>
              <div className="space-y-3 w-full max-w-xs">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <svg className="w-5 h-5 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Add user attributes manually
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <svg className="w-5 h-5 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Add/Remove Tag & update attribute
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <svg className="w-5 h-5 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Send & Generate media link
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact, index) => (
                <div
                  key={contact.phone || index}
                  onClick={() => contact.phone && openChat(contact.phone)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {contact.profile_pic ? (
                          <img src={contact.profile_pic} alt={contact.name || 'Contact'} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-7 h-7 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {contact.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {contact.name || contact.phone || 'Unknown'}
                        </h3>
                        {contact.last_message_time && (
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTime(contact.last_message_time)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {contact.last_message || 'No messages yet'}
                      </p>
                    </div>
                    {(unreadCounts[contact.phone] || 0) > 0 && (
                      <span className="bg-[#2A8B8A] text-white text-xs font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {unreadCounts[contact.phone]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Conversation or Empty State */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedPhone && selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200">
              <div className="flex items-center justify-between p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedPhone(null)} 
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div 
                    className="relative cursor-pointer" 
                    onDoubleClick={handleAvatarDoubleClick}
                    title="Double-click to close chat"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                      {selectedContact?.profile_pic ? (
                        <img src={selectedContact.profile_pic} alt={selectedContact.name || selectedPhone} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#2A8B8A] text-white font-semibold">
                          {(selectedContact?.name || selectedPhone).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {selectedContact?.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{selectedContact?.name || selectedPhone}</h2>
                    <p className="text-xs text-slate-500">
                      {selectedContact?.is_typing ? (
                        <span className="text-[#2A8B8A] font-medium">typing...</span>
                      ) : selectedContact?.is_online ? (
                        "Online"
                      ) : selectedContact?.last_seen ? (
                        `Last seen at ${new Date(selectedContact.last_seen).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}`
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              id="messages-container"
              onScroll={handleScroll} 
              className="flex-1 overflow-y-auto px-4 md:px-6 py-4"
            >
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2A8B8A] border-t-transparent"></div>
                </div>
              ) : (
                <AnimatePresence>
                  {sortedDateKeys.length > 0 ? (
                    sortedDateKeys.map(date => (
                      <div key={date}>
                        {/* Date Separator */}
                        <div className="flex justify-center my-4">
                          <span className="bg-white/80 backdrop-blur-sm text-xs font-semibold text-slate-500 px-3 py-1 rounded-full border border-slate-200">
                            {date}
                          </span>
                        </div>
                        {groupedMessages[date].map((message) => {
                          const isOutgoing = message.direction === 'outgoing';
                          const originalMessage = message.reply_to ? messages.find(m => m.id === message.reply_to) : null;

                          return (
                            <div key={message.id} className={`flex items-end gap-2 my-1 group ${isOutgoing ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-sm md:max-w-md p-3 rounded-2xl ${
                                isOutgoing 
                                ? 'bg-[#2A8B8A] text-white rounded-br-lg' 
                                : 'bg-white text-slate-800 rounded-bl-lg border border-slate-200'
                              }`}>
                                {originalMessage && (
                                  <div className={`p-2 mb-2 rounded-lg border-l-2 ${
                                    isOutgoing ? 'bg-[#238080]/80 border-[#1a7a79]' : 'bg-slate-100 border-slate-300'
                                  }`}>
                                    <p className={`text-xs font-semibold ${isOutgoing ? 'text-white/90' : 'text-slate-600'}`}>
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
                                  <span className={`text-xs ${isOutgoing ? 'text-white/70' : 'text-slate-400'}`}>
                                    {new Date(message.timestamp).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
                                  </span>
                                  {isOutgoing && getStatusIcon(message.status)}
                                </div>
                              </div>
                              {!isOutgoing && (
                                <button 
                                  onClick={() => setReplyTo(message)} 
                                  className="mb-1 p-1.5 rounded-full text-slate-400 bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">No messages yet</h3>
                      <p className="max-w-xs mt-1">Start the conversation by sending your first message below.</p>
                    </div>
                  )}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} className="h-0" />
            </div>

            {/* Message Composer */}
            <div className="bg-white/80 backdrop-blur-lg border-t border-slate-200 p-4">
              <AnimatePresence>
                {replyTo && (
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    exit={{ y: 50, opacity: 0 }} 
                    className="p-2 mb-2 bg-slate-100 rounded-lg border-l-4 border-[#2A8B8A] flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2A8B8A]">
                        Replying to {replyTo.direction === 'outgoing' ? 'yourself' : replyTo.phone}
                      </p>
                      <p className="text-sm text-slate-600 line-clamp-1">{replyTo.message}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="p-1.5 rounded-full hover:bg-slate-200">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                )}
                {mediaFile && (
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    exit={{ y: 50, opacity: 0 }} 
                    className="p-2 mb-2 bg-slate-100 rounded-lg border-l-4 border-green-500 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      {mediaFile.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(mediaFile)} alt="preview" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-green-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-green-700">Attaching file</p>
                        <p className="text-sm text-slate-600 line-clamp-1">{mediaFile.name}</p>
                      </div>
                    </div>
                    <button onClick={() => setMediaFile(null)} className="p-1.5 rounded-full hover:bg-slate-200">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-end gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { 
                    if(e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      handleSend(); 
                    } 
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 resize-none border border-transparent focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:bg-white max-h-32"
                  disabled={sending}
                />
                <button 
                  onClick={handleSend} 
                  disabled={(!newMessage.trim() && !mediaFile) || sending} 
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-[#2A8B8A] text-white transition-all duration-200 disabled:bg-slate-300 disabled:scale-95 hover:bg-[#238080]"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6 -mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)} 
                  className="hidden" 
                />
              </div>
            </div>

            {showScrollButton && (
              <motion.div 
                initial={{ y: 100 }} 
                animate={{ y: 0 }} 
                exit={{ y: 100 }} 
                className="fixed bottom-32 right-6 z-10"
              >
                <button 
                  onClick={() => scrollToBottom('smooth')} 
                  className="p-3 rounded-full shadow-lg bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:bg-slate-50 hover:scale-110 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <>
            {/* Empty State - No Chat Selected */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Chat Profile</h2>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-[#FFA500] rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg text-gray-600">Select a chat to continue!</p>
              </div>
            </div>
          </>
        )}
      </div>

      {notification && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white font-medium shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </motion.div>
      )}

      {/* Close Chat Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Close Chat?</h3>
                <p className="text-sm text-gray-600">Are you sure you want to close this conversation?</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={closeChat}
                className="flex-1 px-4 py-2.5 bg-[#2A8B8A] hover:bg-[#238080] text-white rounded-lg font-medium transition-colors"
              >
                Close Chat
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <audio ref={audioRef} src="/notification.wav" preload="auto" />
    </div>
  );
}