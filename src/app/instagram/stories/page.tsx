"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuImage, LuPlus, LuBot, LuZap, LuChevronLeft } from "react-icons/lu";
import InstagramNotConnected from "@/components/InstagramNotConnected";
import { buildApiUrl } from "@/config/server";

export default function StoryAutomation() {
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
            <LuImage className="text-[#2A8B8A]" size={28} />
            Story Reply Automation
          </h1>
          <p className="text-slate-600 mt-1">
            Auto-respond to story mentions and replies
          </p>
        </div>
        <button className="px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-all flex items-center gap-2 shadow-lg">
          <LuPlus size={20} />
          New Story Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuImage size={20} />
          </div>
          <p className="text-2xl font-bold text-black">234</p>
          <p className="text-sm text-slate-600">Story Replies</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuBot size={20} />
          </div>
          <p className="text-2xl font-bold text-black">189</p>
          <p className="text-sm text-slate-600">Auto-Responded</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuZap size={20} />
          </div>
          <p className="text-2xl font-bold text-black">80.8%</p>
          <p className="text-sm text-slate-600">Engagement Rate</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 rounded-xl p-8 border border-pink-200 dark:border-pink-800">
        <h3 className="text-lg font-bold text-black mb-4">Story Automation Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-pink-600 rounded-lg text-white mt-1">
              <LuZap size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-black">Mention Detection</h4>
              <p className="text-sm text-slate-600">Auto-detect when users mention you in stories</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-pink-600 rounded-lg text-white mt-1">
              <LuBot size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-black">Smart Replies</h4>
              <p className="text-sm text-slate-600">AI-powered contextual responses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
