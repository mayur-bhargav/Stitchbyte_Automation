"use client";
import { useEffect, useCallback, useRef } from 'react';
import { useChatContext } from '../contexts/ChatContext';

type Contact = {
  phone: string;
  name?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
};

type UseRealTimeChatOptions = {
  pollingInterval?: number; // in milliseconds, default 5000 (5 seconds)
  onNewMessage?: (contact: Contact) => void;
  enabled?: boolean;
};

export const useRealTimeChat = (options: UseRealTimeChatOptions = {}) => {
  const { 
    pollingInterval = 5000, 
    onNewMessage,
    enabled = true 
  } = options;
  
  const { addNewMessage, unreadCounts } = useChatContext();
  const lastContactsRef = useRef<Contact[]>([]);
  const processedMessagesRef = useRef<Set<string>>(new Set()); // Track processed messages
  const lastProcessTimeRef = useRef<number>(Date.now()); // Track last processing time

  // Cleanup old processed messages periodically to prevent memory bloat
  useEffect(() => {
    const cleanup = setInterval(() => {
      const cutoffTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      
      const currentSet = processedMessagesRef.current;
      const newSet = new Set<string>();
      
      currentSet.forEach(id => {
        // Keep only recent messages (within last 5 minutes)
        // Message IDs contain timestamp info, so we can parse them
        try {
          if (id.includes('-')) {
            const parts = id.split('-');
            const timestamp = parts[1]; // Should be the timestamp part
            if (timestamp && parseInt(timestamp) > cutoffTime) {
              newSet.add(id);
            }
          } else {
            // Keep IDs that don't match expected format (safety)
            newSet.add(id);
          }
        } catch {
          // Keep problematic IDs (safety)
          newSet.add(id);
        }
      });
      
      processedMessagesRef.current = newSet;
    }, 2 * 60 * 1000); // Run every 2 minutes

    return () => clearInterval(cleanup);
  }, []);

  const checkForNewMessages = useCallback(async () => {
    // Throttle: Ensure minimum time between checks
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    const minInterval = 3000; // Minimum 3 seconds between processing
    
    if (timeSinceLastProcess < minInterval) {
      // console.log('Throttling: Too soon since last check, skipping');
      return;
    }
    
    lastProcessTimeRef.current = now;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch current contacts with message counts
      const response = await fetch('http://localhost:8000/chat/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch contacts for real-time updates:', response.statusText);
        return;
      }

      const data = await response.json();
      const currentContacts = data.contacts || [];

      // console.log('Checking for new messages. Current contacts:', currentContacts.length);

      // Compare with previous contacts to detect new messages
      if (lastContactsRef.current.length > 0) {
        currentContacts.forEach((currentContact: Contact) => {
          const previousContact = lastContactsRef.current.find(c => c.phone === currentContact.phone);
          
          if (previousContact) {
            // Check if there's a new message (different last_message_time or content)
            const hasNewMessage = 
              currentContact.last_message_time !== previousContact.last_message_time ||
              currentContact.last_message !== previousContact.last_message;

            if (hasNewMessage && currentContact.last_message) {
              // Create a robust unique identifier for this message to prevent duplicate processing
              // Include more fields to ensure uniqueness
              const messageTimestamp = currentContact.last_message_time || Date.now().toString();
              const messageContent = currentContact.last_message.substring(0, 50); // First 50 chars to avoid huge IDs
              const messageId = `${currentContact.phone}-${messageTimestamp}-${messageContent.replace(/[^a-zA-Z0-9]/g, '_')}`;
              
              if (processedMessagesRef.current.has(messageId)) {
                // console.log('Message already processed:', messageId);
                return; // Skip if already processed
              }

              // Mark as being processed immediately to prevent duplicates
              processedMessagesRef.current.add(messageId);
              // console.log('Processing new message:', messageId);

              // Fetch the latest message for this contact to check direction
              const checkMessageDirection = async () => {
                try {
                  const messageResponse = await fetch(`http://localhost:8000/chat/messages/${encodeURIComponent(currentContact.phone)}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (messageResponse.ok) {
                    const messageData = await messageResponse.json();
                    const latestMessage = messageData.messages?.[messageData.messages.length - 1];
                    
                    // Only increment count for incoming messages
                    if (latestMessage && latestMessage.direction === 'incoming') {
                      // console.log('Adding new incoming message from:', currentContact.phone);
                      
                      addNewMessage({
                        id: latestMessage.id || `${currentContact.phone}-${currentContact.last_message_time}`,
                        phone: currentContact.phone,
                        direction: 'incoming',
                        timestamp: latestMessage.timestamp || currentContact.last_message_time || new Date().toISOString(),
                        read: false
                      });

                      // Call the callback if provided
                      if (onNewMessage) {
                        onNewMessage(currentContact);
                      }
                    } else {
                      // console.log('Message from', currentContact.phone, 'is outgoing, not counting');
                    }
                  }
                } catch (error) {
                  console.error('Error checking message direction:', error);
                  // If there's an error, remove from processed set so it can be retried
                  processedMessagesRef.current.delete(messageId);
                }
              };

              checkMessageDirection();
            }
          } else if (currentContact.last_message) {
            // This is a completely new contact with a message - check if it's incoming
            const messageTimestamp = currentContact.last_message_time || Date.now().toString();
            const messageContent = currentContact.last_message.substring(0, 50); // First 50 chars to avoid huge IDs
            const messageId = `${currentContact.phone}-${messageTimestamp}-${messageContent.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            if (processedMessagesRef.current.has(messageId)) {
              // console.log('New contact message already processed:', messageId);
              return; // Skip if already processed
            }

            // Mark as being processed immediately to prevent duplicates
            processedMessagesRef.current.add(messageId);
            // console.log('Processing new contact message:', messageId);

            const checkNewContactMessage = async () => {
              try {
                const messageResponse = await fetch(`http://localhost:8000/chat/messages/${encodeURIComponent(currentContact.phone)}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });

                if (messageResponse.ok) {
                  const messageData = await messageResponse.json();
                  const latestMessage = messageData.messages?.[messageData.messages.length - 1];
                  
                  // Only increment count for incoming messages from new contacts
                  if (latestMessage && latestMessage.direction === 'incoming') {
                    // console.log('Adding new incoming message from new contact:', currentContact.phone);
                    
                    addNewMessage({
                      id: latestMessage.id || `${currentContact.phone}-${currentContact.last_message_time}`,
                      phone: currentContact.phone,
                      direction: 'incoming',
                      timestamp: latestMessage.timestamp || currentContact.last_message_time || new Date().toISOString(),
                      read: false
                    });

                    if (onNewMessage) {
                      onNewMessage(currentContact);
                    }
                  } else {
                    // console.log('Message from new contact', currentContact.phone, 'is outgoing, not counting');
                  }
                }
              } catch (error) {
                console.error('Error checking new contact message direction:', error);
                // If there's an error, remove from processed set so it can be retried
                processedMessagesRef.current.delete(messageId);
              }
            };

            checkNewContactMessage();
          }
        });
      }

      // Update the reference for next comparison
      lastContactsRef.current = currentContacts;

      // Cleanup old processed messages (keep only last 100 to prevent memory leaks)
      if (processedMessagesRef.current.size > 100) {
        const messagesArray = Array.from(processedMessagesRef.current);
        const recentMessages = messagesArray.slice(-50); // Keep most recent 50
        processedMessagesRef.current = new Set(recentMessages);
      }

    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }, [addNewMessage, onNewMessage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Start polling for new messages
    const intervalId = setInterval(checkForNewMessages, pollingInterval);

    // Check immediately on mount
    checkForNewMessages();

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, pollingInterval, checkForNewMessages]);

  // Method to manually trigger a check
  const checkNow = useCallback(() => {
    checkForNewMessages();
  }, [checkForNewMessages]);

  return {
    checkNow
  };
};
