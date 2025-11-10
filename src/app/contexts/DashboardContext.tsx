"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface DashboardContextType {
  showNotifications: boolean;
  setShowNotifications: Dispatch<SetStateAction<boolean>>;
  showSearchFilter: boolean;
  setShowSearchFilter: Dispatch<SetStateAction<boolean>>;
  notifications: any[];
  setNotifications: Dispatch<SetStateAction<any[]>>;
  unreadCount: number;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  dateFilter: string;
  setDateFilter: Dispatch<SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: Dispatch<SetStateAction<string>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <DashboardContext.Provider
      value={{
        showNotifications,
        setShowNotifications,
        showSearchFilter,
        setShowSearchFilter,
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        searchQuery,
        setSearchQuery,
        dateFilter,
        setDateFilter,
        statusFilter,
        setStatusFilter,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
