"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatContext } from "../contexts/ChatContext";
import { useRealTimeChat } from "../hooks/useRealTimeChat";

type Contact = {
  phone: string;
  name?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  profile_pic?: string;
  last_seen?: string;
  is_online?: boolean;
};

export default function ChatContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { unreadCounts, initializeCounts } = useChatContext();

  // Use real-time chat hook for live updates
  useRealTimeChat({
    pollingInterval: 5000, // Check every 5 seconds
    onNewMessage: (message) => {
      console.log('New message received:', message);
      // The hook automatically updates unread counts via ChatContext
    }
  });

  useEffect(() => {
    fetchContacts();
    
    // Reduced polling interval since we're mainly fetching contact metadata now
    // Real-time messages are handled by useRealTimeChat hook
    const interval = setInterval(fetchContacts, 30000); // Every 30 seconds instead of 10
    return () => clearInterval(interval);
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://localhost:8000/chat/contacts');
      const data = await response.json();
      
      // Filter out contacts with invalid phone numbers and deduplicate
      const validContacts = (data.contacts || [])
        .filter((contact: Contact) => contact.phone && contact.phone.trim() !== '')
        .reduce((acc: Contact[], current: Contact) => {
          // Check if phone number already exists in accumulator
          const existingIndex = acc.findIndex(c => c.phone === current.phone);
          
          if (existingIndex >= 0) {
            // Merge with existing contact - keep the one with more recent message
            const existing = acc[existingIndex];
            const currentTime = current.last_message_time ? new Date(current.last_message_time) : new Date(0);
            const existingTime = existing.last_message_time ? new Date(existing.last_message_time) : new Date(0);
            
            if (currentTime > existingTime) {
              acc[existingIndex] = {
                ...existing,
                ...current,
                // Don't use backend unread count anymore - it's managed by ChatContext
                unread_count: 0,
                // Prefer non-empty name
                name: current.name || existing.name
              };
            } else {
              // Keep existing but reset unread count
              acc[existingIndex].unread_count = 0;
            }
          } else {
            // Reset unread count for new contacts - managed by ChatContext
            acc.push({
              ...current,
              unread_count: 0
            });
          }
          
          return acc;
        }, []);
      
      setContacts(validContacts);
      
      // Initialize chat context with the contacts (one-time sync for any existing unread counts)
      if (validContacts.length > 0) {
        const contactsForInit = data.contacts?.filter((c: Contact) => c.phone && c.unread_count && c.unread_count > 0) || [];
        if (contactsForInit.length > 0) {
          initializeCounts(contactsForInit);
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    (contact.phone && contact.phone.includes(searchQuery)) ||
    (contact.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const openChat = (phone: string) => {
    router.push(`/chats/${encodeURIComponent(phone)}`);
  };

  return (
    <div className="h-screen bg-white flex flex-col -m-8">
      {/* Header */}
      <div className="bg-[#00A884] border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <div className="w-full h-full bg-white flex items-center justify-center">
                <svg className="w-6 h-6 text-[#00A884]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.884 3.297"/>
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-medium text-white">Chats</h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button 
              onClick={() => router.push('/send-message')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button className="text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-50 px-3 py-3 border-b border-gray-200">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-gray-900 placeholder-gray-500 pl-12 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] transition-colors"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 bg-white overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00A884] border-t-transparent"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-gray-800 mb-2">Welcome to WhatsApp</h3>
            <p className="text-center text-gray-500 mb-6 leading-relaxed">
              Start messaging to see your conversations here
            </p>
            <button
              onClick={() => router.push('/send-message')}
              className="bg-[#00A884] text-white px-6 py-3 rounded-full hover:bg-[#00916A] transition-colors font-medium"
            >
              Start new chat
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
              <div
                key={contact.phone}
                onClick={() => contact.phone && openChat(contact.phone)}
                className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                {/* Profile Picture */}
                <div className="relative mr-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {contact.profile_pic ? (
                      <img 
                        src={contact.profile_pic} 
                        alt={contact.name || contact.phone || 'Contact'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {contact.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00A884] border-2 border-white rounded-full"></div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0 border-b border-gray-100 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-gray-900 font-normal text-[17px] truncate pr-2">
                      {contact.name || contact.phone || 'Unknown Contact'}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {contact.last_message_time ? formatTime(contact.last_message_time) : ''}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      {contact.last_message && (
                        <svg className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <p className="text-gray-600 text-[15px] truncate">
                        {contact.last_message || 'Click to start messaging'}
                      </p>
                    </div>
                    {(unreadCounts[contact.phone] || 0) > 0 && (
                      <span className="bg-[#00A884] text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-[18px] text-center ml-2 flex-shrink-0">
                        {(unreadCounts[contact.phone] || 0) > 99 ? '99+' : unreadCounts[contact.phone]}
                      </span>
                    )}
                  </div>
                  {!contact.name && contact.phone && (
                    <p className="text-gray-500 text-xs mt-0.5">{contact.phone}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => router.push('/send-message')}
            className="w-14 h-14 bg-[#00A884] rounded-full shadow-lg flex items-center justify-center hover:bg-[#00916A] transition-all hover:scale-110 group"
          >
            <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
