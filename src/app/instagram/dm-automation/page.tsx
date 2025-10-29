"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LuMessageCircle,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuToggleLeft,
  LuToggleRight,
  LuBot,
  LuZap,
  LuSearch,
  LuFilter,
  LuDownload,
  LuUpload,
  LuChevronLeft
} from "react-icons/lu";
import InstagramNotConnected from "@/components/InstagramNotConnected";
import { buildApiUrl } from "@/config/server";

interface DMRule {
  id: string;
  name: string;
  trigger: string;
  triggerType: "keyword" | "intent" | "pattern";
  response: string;
  responseType: "text" | "template" | "ai";
  enabled: boolean;
  priority: number;
  stats: {
    triggered: number;
    success: number;
    failed: number;
  };
}

export default function DMAutomation() {
  const [rules, setRules] = useState<DMRule[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "keyword" | "intent" | "ai">("all");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInstagramConnection();
  }, []);

  const checkInstagramConnection = async () => {
    try {
      const token = localStorage.getItem('token');
  const response = await fetch(buildApiUrl('/api/v1/instagram/status'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(Boolean(data.connected));
        if (data.accounts && data.accounts.length > 0) {
          fetchDMRules();
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error checking Instagram connection:", error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDMRules = async () => {
    // TODO: Replace with actual API call
    // Mock data
    setRules([
      {
        id: "1",
        name: "Pricing Inquiry",
        trigger: "price|pricing|cost|how much",
        triggerType: "keyword",
        response: "Our pricing starts at $99/month. Would you like to see our full pricing details?",
        responseType: "text",
        enabled: true,
        priority: 1,
        stats: { triggered: 234, success: 228, failed: 6 }
      },
      {
        id: "2",
        name: "Product Info",
        trigger: "product|details|features",
        triggerType: "keyword",
        response: "Template: Product Catalog",
        responseType: "template",
        enabled: true,
        priority: 2,
        stats: { triggered: 189, success: 185, failed: 4 }
      },
      {
        id: "3",
        name: "General Questions",
        trigger: "General customer inquiry",
        triggerType: "intent",
        response: "AI-powered contextual response",
        responseType: "ai",
        enabled: true,
        priority: 3,
        stats: { triggered: 456, success: 442, failed: 14 }
      }
    ]);
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const deleteRule = (id: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      setRules(rules.filter(rule => rule.id !== id));
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.trigger.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || rule.triggerType === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!isConnected) {
    return <InstagramNotConnected />;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/instagram"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-[#2A8B8A] transition-all"
      >
        <LuChevronLeft size={20} />
        <span>Back to Instagram Hub</span>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-3">
            <LuMessageCircle className="text-[#2A8B8A]" size={28} />
            DM Automation
          </h1>
          <p className="text-slate-600 mt-1">
            Auto-reply to Instagram DMs with keyword triggers and AI
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-[#2A8B8A] text-white rounded-xl font-semibold hover:bg-[#238080] transition-all flex items-center gap-2 shadow-lg"
        >
          <LuPlus size={20} />
          Create Rule
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-[#2A8B8A]/10 rounded-lg">
              <LuMessageCircle className="text-[#2A8B8A]" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-black">879</p>
          <p className="text-sm text-slate-600">Total DMs Handled</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-[#2A8B8A]/10 rounded-lg">
              <LuZap className="text-[#2A8B8A]" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-black">855</p>
          <p className="text-sm text-slate-600">Successful Replies</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-[#2A8B8A]/10 rounded-lg">
              <LuBot className="text-[#2A8B8A]" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-black">{rules.length}</p>
          <p className="text-sm text-slate-600">Active Rules</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-[#2A8B8A]/10 rounded-lg">
              <LuZap className="text-[#2A8B8A]" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-black">97.2%</p>
          <p className="text-sm text-slate-600">Success Rate</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500  "
            />
          </div>
          <div className="flex items-center gap-2">
            <LuFilter className="text-slate-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500  "
            >
              <option value="all">All Types</option>
              <option value="keyword">Keywords</option>
              <option value="intent">AI Intent</option>
              <option value="pattern">Pattern Match</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-black">{rule.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    rule.responseType === "ai" ? "bg-[#2A8B8A]/10 text-purple-700 /10 dark:text-purple-300" :
                    rule.responseType === "template" ? "bg-[#2A8B8A]/10 text-blue-700 /10 dark:text-blue-300" :
                    "bg-slate-100 text-slate-700  dark:text-slate-300"
                  }`}>
                    {rule.responseType === "ai" && <LuBot className="inline mr-1" size={12} />}
                    {rule.responseType.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700  dark:text-slate-300">
                    Priority: {rule.priority}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-slate-600">Trigger:</span>
                    <p className="text-sm text-black font-mono bg-slate-50 /50 px-3 py-2 rounded-lg mt-1">
                      {rule.trigger}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-600">Response:</span>
                    <p className="text-sm text-black bg-slate-50 /50 px-3 py-2 rounded-lg mt-1">
                      {rule.response}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`p-2 rounded-lg transition-all ${
                    rule.enabled
                      ? "text-[#2A8B8A] hover:bg-green-50 dark:hover:bg-green-900/20"
                      : "text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {rule.enabled ? <LuToggleRight size={24} /> : <LuToggleLeft size={24} />}
                </button>
                <button className="p-2 text-[#2A8B8A] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                  <LuPencil size={20} />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <LuTrash2 size={20} />
                </button>
              </div>
            </div>

            {/* Rule Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-black">{rule.stats.triggered}</p>
                <p className="text-xs text-slate-600">Triggered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#2A8B8A]">{rule.stats.success}</p>
                <p className="text-xs text-slate-600">Success</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{rule.stats.failed}</p>
                <p className="text-xs text-slate-600">Failed</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRules.length === 0 && (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <LuMessageCircle className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-black mb-2">No DM Rules Found</h3>
          <p className="text-slate-600 mb-6">
            Create your first automation rule to start auto-replying to Instagram DMs
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#2A8B8A] text-white rounded-xl font-semibold hover:bg-[#238080] transition-all inline-flex items-center gap-2"
          >
            <LuPlus size={20} />
            Create First Rule
          </button>
        </div>
      )}
    </div>
  );
}
