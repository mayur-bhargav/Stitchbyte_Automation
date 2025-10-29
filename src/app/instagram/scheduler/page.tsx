"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuCalendar, LuPlus, LuImage, LuVideo, LuBot, LuClock, LuChevronLeft } from "react-icons/lu";
import InstagramNotConnected from "@/components/InstagramNotConnected";
import { buildApiUrl } from "@/config/server";

export default function InstagramScheduler() {
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
            <LuCalendar className="text-[#2A8B8A]" size={28} />
            Post Scheduler
          </h1>
          <p className="text-slate-600 mt-1">
            Schedule posts & reels with AI-powered caption suggestions
          </p>
        </div>
        <button className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg">
          <LuPlus size={20} />
          Schedule Post
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuClock size={20} />
          </div>
          <p className="text-2xl font-bold text-black">12</p>
          <p className="text-sm text-slate-600">Scheduled</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuImage size={20} />
          </div>
          <p className="text-2xl font-bold text-black">45</p>
          <p className="text-sm text-slate-600">Published</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuBot size={20} />
          </div>
          <p className="text-2xl font-bold text-black">89</p>
          <p className="text-sm text-slate-600">AI Captions Used</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuVideo size={20} />
          </div>
          <p className="text-2xl font-bold text-black">23</p>
          <p className="text-sm text-slate-600">Reels Scheduled</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-slate-200">
        <h3 className="text-lg font-bold text-black mb-4">AI-Powered Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-black">
              <LuBot className="text-[#2A8B8A]" size={20} />
              <span className="font-semibold">AI Caption Generator</span>
            </div>
            <p className="text-sm text-slate-600 pl-8">
              Generate engaging captions based on your image/video content
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-black">
              <LuClock className="text-[#2A8B8A]" size={20} />
              <span className="font-semibold">Best Time Posting</span>
            </div>
            <p className="text-sm text-slate-600 pl-8">
              AI suggests optimal posting times based on your audience activity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
