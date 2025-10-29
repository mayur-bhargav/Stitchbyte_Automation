"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuBot, LuBrain, LuZap, LuMessageSquare, LuTrendingUp, LuChevronLeft } from "react-icons/lu";
import InstagramNotConnected from "@/components/InstagramNotConnected";
import { buildApiUrl } from "@/config/server";

export default function AIEngine() {
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

      <div>
        <h1 className="text-2xl font-bold text-black flex items-center gap-3">
          <LuBot className="text-[#2A8B8A]" size={28} />
          AI Reply Engine
        </h1>
        <p className="text-slate-600 mt-1">
          Train AI on your brand voice for contextual, intelligent responses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuBrain size={20} />
          </div>
          <p className="text-2xl font-bold text-black">1,523</p>
          <p className="text-sm text-slate-600">AI Responses</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuZap size={20} />
          </div>
          <p className="text-2xl font-bold text-black">94.2%</p>
          <p className="text-sm text-slate-600">Accuracy Rate</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuMessageSquare size={20} />
          </div>
          <p className="text-2xl font-bold text-black">156</p>
          <p className="text-sm text-slate-600">Learned Intents</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-8 border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
          <LuBrain className="text-[#2A8B8A]" size={24} />
          AI Training & Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-black mb-2">Auto-Learning</h4>
            <p className="text-sm text-slate-600">
              AI learns from your FAQs, previous conversations, and approved responses to understand your brand tone
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-black mb-2">Intent Detection</h4>
            <p className="text-sm text-slate-600">
              Automatically identifies user intent (pricing, booking, support) and responds appropriately
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-black mb-2">Assist Mode</h4>
            <p className="text-sm text-slate-600">
              AI suggests responses for human approval before sending
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-black mb-2">Auto Mode</h4>
            <p className="text-sm text-slate-600">
              Fully automated responses for common queries with fallback to human when needed
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-black mb-4">Training Data Sources</h3>
        <div className="space-y-3">
          {["FAQs & Knowledge Base", "Previous Conversations", "Product Catalogs", "Brand Guidelines", "Custom Training Sets"].map((source, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 /50 rounded-lg">
              <LuTrendingUp className="text-[#2A8B8A]" size={20} />
              <span className="text-black font-medium">{source}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
