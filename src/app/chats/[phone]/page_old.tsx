"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChatContext } from "../../contexts/ChatContext";
import { useRealTimeChat } from "../../hooks/useRealTimeChat";

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

export default function ChatConversation() {
  const params = useParams();
  const router = useRouter();
  const phone = decodeURIComponent(params.phone as string);
  const { markAsRead } = useChatContext();
  
  useRealTimeChat({
    pollingInterval: 3000,
    onNewMessage: (contact) => {
      if (contact.phone === phone) {
        loadMessages();
      }
    }
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [messagesContainerRef, setMessagesContainerRef] = useState<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    message: Message | null;
  }>({ visible: false, x: 0, y: 0, message: null });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    markAsRead(phone);
  }, [phone, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    setShowScrollButton(!isAtBottom);
  };

  const loadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/chat/messages/${encodeURIComponent(phone)}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const loadContact = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/chat/contact/${encodeURIComponent(phone)}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await response.json();
      setContact(data.contact);
    } catch (error) {
      console.error("Failed to load contact:", error);
    }
  }, [phone]);

  const loadTemplates = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:8000/templates", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      const data = await response.json();
      const approvedTemplates = (data.templates || []).filter((t: any) => 
        t.status?.toString().toUpperCase() === 'APPROVED'
      );
      setTemplates(approvedTemplates);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  }, []);

  useEffect(() => {
    console.log('Initializing chat for phone:', phone);
    loadMessages();
    loadContact();
    loadTemplates();
  }, [phone, loadMessages, loadContact, loadTemplates]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      loadContact();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadMessages, loadContact]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMessages([]);
        setEditingMessage(null);
        setShowTemplates(false);
        setShowSearch(false);
        setReplyTo(null);
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !(e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/)) {
        e.preventDefault();
        setSelectedMessages(prev => messages.map(m => m.id));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Delete' && selectedMessages.length > 0) {
        console.log('Delete key pressed for', selectedMessages.length, 'messages');
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedMessages]);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const sendTextMessage = async () => {
    if (!newMessage.trim() && !mediaFile) return;
    setSending(true);
    setIsTyping(true);
    try {
      if (mediaFile) {
        const formData = new FormData();
        formData.append('phone', phone);
        formData.append('message', newMessage || '');
        formData.append('media_file', mediaFile);
        if (replyTo) formData.append('reply_to', replyTo.id);
        const token = localStorage.getItem('token');
        const response = await fetch("http://localhost:8000/chat/send-media", {
          method: "POST",
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          body: formData,
        });
        if (response.ok) {
          setNewMessage("");
          setMediaFile(null);
          setReplyTo(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          loadMessages();
          playNotificationSound();
          showNotification('Message sent successfully!', 'success');
          setTimeout(scrollToBottom, 100);
        } else {
          const errorData = await response.text();
          console.error('Failed to send media message:', response.status, errorData);
          showNotification(`Failed to send media message: ${response.status}`, 'error');
        }
      } else {
        const token = localStorage.getItem('token');
        const response = await fetch("http://localhost:8000/chat/send-text", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({ phone, message: newMessage, reply_to: replyTo?.id }),
        });
        if (response.ok) {
          setNewMessage("");
          setReplyTo(null);
          loadMessages();
          playNotificationSound();
          showNotification('Message sent successfully!', 'success');
          setTimeout(scrollToBottom, 100);
        } else {
          const errorData = await response.text();
          console.error('Failed to send text message:', response.status, errorData);
          showNotification(`Failed to send message: ${response.status}`, 'error');
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      showNotification('Network error: Failed to send message', 'error');
    } finally {
      setSending(false);
      setIsTyping(false);
    }
  };

  const sendTemplate = async (templateName: string) => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:8000/send-message", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ phone, template: templateName, components: [] }),
      });
      if (response.ok) {
        setShowTemplates(false);
        loadMessages();
        showNotification('Template sent successfully!', 'success');
      } else {
        const errorData = await response.text();
        console.error('Failed to send template:', response.status, errorData);
        showNotification(`Failed to send template: ${response.status}`, 'error');
      }
    } catch (error) {
      console.error("Failed to send template:", error);
      showNotification('Network error: Failed to send template', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const selectMessage = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const deleteSelectedMessages = async () => {
    if (!selectedMessages.length) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedMessages.length} message(s)?`);
    if (!confirmDelete) return;
    try {
      const deletePromises = selectedMessages.map(messageId => 
        fetch(`http://localhost:8000/chat/message/${messageId}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setSelectedMessages([]);
      loadMessages();
      showNotification('Messages deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete messages:', error);
      showNotification('Failed to delete messages', 'error');
    }
  };

  const deleteMessage = async (messageId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this message?');
    if (!confirmDelete) return;
    try {
      await fetch(`http://localhost:8000/chat/message/${messageId}`, { method: 'DELETE' });
      loadMessages();
      showNotification('Message deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete message:', error);
      showNotification('Failed to delete message', 'error');
    }
  };

  const forwardMessage = async (message: Message) => {
    const phoneNumber = prompt('Enter phone number to forward to:');
    if (!phoneNumber) return;
    try {
      const response = await fetch('http://localhost:8000/chat/forward-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessageId: message.id,
          toPhone: phoneNumber,
          message: message.message,
          messageType: message.message_type
        })
      });
      if (response.ok) {
        showNotification('Message forwarded successfully', 'success');
      } else {
        throw new Error('Failed to forward message');
      }
    } catch (error) {
      console.error('Failed to forward message:', error);
      showNotification('Failed to forward message', 'error');
    }
  };

  const copyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.message).then(() => {
      showNotification('Message copied to clipboard', 'success');
    }).catch(() => {
      showNotification('Failed to copy message', 'error');
    });
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`http://localhost:8000/chat/message/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newContent })
      });
      if (response.ok) {
        setEditingMessage(null);
        loadMessages();
        showNotification('Message updated successfully', 'success');
      } else {
        throw new Error('Failed to edit message');
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      showNotification('Failed to edit message', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleMessageContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, message: null });
  };

  const filteredMessages = searchQuery 
    ? messages.filter(msg => 
        msg.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const formatTime = (timestamp: string, direction?: 'outgoing' | 'incoming') => {
    try {
      let date;
      if (direction === 'outgoing') {
        const utcDate = new Date(timestamp);
        date = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error, 'Timestamp:', timestamp);
      return 'Invalid time';
    }
  };

  const formatMessageDate = (timestamp: string, direction?: 'outgoing' | 'incoming') => {
    try {
      let date;
      if (direction === 'outgoing') {
        const utcDate = new Date(timestamp);
        date = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
      } else {
        date = new Date(timestamp);
      }
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateInIST = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const todayInIST = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const yesterdayInIST = new Date(yesterday.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      if (dateInIST.toDateString() === todayInIST.toDateString()) return 'Today';
      if (dateInIST.toDateString() === yesterdayInIST.toDateString()) return 'Yesterday';
      return dateInIST.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: dateInIST.getFullYear() !== todayInIST.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      console.error('Error formatting message date:', error, 'Timestamp:', timestamp);
      return 'Unknown Date';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <svg className="w-4 h-4 text-black/50" fill="currentColor" viewBox="0 0 16 16">
            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
          </svg>
        );
      case 'delivered':
        return (
          <div className="flex">
            <svg className="w-4 h-4 text-black/50 -mr-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
            <svg className="w-4 h-4 text-black/50" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
          </div>
        );
      case 'read':
        return (
          <div className="flex">
            <svg className="w-4 h-4 text-blue-500 -mr-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
          </div>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.46.146A.5.5 0 0 0 11.107 0H4.893a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353L11.46.146zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
        );
      default: return null;
    }
  };

  const groupedMessages = filteredMessages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = formatMessageDate(message.timestamp, message.direction);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  Object.keys(groupedMessages).forEach(date => {
    groupedMessages[date].sort((a, b) => {
      let timeA, timeB;
      if (a.direction === 'outgoing') {
        const utcDateA = new Date(a.timestamp);
        timeA = utcDateA.getTime() + (5.5 * 60 * 60 * 1000);
      } else {
        timeA = new Date(a.timestamp).getTime();
      }
      if (b.direction === 'outgoing') {
        const utcDateB = new Date(b.timestamp);
        timeB = utcDateB.getTime() + (5.5 * 60 * 60 * 1000);
      } else {
        timeB = new Date(b.timestamp).getTime();
      }
      return timeA - timeB;
    });
  });

  if (loading) {
    return (
      <div className="h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col transition-colors duration-200 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg font-medium shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}
      <div className="sticky top-0 z-50 bg-transparent/80 backdrop-blur-sm shadow-sm h-[110px] border-b border-black/10">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-full transition-all duration-200 hover:scale-110 hover:bg-black/5 text-black/70">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-black/10 relative">
                {contact?.profile_pic ? (
                  <img src={contact.profile_pic} alt={contact.name || phone} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/5">
                    <span className="text-black font-semibold text-lg">
                      {(contact?.name || phone).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {contact?.is_online && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate text-black">
                {contact?.name || phone}
              </h2>
              <div className="text-sm flex items-center gap-2 text-black/60">
                {contact?.is_typing && (
                  <>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span>typing...</span>
                  </>
                )}
                {!contact?.is_typing && (
                  contact?.is_online ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online</span>
                    </>
                  ) : contact?.last_seen ? `Last seen ${formatTime(contact.last_seen)}` : "Tap here for contact info"
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <button 
                  onClick={() => {
                    if (selectedMessages.length === messages.length) setSelectedMessages([]);
                    else setSelectedMessages(messages.map(m => m.id));
                  }}
                  className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                    selectedMessages.length === messages.length && selectedMessages.length > 0
                      ? 'bg-blue-500 text-white' : 'hover:bg-black/5 text-black/70'
                  }`}
                  title={selectedMessages.length === messages.length ? 'Deselect All' : 'Select All'}
                >
                  {selectedMessages.length === messages.length && selectedMessages.length > 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </button>
              )}
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 hover:bg-black/5 text-black/70 ${showSearch ? 'bg-black/10 text-black' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 hover:bg-black/5 text-black/70 ${showTemplates ? 'bg-black/10 text-black' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
              <button 
                onClick={() => setShowMessageActions(!showMessageActions)}
                className="p-3 rounded-full transition-all duration-200 hover:scale-110 hover:bg-black/5 text-black/70"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {showSearch && (
          <div className="px-6 pb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 rounded-full border bg-black/5 border-black/10 text-black placeholder-black/50 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-black/40 hover:text-black/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showTemplates && (
        <div className="sticky top-0 z-40 bg-transparent/80 backdrop-blur-sm border-b border-black/10">
          <div className="px-6 py-4 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">Quick Templates</h3>
              <span className="text-sm px-3 py-1 rounded-full bg-black/5 text-black/70">
                {templates.length} available
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => sendTemplate(template.name)}
                  disabled={sending}
                  className="group text-left p-4 rounded-xl border bg-black/5 border-black/10 hover:bg-black/10 hover:border-black/20 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50"
                >
                  <div className="font-semibold text-sm mb-2 text-black">
                    📋 {template.name}
                  </div>
                  <div className="text-xs line-clamp-2 text-black/60">
                    {template.content}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div 
        ref={(ref) => setMessagesContainerRef(ref)}
        onScroll={handleScroll}
        onClick={closeContextMenu}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 relative bg-transparent"
      >
        {replyTo && (
          <div className="sticky top-0 z-10 p-3 rounded-lg border bg-black/5 border-black/10 backdrop-blur-sm mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-black/50 rounded-full"></div>
                <div>
                  <div className="text-sm font-medium text-black">
                    Replying to
                  </div>
                  <div className="text-sm text-black/70">
                    {replyTo.message.length > 50 ? `${replyTo.message.substring(0, 50)}...` : replyTo.message}
                  </div>
                </div>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-2 rounded-full transition-colors hover:bg-black/10 text-black/60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {selectedMessages.length > 0 && (
          <div className="sticky top-0 z-10 p-4 rounded-lg border bg-blue-500/10 border-blue-500/20 backdrop-blur-xl mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2 text-blue-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {selectedMessages.length} message(s) selected
      _        </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    selectedMessages.forEach(messageId => {
                      const message = messages.find(m => m.id === messageId);
                      if (message) forwardMessage(message);
                    });
                    setSelectedMessages([]);
                  }}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  title="Forward Selected"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const allMessages = selectedMessages.map(messageId => {
                      const message = messages.find(m => m.id === messageId);
                      return message?.message || '';
                    }).join('\n\n');
                    navigator.clipboard.writeText(allMessages);
                    showNotification('Messages copied to clipboard', 'success');
                    setSelectedMessages([]);
                  }}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                  title="Copy Selected"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={deleteSelectedMessages}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Delete Selected"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button onClick={() => setSelectedMessages([])} className="p-2 rounded-full transition-colors bg-black/5 text-black/70 hover:bg-black/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex justify-center my-6">
              <span className="px-4 py-2 rounded-full text-xs font-medium shadow-sm bg-black/5 text-black/70 border border-black/5 backdrop-blur-sm">
                {date}
              </span>
            </div>
            {dateMessages.map((message) => {
              const isSelected = selectedMessages.includes(message.id);
              return (
                <div
                  key={message.id}
                  className={`group flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'} mb-2 transition-all duration-200 ${
                    isSelected ? 'bg-blue-500/10 rounded-lg p-2 transform scale-[1.02]' : 'rounded-lg p-1'
                  }`}
                  onClick={() => selectedMessages.length > 0 && selectMessage(message.id)}
                  onContextMenu={(e) => handleMessageContextMenu(e, message)}
                >
                  <div
                    className={`relative max-w-xs lg:max-w-md transition-all duration-200 rounded-2xl px-4 py-3 ${
                      message.direction === 'outgoing'
                        ? 'bg-black text-white'
                        : 'bg-black/5 text-black border border-black/5 shadow-sm'
                    }`}
                    style={{
                      borderRadius: message.direction === 'outgoing' ? '20px 20px 6px 20px' : '20px 20px 20px 6px'
                    }}
                  >
                    <div className={`absolute top-2 ${message.direction === 'outgoing' ? '-left-16' : '-right-16'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1`}>
                      <div className="relative group/menu">
                        <button className="p-2 rounded-full text-sm shadow-lg bg-black/5 text-black/70 hover:bg-black/10 transition-all duration-200" title="Message options">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 py-1 rounded-lg shadow-xl border bg-white/80 border-black/10 backdrop-blur-sm opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-[9999]">
                          <button onClick={(e) => { e.stopPropagation(); setReplyTo(message); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 text-black/80">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            Reply
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); copyMessage(message); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 text-black/80">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Copy
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); forwardMessage(message); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 text-black/80">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            Forward
                          </button>
                          {message.direction === 'outgoing' && (
                            <button onClick={(e) => { e.stopPropagation(); setEditingMessage(message.id); setEditContent(message.message); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5 text-black/80">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Edit
                            </button>
                          )}
                          <div className="border-t my-1 border-black/10"></div>
                          <button onClick={(e) => { e.stopPropagation(); deleteMessage(message.id); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-500 hover:bg-red-500/10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  _          Delete
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); selectMessage(message.id); }}
                        className={`p-2 rounded-full text-sm shadow-lg transition-all duration-200 ${
                          isSelected ? 'bg-blue-500 text-white scale-110' : 'bg-black/5 text-black/70 hover:bg-black/10'
                        }`}
                        title={isSelected ? 'Deselect message' : 'Select message'}
                      >
                        {isSelected ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </button>
                    </div>

                    {message.reply_to && (
                      <div className={`text-xs mb-2 p-2 rounded-lg border-l-4 ${
                        message.direction === 'outgoing' ? 'bg-black/20 border-white/40' : 'bg-black/5 border-black/20'
                      }`}>
                        <div className="font-medium opacity-80 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                          Replying to
                        </div>
                        <div className="opacity-60 truncate mt-1">
                          {messages.find(m => m.id === message.reply_to)?.message || 'Original message'}
                        </div>
                      </div>
                    )}
                    {message.message_type === 'template' && message.template_name && (
                      <div className={`text-xs mb-2 font-medium flex items-center gap-1 ${
                        message.direction === 'outgoing' ? 'text-white/70' : 'text-blue-600'
                      }`}>
                        <span>📋</span>
                        <span>Template: {message.template_name}</span>
                      </div>
                    )}
                    {message.media_url && (
                      <div className="mb-3 relative">
                        {message.message_type === 'image' && (
                          <div className="relative overflow-hidden rounded-xl">
                            <img src={message.media_url} alt="Shared image" className="w-full h-auto cursor-pointer" onClick={() => window.open(message.media_url, '_blank')} />
                          </div>
                        )}
                        {message.message_type === 'video' && (
                          <video src={message.media_url} controls className="rounded-xl w-full h-auto shadow-lg" preload="metadata" />
                        )}
                        {message.message_type === 'document' && (
                          <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-opacity ${
                            message.direction === 'outgoing' ? 'bg-black/20' : 'bg-black/5'
                          }`} onClick={() => window.open(message.media_url, '_blank')}>
                            <div className="p-2 rounded-lg bg-red-500">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3a1 1 0 000 2h10a1 1 0 100-2H5zm0 4a1 1 0 100 2h10a1 1 0 100-2H5z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{message.media_filename || 'Document'}</div>
                              <div className="text-xs opacity-70">Click to open</div>
                            </div>
                            <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </div>
                        )}
                      </div>
                    )}
                    {message.message && message.message.trim() && !message.message.startsWith('📋') && (
                      <div className="whitespace-pre-wrap text-[15px] leading-[1.4] break-words">
                        {editingMessage === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2 rounded border resize-none bg-black/5 border-black/10 text-black"
                              rows={3} autoFocus
                            />
                            <div className="flex gap-2">
                              <button onClick={() => editMessage(message.id, editContent)} className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">Save</button>
                              <button onClick={() => { setEditingMessage(null); setEditContent(''); }} className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">Cancel</button>
                            </div>
                          </div>
                        ) : message.message}
                      </div>
                    )}
                    {message.message_type === 'template' && (!message.message || message.message.startsWith('📋')) && (
                      <div className="text-[15px] leading-[1.4] break-words opacity-80 italic">Template message sent</div>
                    )}
                    <div className={`flex items-center gap-2 mt-2 ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[11px] opacity-70 select-none font-medium">
                        {formatTime(message.timestamp, message.direction)}
                      </span>
                      {message.direction === 'outgoing' && (
                        <div className="flex items-center opacity-70">{getStatusIcon(message.status)}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
        {showScrollButton && (
          <div className="fixed bottom-24 right-6 z-40">
            <button onClick={scrollToBottom} className="p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-white text-black/70 hover:bg-black/5 border border-black/10" title="Scroll to bottom">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {contextMenu.visible && contextMenu.message && (
        <div 
          className="fixed z-[9999] min-w-[160px] py-2 rounded-lg shadow-xl border bg-white/80 border-black/10 backdrop-blur-sm"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 250) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { setReplyTo(contextMenu.message); closeContextMenu(); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors hover:bg-black/5 text-black/80">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Reply
          </button>
          <button onClick={() => { copyMessage(contextMenu.message!); closeContextMenu(); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors hover:bg-black/5 text-black/80">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Copy
          </button>
          <button onClick={() => { forwardMessage(contextMenu.message!); closeContextMenu(); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors hover:bg-black/5 text-black/80">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            Forward
          </button>
          <button onClick={() => { selectMessage(contextMenu.message!.id); closeContextMenu(); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors hover:bg-black/5 text-black/80">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Select
          </button>
          {contextMenu.message.direction === 'outgoing' && (
            <button onClick={() => { setEditingMessage(contextMenu.message!.id); setEditContent(contextMenu.message!.message); closeContextMenu(); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors hover:bg-black/5 text-black/80">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          )}
          <div className="border-t my-1 border-black/10"></div>
          <button onClick={() => { deleteMessage(contextMenu.message!.id); closeContextMenu(); }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-red-500 transition-colors hover:bg-red-500/10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      )}

      <div className="sticky bottom-0 z-30 bg-transparent/80 backdrop-blur-sm border-t border-black/10">
        {mediaFile && (
          <div className="px-6 py-3 border-b border-black/10">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-black/5">
              <div className="flex-shrink-0">
                {mediaFile.type.startsWith('image/') ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : mediaFile.type.startsWith('video/') ? (
                  <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3a1 1 0 000 2h10a1 1 0 100-2H5zm0 4a1 1 0 100 2h10a1 1 0 100-2H5z" clipRule="evenodd" /></svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-black">{mediaFile.name}</div>
                <div className="text-xs text-black/60">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button onClick={() => { setMediaFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-2 rounded-full transition-colors hover:bg-black/10 text-black/60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}
        <div className="px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="relative">
              <button onClick={() => fileInputRef.current?.click()} disabled={sending} className="p-3 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 text-black/60 hover:text-black hover:bg-black/5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>
              {mediaFile && (<div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full"></div>)}
            </div>
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={replyTo ? `Replying to ${replyTo.message.substring(0, 20)}...` : mediaFile ? "Add a caption..." : "Type a message..."}
                rows={1}
                className="w-full px-4 py-3 rounded-2xl resize-none transition-all duration-200 bg-black/5 border-black/10 text-black placeholder-black/50 border focus:outline-none focus:ring-2 focus:ring-black/10"
                style={{ minHeight: '48px', maxHeight: '120px', height: 'auto' }}
                disabled={sending}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              {newMessage.length > 100 && (
                <div className={`absolute bottom-1 right-3 text-xs ${newMessage.length > 1000 ? 'text-red-500' : 'text-black/50'}`}>
                  {newMessage.length}/1000
                </div>
              )}
            </div>
            <button
              onClick={sendTextMessage}
              disabled={(!newMessage.trim() && !mediaFile) || sending}
              className={`p-3 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                (!newMessage.trim() && !mediaFile) || sending
                  ? 'bg-black/10 text-black/30'
                  : 'bg-black text-white shadow-lg'
              }`}
            >
              {sending ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 10 * 1024 * 1024) {
                    showNotification('File size must be less than 10MB', 'error');
                    return;
                  }
                  setMediaFile(file);
                }
              }}
              className="hidden"
            />
          </div>
        </div>
      </div>
      <audio ref={audioRef} src="/notification.wav" preload="auto" />
    </div>
  );
}