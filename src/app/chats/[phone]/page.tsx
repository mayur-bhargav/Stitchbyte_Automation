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
  
  // Use real-time chat hook for this specific conversation
  useRealTimeChat({
    pollingInterval: 3000, // Check every 3 seconds for this conversation
    onNewMessage: (contact) => {
      // If it's a message for this conversation, reload messages
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
  const [darkMode, setDarkMode] = useState(false);
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

  // Mark this chat as read when user enters the conversation
  useEffect(() => {
    markAsRead(phone);
  }, [phone, markAsRead]);

  // Define functions before useEffect hooks
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
    // Initial load when component mounts or phone changes
    console.log('Initializing chat for phone:', phone);
    loadMessages();
    loadContact();
    loadTemplates();
    
    // Load theme preference
    const savedTheme = localStorage.getItem('chatTheme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, [phone, loadMessages, loadContact, loadTemplates]);

  useEffect(() => {
    // Real-time updates every 3 seconds
    const interval = setInterval(() => {
      loadMessages();
      loadContact();
    }, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, [loadMessages, loadContact]);

  useEffect(() => {
    // Keyboard shortcuts - separate effect to avoid dependency issues
    const handleKeyPress = (e: KeyboardEvent) => {
      // Escape key to cancel selection or close modals
      if (e.key === 'Escape') {
        setSelectedMessages([]);
        setEditingMessage(null);
        setShowTemplates(false);
        setShowSearch(false);
        setReplyTo(null);
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
      }
      
      // Ctrl/Cmd + A to select all messages
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !(e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/)) {
        e.preventDefault();
        setSelectedMessages(prev => messages.map(m => m.id));
      }
      
      // Ctrl/Cmd + F to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
      
      // Delete key to delete selected messages
      if (e.key === 'Delete' && selectedMessages.length > 0) {
        // deleteSelectedMessages(); // TODO: Implement this function
        console.log('Delete key pressed for', selectedMessages.length, 'messages');
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedMessages]); // Only depend on selectedMessages for delete function

  useEffect(() => {
    scrollToBottom();
  }, []);

  const sendTextMessage = async () => {
    if (!newMessage.trim() && !mediaFile) return;
    
    setSending(true);
    setIsTyping(true);
    
    try {
      if (mediaFile) {
        // Send media message
        const formData = new FormData();
        formData.append('phone', phone);
        formData.append('message', newMessage || '');
        formData.append('media_file', mediaFile);
        if (replyTo) {
          formData.append('reply_to', replyTo.id);
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch("http://localhost:8000/chat/send-media", {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Media message sent successfully:', result);
          setNewMessage("");
          setMediaFile(null);
          setReplyTo(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          loadMessages();
          playNotificationSound();
          showNotification('Message sent successfully!', 'success');
          // Scroll to bottom when sending a new message
          setTimeout(scrollToBottom, 100);
        } else {
          const errorData = await response.text();
          console.error('Failed to send media message:', response.status, errorData);
          showNotification(`Failed to send media message: ${response.status}`, 'error');
        }
      } else {
        // Send text message
        const token = localStorage.getItem('token');
        console.log('Sending text message to:', phone, 'Message:', newMessage);
        
        const response = await fetch("http://localhost:8000/chat/send-text", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            phone: phone,
            message: newMessage,
            reply_to: replyTo?.id
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Text message sent successfully:', result);
          setNewMessage("");
          setReplyTo(null);
          loadMessages();
          playNotificationSound();
          showNotification('Message sent successfully!', 'success');
          // Scroll to bottom when sending a new message
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
        body: JSON.stringify({
          phone: phone,
          template: templateName,
          components: []
        }),
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
      audioRef.current.play().catch(() => {
        // Ignore errors if audio can't play
      });
    }
  };

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('chatTheme', newTheme ? 'dark' : 'light');
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
        fetch(`http://localhost:8000/chat/message/${messageId}`, {
          method: 'DELETE'
        })
      );
      
      await Promise.all(deletePromises);
      setSelectedMessages([]);
      loadMessages();
      
      // Show success notification
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
      await fetch(`http://localhost:8000/chat/message/${messageId}`, {
        method: 'DELETE'
      });
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
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleMessageContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message: message
    });
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
      
      // If it's an outgoing message, convert from UTC to IST
      if (direction === 'outgoing') {
        // Convert UTC to IST for outgoing messages
        const utcDate = new Date(timestamp);
        date = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
      }
      // For incoming messages, use as-is (already in IST)
      else {
        date = new Date(timestamp);
      }
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time:', error, 'Timestamp:', timestamp);
      return 'Invalid time';
    }
  };

  const formatMessageDate = (timestamp: string, direction?: 'outgoing' | 'incoming') => {
    try {
      let date;
      
      // If it's an outgoing message, convert from UTC to IST
      if (direction === 'outgoing') {
        // Convert UTC to IST for outgoing messages
        const utcDate = new Date(timestamp);
        date = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
      }
      // For incoming messages, use as-is (already in IST)
      else {
        date = new Date(timestamp);
      }

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Convert to IST for comparison
      const dateInIST = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const todayInIST = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const yesterdayInIST = new Date(yesterday.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

      if (dateInIST.toDateString() === todayInIST.toDateString()) {
        return 'Today';
      } else if (dateInIST.toDateString() === yesterdayInIST.toDateString()) {
        return 'Yesterday';
      } else {
        return dateInIST.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: dateInIST.getFullYear() !== todayInIST.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      console.error('Error formatting message date:', error, 'Timestamp:', timestamp);
      return 'Unknown Date';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
          </svg>
        );
      case 'delivered':
        return (
          <div className="flex">
            <svg className="w-4 h-4 text-gray-400 -mr-1" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
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
      default:
        return null;
    }
  };

  // Group messages by date and sort them chronologically
  const groupedMessages = filteredMessages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = formatMessageDate(message.timestamp, message.direction);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Sort messages within each date group by timestamp
  Object.keys(groupedMessages).forEach(date => {
    groupedMessages[date].sort((a, b) => {
      // Get the actual time for comparison using the same logic as formatTime
      let timeA, timeB;
      
      // For message A
      if (a.direction === 'outgoing') {
        // Convert UTC to IST for outgoing messages
        const utcDateA = new Date(a.timestamp);
        timeA = utcDateA.getTime() + (5.5 * 60 * 60 * 1000);
      } else {
        // For incoming messages, use as-is (already in IST)
        timeA = new Date(a.timestamp).getTime();
      }
      
      // For message B
      if (b.direction === 'outgoing') {
        // Convert UTC to IST for outgoing messages
        const utcDateB = new Date(b.timestamp);
        timeB = utcDateB.getTime() + (5.5 * 60 * 60 * 1000);
      } else {
        // For incoming messages, use as-is (already in IST)
        timeB = new Date(b.timestamp).getTime();
      }
      
      return timeA - timeB; // Sort in ascending order (oldest first)
    });
  });

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#075E54]"></div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-900 text-white -m-8' 
        : 'bg-gray-50 text-gray-900 -m-8'
    }`}>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white font-medium shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
      {/* Fixed Modern Header with Glassmorphism */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl shadow-lg h-[110px] ${
        darkMode
          ? 'bg-gray-800/95 border-b border-gray-700 '
          : 'bg-white/95 border-b border-gray-200'
      }`}>
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-500/20 relative">
                {contact?.profile_pic ? (
                  <img 
                    src={contact.profile_pic} 
                    alt={contact.name || phone}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-emerald-400 to-blue-500'
                  }`}>
                    <span className="text-white font-semibold text-lg">
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
              <h2 className={`text-lg font-semibold truncate ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {contact?.name || phone}
              </h2>
              <div className={`text-sm flex items-center gap-2 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
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
                  ) : contact?.last_seen ? (
                    `Last seen ${formatTime(contact.last_seen)}`
                  ) : (
                    "Tap here for contact info"
                  )
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* Select All/None Button - only show when there are messages */}
              {messages.length > 0 && (
                <button 
                  onClick={() => {
                    if (selectedMessages.length === messages.length) {
                      setSelectedMessages([]);
                    } else {
                      setSelectedMessages(messages.map(m => m.id));
                    }
                  }}
                  className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                    selectedMessages.length === messages.length && selectedMessages.length > 0
                      ? 'bg-blue-500 text-white'
                      : darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-600'
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
              
              {/* Search Button */}
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                } ${showSearch ? 'bg-emerald-500 text-white' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  darkMode
                    ? 'hover:bg-gray-700 text-yellow-400'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              {/* Templates Button */}
              <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                } ${showTemplates ? 'bg-emerald-500 text-white' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>
              
              {/* More Options */}
              <button 
                onClick={() => setShowMessageActions(!showMessageActions)}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-6 pb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className={`w-full pl-10 pr-4 py-2 rounded-full border transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Templates Panel */}
      {showTemplates && (
        <div className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-300 ${
          darkMode
            ? 'bg-gray-800/95 border-gray-700'
            : 'bg-white/95 border-gray-200'
        }`}>
          <div className="px-6 py-4 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Quick Templates
              </h3>
              <span className={`text-sm px-3 py-1 rounded-full ${
                darkMode 
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {templates.length} available
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => sendTemplate(template.name)}
                  disabled={sending}
                  className={`group text-left p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 ${
                    darkMode
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-emerald-500'
                      : 'bg-white border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                  }`}
                >
                  <div className={`font-semibold text-sm mb-2 group-hover:text-emerald-600 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    📋 {template.name}
                  </div>
                  <div className={`text-xs line-clamp-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {template.content}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modern Messages Area */}
      <div 
        ref={(ref) => setMessagesContainerRef(ref)}
        onScroll={handleScroll}
        onClick={closeContextMenu}
        className={`flex-1 overflow-y-auto px-6 py-4 space-y-4 relative ${
          darkMode
            ? 'bg-gray-900'
            : 'bg-gradient-to-b from-blue-50/30 to-purple-50/30'
        }`}
        style={{
          backgroundImage: !darkMode ? `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` : undefined
        }}
      >
        {/* Reply Banner */}
        {replyTo && (
          <div className={`sticky top-0 z-10 p-3 rounded-lg border mb-4 ${
            darkMode
              ? 'bg-gray-800/90 border-gray-700 backdrop-blur-sm'
              : 'bg-white/90 border-gray-200 backdrop-blur-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                <div>
                  <div className={`text-sm font-medium ${
                    darkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>
                    Replying to
                  </div>
                  <div className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {replyTo.message.length > 50 ? `${replyTo.message.substring(0, 50)}...` : replyTo.message}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className={`p-2 rounded-full transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Selected Messages Actions */}
        {selectedMessages.length > 0 && (
          <div className={`sticky top-0 z-10 p-4 rounded-lg border mb-4 backdrop-blur-xl ${
            darkMode
              ? 'bg-blue-900/20 border-blue-700'
              : 'bg-blue-50/90 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium flex items-center gap-2 ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {selectedMessages.length} message(s) selected
              </span>
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
                <button
                  onClick={() => setSelectedMessages([])}
                  className={`p-2 rounded-full transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Cancel Selection"
                >
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
            {/* Modern Date Separator */}
            <div className="flex justify-center my-6">
              <span className={`px-4 py-2 rounded-full text-xs font-medium shadow-lg ${
                darkMode
                  ? 'bg-gray-800/90 text-gray-300 border border-gray-700'
                  : 'bg-white/90 text-gray-600 border border-gray-200/50'
              } backdrop-blur-sm`}>
                {date}
              </span>
            </div>
            
            {/* Modern Messages */}
            {dateMessages.map((message, index) => {
              const isSelected = selectedMessages.includes(message.id);
              
              return (
                <div
                  key={message.id}
                  className={`group flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'} mb-2 transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-100/70 dark:bg-blue-900/30 rounded-lg p-2 transform scale-[1.02]' 
                      : 'rounded-lg p-1'
                  }`}
                  onClick={() => selectedMessages.length > 0 && selectMessage(message.id)}
                  onContextMenu={(e) => handleMessageContextMenu(e, message)}
                >
                  <div
                    className={`relative max-w-xs lg:max-w-md transition-all duration-200 ${
                      message.direction === 'outgoing'
                        ? darkMode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-500 text-white'
                        : darkMode
                          ? 'bg-gray-800 text-gray-100 border border-gray-700'
                          : 'bg-white text-gray-900 border border-gray-200/50 shadow-sm'
                    } rounded-2xl px-4 py-3 backdrop-blur-sm`}
                    style={{
                      borderRadius: message.direction === 'outgoing' 
                        ? '20px 20px 6px 20px' 
                        : '20px 20px 20px 6px'
                    }}
                  >
                    {/* Message Actions - Selection and Menu */}
                    <div className={`absolute top-2 ${
                      message.direction === 'outgoing' ? '-left-16' : '-right-16'
                    } opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1`}>
                      {/* 3-Dot Menu - Always on the RIGHT */}
                      <div className="relative group/menu">
                        <button
                          className={`p-2 rounded-full text-sm shadow-lg ${
                            darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-white text-gray-600 hover:bg-gray-200'
                          } transition-all duration-200`}
                          title="Message options"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className={`absolute right-0 top-full mt-1 w-36 py-1 rounded-lg shadow-xl border opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-[9999] ${
                          darkMode
                            ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm'
                            : 'bg-white/95 border-gray-200 backdrop-blur-sm'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyTo(message);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                              darkMode
                                ? 'hover:bg-gray-700 text-gray-300'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Reply
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyMessage(message);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                              darkMode
                                ? 'hover:bg-gray-700 text-gray-300'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              forwardMessage(message);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                              darkMode
                                ? 'hover:bg-gray-700 text-gray-300'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Forward
                          </button>
                          {message.direction === 'outgoing' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMessage(message.id);
                                setEditContent(message.message);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                                darkMode
                                  ? 'hover:bg-gray-700 text-gray-300'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                          )}
                          <div className={`border-t my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-500 ${
                              darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Selection Button - Always on the RIGHT after 3-dot menu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectMessage(message.id);
                        }}
                        className={`p-2 rounded-full text-sm shadow-lg ${
                          isSelected
                            ? 'bg-blue-500 text-white scale-110'
                            : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-white text-gray-600 hover:bg-gray-200'
                        } transition-all duration-200`}
                        title={isSelected ? 'Deselect message' : 'Select message'}
                      >
                        {isSelected ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Reply Indicator */}
                    {message.reply_to && (
                      <div className={`text-xs mb-2 p-2 rounded-lg border-l-4 ${
                        message.direction === 'outgoing'
                          ? 'bg-emerald-700/30 border-emerald-300'
                          : darkMode
                            ? 'bg-gray-700/50 border-gray-500'
                            : 'bg-gray-100 border-gray-300'
                      }`}>
                        <div className="font-medium opacity-80 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Replying to
                        </div>
                        <div className="opacity-60 truncate mt-1">
                          {/* Find and display the original message */}
                          {(() => {
                            const originalMessage = messages.find(m => m.id === message.reply_to);
                            return originalMessage?.message || 'Original message';
                          })()}
                        </div>
                      </div>
                    )}
                  
                    {/* Template Badge */}
                    {message.message_type === 'template' && message.template_name && (
                      <div className={`text-xs mb-2 font-medium flex items-center gap-1 ${
                        message.direction === 'outgoing' 
                          ? 'text-emerald-100' 
                          : darkMode 
                            ? 'text-blue-400' 
                            : 'text-blue-600'
                      }`}>
                        <span>📋</span>
                        <span>Template: {message.template_name}</span>
                      </div>
                    )}
                  
                    {/* Enhanced Media Content */}
                    {message.media_url && (
                      <div className="mb-3 relative">
                        {message.message_type === 'image' && (
                          <div className="relative overflow-hidden rounded-xl">
                            <img 
                              src={message.media_url} 
                              alt="Shared image" 
                              className="w-full h-auto cursor-pointer transition-transform duration-300"
                              onClick={() => window.open(message.media_url, '_blank')}
                            />
                          </div>
                        )}
                        {message.message_type === 'video' && (
                          <video 
                            src={message.media_url} 
                            controls 
                            className="rounded-xl w-full h-auto shadow-lg"
                            preload="metadata"
                          />
                        )}
                        {message.message_type === 'document' && (
                          <div className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-opacity ${
                            message.direction === 'outgoing'
                              ? 'bg-emerald-700/30'
                              : darkMode
                                ? 'bg-gray-700/50'
                                : 'bg-gray-100'
                          }`}
                               onClick={() => window.open(message.media_url, '_blank')}>
                            <div className={`p-2 rounded-lg ${
                              message.direction === 'outgoing'
                                ? 'bg-emerald-600'
                                : 'bg-red-500'
                            }`}>
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3a1 1 0 000 2h10a1 1 0 100-2H5zm0 4a1 1 0 100 2h10a1 1 0 100-2H5z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{message.media_filename || 'Document'}</div>
                              <div className="text-xs opacity-70">Click to open</div>
                            </div>
                            <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  
                    {/* Enhanced Message Text */}
                    {message.message && message.message.trim() && !message.message.startsWith('📋') && (
                      <div className="whitespace-pre-wrap text-[15px] leading-[1.4] break-words">
                        {editingMessage === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className={`w-full p-2 rounded border resize-none ${
                                darkMode
                                  ? 'bg-gray-700 border-gray-600 text-white'
                                  : 'bg-gray-50 border-gray-300 text-gray-900'
                              }`}
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => editMessage(message.id, editContent)}
                                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}
                                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          message.message
                        )}
                      </div>
                    )}
                  
                    {/* Template fallback */}
                    {message.message_type === 'template' && (!message.message || message.message.startsWith('📋')) && (
                      <div className="text-[15px] leading-[1.4] break-words opacity-80 italic">
                        Template message sent
                      </div>
                    )}
                  
                    {/* Enhanced Message Info */}
                    <div className={`flex items-center gap-2 mt-2 ${
                      message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-[11px] opacity-70 select-none font-medium">
                        {formatTime(message.timestamp, message.direction)}
                      </span>
                      {message.direction === 'outgoing' && (
                        <div className="flex items-center opacity-70">
                          {getStatusIcon(message.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <div className="fixed bottom-24 right-6 z-40">
            <button
              onClick={scrollToBottom}
              className={`p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
              title="Scroll to bottom"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.message && (
        <div 
          className={`fixed z-[9999] min-w-[160px] py-2 rounded-lg shadow-xl border backdrop-blur-sm ${
            darkMode
              ? 'bg-gray-800/95 border-gray-700'
              : 'bg-white/95 border-gray-200'
          }`}
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            top: Math.min(contextMenu.y, window.innerHeight - 250)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setReplyTo(contextMenu.message);
              closeContextMenu();
            }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
          
          <button
            onClick={() => {
              copyMessage(contextMenu.message!);
              closeContextMenu();
            }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          
          <button
            onClick={() => {
              forwardMessage(contextMenu.message!);
              closeContextMenu();
            }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Forward
          </button>
          
          <button
            onClick={() => {
              selectMessage(contextMenu.message!.id);
              closeContextMenu();
            }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Select
          </button>
          
          {contextMenu.message.direction === 'outgoing' && (
            <button
              onClick={() => {
                setEditingMessage(contextMenu.message!.id);
                setEditContent(contextMenu.message!.message);
                closeContextMenu();
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                darkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          
          <div className={`border-t my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
          <button
            onClick={() => {
              deleteMessage(contextMenu.message!.id);
              closeContextMenu();
            }}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-red-500 transition-colors ${
              darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}

      {/* Modern Message Input */}
      <div className={`sticky bottom-0 z-30 backdrop-blur-xl border-t ${
        darkMode
          ? 'bg-gray-800/95 border-gray-700'
          : 'bg-white/95 border-gray-200'
      }`}>
        {/* Media File Preview */}
        {mediaFile && (
          <div className={`px-6 py-3 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex-shrink-0">
                {mediaFile.type.startsWith('image/') ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <img 
                      src={URL.createObjectURL(mediaFile)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : mediaFile.type.startsWith('video/') ? (
                  <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 3a1 1 0 000 2h10a1 1 0 100-2H5zm0 4a1 1 0 100 2h10a1 1 0 100-2H5z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {mediaFile.name}
                </div>
                <div className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                onClick={() => {
                  setMediaFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className={`p-2 rounded-full transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-600 text-gray-400'
                    : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="px-6 py-4">
          <div className="flex items-end gap-3">
            {/* Enhanced Attachment Button */}
            <div className="relative">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 ${
                  darkMode
                    ? 'text-gray-400 hover:text-emerald-400 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              {/* File type indicator */}
              {mediaFile && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
              )}
            </div>

            {/* Enhanced Message Input */}
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  replyTo 
                    ? `Replying to ${replyTo.message.substring(0, 20)}...` 
                    : mediaFile 
                      ? "Add a caption..." 
                      : "Type a message..."
                }
                rows={1}
                className={`w-full px-4 py-3 rounded-2xl resize-none transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                } border focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                style={{ 
                  minHeight: '48px', 
                  maxHeight: '120px',
                  height: 'auto'
                }}
                disabled={sending}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              
              {/* Character count for long messages */}
              {newMessage.length > 100 && (
                <div className={`absolute bottom-1 right-3 text-xs ${
                  newMessage.length > 1000 
                    ? 'text-red-500' 
                    : darkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-500'
                }`}>
                  {newMessage.length}/1000
                </div>
              )}
            </div>

            {/* Enhanced Send Button */}
            <button
              onClick={sendTextMessage}
              disabled={(!newMessage.trim() && !mediaFile) || sending}
              className={`p-3 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                (!newMessage.trim() && !mediaFile) || sending
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500'
                    : 'bg-gray-200 text-gray-400'
                  : 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:from-emerald-600 hover:to-blue-600 shadow-lg'
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

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Check file size (10MB limit)
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

      {/* Notification Sound */}
      <audio ref={audioRef} src="/notification.wav" preload="auto" />
    </div>
  );
}
