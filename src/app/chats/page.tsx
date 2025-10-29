"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from '../config/backend';
import { useChatContext } from "../contexts/ChatContext";
import { useRealTimeChat } from "../hooks/useRealTimeChat";

type Contact = {
  phone: string;
  name?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  profile_pic?: string;
  is_online?: boolean;
};

type TabType = 'ACTIVE' | 'REQUESTING' | 'INTERVENED';

export default function ChatContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const router = useRouter();
  const { unreadCounts, initializeCounts } = useChatContext();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchContacts = useCallback(async () => {
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

  useEffect(() => {
    fetchContacts();
    
    const interval = setInterval(fetchContacts, 30000);
    return () => clearInterval(interval);
  }, [fetchContacts]);

  const handleNewMessage = useCallback(() => {
    fetchContacts();
  }, [fetchContacts]);

  useRealTimeChat({
    enabled: true,
    pollingInterval: 5000,
    onNewMessage: handleNewMessage
  });

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

  const getTabCount = (tab: TabType) => {
    // You can customize this based on actual data
    if (tab === 'ACTIVE') return contacts.length;
    return 0;
  };

  return (
    <div className="flex h-screen -m-8 bg-[#F8F9FA]">
      {/* Left Sidebar - Contact List */}
      <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col">
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
        <div className="flex-1 overflow-y-auto">
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

      {/* Right Panel - Chat Profile */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Chat Profile</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-[#F8F9FA]">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-[#FFA500] rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-lg text-gray-600">Select a chat to continue!</p>
          </div>
        </div>
      </div>
    </div>
  );
}