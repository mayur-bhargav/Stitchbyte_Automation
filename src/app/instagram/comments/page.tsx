"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LuMessageSquare,
  LuPlus,
  LuBot,
  LuUserPlus,
  LuTag,
  LuTrendingUp,
  LuChevronLeft
} from "react-icons/lu";
import InstagramNotConnected from "@/components/InstagramNotConnected";
import { buildApiUrl } from "@/config/server";

export default function CommentAutomation() {
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-3">
            <LuMessageSquare className="text-[#2A8B8A]" size={28} />
            Comment Automation
          </h1>
          <p className="text-slate-600 mt-1">
            Auto-engage with comments and convert them into leads
          </p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg">
          <LuPlus size={20} />
          New Comment Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuMessageSquare size={20} />
          </div>
          <p className="text-2xl font-bold text-black">456</p>
          <p className="text-sm text-slate-600">Comments Monitored</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuUserPlus size={20} />
          </div>
          <p className="text-2xl font-bold text-black">234</p>
          <p className="text-sm text-slate-600">Leads Generated</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuBot size={20} />
          </div>
          <p className="text-2xl font-bold text-black">189</p>
          <p className="text-sm text-slate-600">Auto-Engaged</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-xl text-white">
            <LuMessageSquare size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-black mb-2">How Comment Automation Works</h3>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p>✅ <strong>Keyword Detection:</strong> Automatically detect comments with specific keywords (e.g., "interested", "price", "DM me")</p>
              <p>✅ <strong>Auto-DM:</strong> Send personalized DM with product info or offer</p>
              <p>✅ <strong>Public Reply:</strong> Optionally reply publicly to maintain engagement</p>
              <p>✅ <strong>Lead Tagging:</strong> Tag users as "Hot Lead", "Interested", or custom tags</p>
              <p>✅ <strong>CRM Sync:</strong> Automatically add to WhatsApp campaigns or email sequences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
