"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from '../config/backend';
// Temporarily comment out to debug
// import { useChatContext } from "../contexts/ChatContext";
// import { useRealTimeChat } from "../hooks/useRealTimeChat";
import { motion, AnimatePresence } from "framer-motion";

type Contact = {
  phone: string;
  name?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  profile_pic?: string;
  is_online?: boolean;
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ChatContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const router = useRouter();
  // Temporarily remove these to debug
  // const { unreadCounts, initializeCounts } = useChatContext();
  const unreadCounts: {[key: string]: number} = {};
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchVisible) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchVisible]);
  
  // Temporarily remove this hook to debug
  /*
  useRealTimeChat({
    pollingInterval: 5000,
    onNewMessage: (message) => {
      // console.log('New message received:', message);
    }
  });
  */

  useEffect(() => {
    fetchContacts();
    
    // Add a test contact to see if rendering works
    // setTimeout(() => {
    //   setContacts([{
    //     phone: "918619365849",
    //     name: "Test Contact",
    //     last_message: "Template: order",
    //     last_message_time: "2025-09-02T11:56:54.174000"
    //   }]);
    //   setLoading(false);
    // }, 2000);
    
    const interval = setInterval(fetchContacts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/chat/contacts`);
      const data = await response.json();
      
      // const validContacts = (data.contacts || [])
      //   .filter((c: Contact) => {
      //     return c.phone && c.phone.trim() !== '';
      //   })
      //   .map((contact: Contact) => ({ ...contact, unread_count: 0 }));
      // console.log('Fetched contacts:', data|| 0);
      setContacts(data.contacts || []);
      
      if (data.contacts.length > 0) {
        const contactsForInit = data.contacts?.filter((c: Contact) => c.phone && c.unread_count && c.unread_count > 0) || [];
        if (contactsForInit.length > 0) {
          // initializeCounts(contactsForInit); // Temporarily commented out
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
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
    router.push(`/chats/${encodeURIComponent(phone)}`);
  };

  return (
    <div className="h-screen flex flex-col -m-8 bg-white">
      <div className="px-5 pt-6 pb-4 bg-white sticky top-0 z-10 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {isSearchVisible ? (
            <motion.div
              key="search-bar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => setIsSearchVisible(false)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-gray-900 placeholder-gray-500 py-2 outline-none"
              />
            </motion.div>
          ) : (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between"
            >
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Chats</h1>
              <button
                onClick={() => setIsSearchVisible(true)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto bg-white min-h-0">        
        <AnimatePresence>
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2A8B8A] border-t-transparent"></div>
              <span className="ml-3">Loading contacts...</span>
            </motion.div>
          ) : filteredContacts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center justify-center h-full text-gray-600 px-8 text-center"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 border-2 border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Conversations Yet</h3>
              <p className="max-w-xs leading-relaxed">
                Start a new chat to see it appear here.
              </p>
            </motion.div>
          ) : (
            <div className="divide-y divide-gray-200 bg-white">
              {filteredContacts.map((contact, index) => (
                <div
                  key={contact.phone || index}
                  onClick={() => contact.phone && openChat(contact.phone)}
                  className="flex items-start px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 group bg-white border-b border-gray-100"
                >
                  <div className="relative mr-4 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center ring-1 ring-gray-400">
                      {contact.profile_pic ? (
                        <img src={contact.profile_pic} alt={contact.name || 'Contact'} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-7 h-7 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                    {contact.is_online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-gray-900 font-semibold text-base truncate pr-2">
                        {contact.name || contact.phone || 'Unknown Contact'}
                      </h3>
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {contact.last_message_time ? formatTime(contact.last_message_time) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700 text-sm truncate pr-2">
                        {contact.last_message || 'Click to start messaging'}
                      </p>
                      {(unreadCounts[contact.phone] || 0) > 0 && (
                        <span className="bg-[#2A8B8A] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ml-2 flex-shrink-0">
                          {unreadCounts[contact.phone]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-8 right-8 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/send-message')}
          className="w-16 h-16 bg-[#2A8B8A] rounded-2xl shadow-lg flex items-center justify-center hover:bg-[#238080] transition-all group"
          aria-label="Start new chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white transition-transform group-hover:rotate-12" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}