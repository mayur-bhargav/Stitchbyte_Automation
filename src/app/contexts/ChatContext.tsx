"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ChatCounts = {
  [phoneNumber: string]: number;
};

type ChatMessage = {
  id: string;
  phone: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  read?: boolean;
};

type ChatContextType = {
  unreadCounts: ChatCounts;
  totalUnreadCount: number;
  markAsRead: (phone: string) => void;
  addNewMessage: (message: ChatMessage) => void;
  resetCount: (phone: string) => void;
  incrementCount: (phone: string, count?: number) => void;
  initializeCounts: (contacts: Array<{phone: string, unread_count?: number}>) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState<ChatCounts>({});

  // Load counts from localStorage on mount
  useEffect(() => {
    const savedCounts = localStorage.getItem('chatUnreadCounts');
    if (savedCounts) {
      try {
        setUnreadCounts(JSON.parse(savedCounts));
      } catch (error) {
        console.error('Failed to load chat counts from localStorage:', error);
      }
    }
  }, []);

  // Save counts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatUnreadCounts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const markAsRead = useCallback((phone: string) => {
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      newCounts[phone] = 0;
      return newCounts;
    });
  }, []);

  const addNewMessage = useCallback((message: ChatMessage) => {
    // Only increment count for incoming messages that are not read
    if (message.direction === 'incoming' && !message.read) {
      // console.log('📨 New incoming message detected, incrementing count for:', message.phone);
      setUnreadCounts(prev => ({
        ...prev,
        [message.phone]: (prev[message.phone] || 0) + 1
      }));
    } else {
      // console.log('📤 Outgoing message or read message, not incrementing count for:', message.phone, 'Direction:', message.direction);
    }
  }, []);

  const resetCount = useCallback((phone: string) => {
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[phone];
      return newCounts;
    });
  }, []);

  const incrementCount = useCallback((phone: string, count: number = 1) => {
    setUnreadCounts(prev => ({
      ...prev,
      [phone]: (prev[phone] || 0) + count
    }));
  }, []);

  const initializeCounts = useCallback((contacts: Array<{phone: string, unread_count?: number}>) => {
    const newCounts: ChatCounts = {};
    contacts.forEach(contact => {
      if (contact.unread_count && contact.unread_count > 0) {
        newCounts[contact.phone] = contact.unread_count;
      }
    });
    setUnreadCounts(newCounts);
  }, []);

  return (
    <ChatContext.Provider value={{
      unreadCounts,
      totalUnreadCount,
      markAsRead,
      addNewMessage,
      resetCount,
      incrementCount,
      initializeCounts
    }}>
      {children}
    </ChatContext.Provider>
  );
};
