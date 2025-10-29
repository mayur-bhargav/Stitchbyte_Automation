"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LuChartBar, LuTrendingUp, LuUsers, LuHeart, LuMessageCircle, LuImage, LuChevronLeft } from "react-icons/lu";
import InstagramNotConnected from "@/components/InstagramNotConnected";
import { buildApiUrl } from "@/config/server";

export default function InstagramAnalytics() {
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
          <LuChartBar className="text-[#2A8B8A]" size={28} />
          Instagram Analytics
        </h1>
        <p className="text-slate-600 mt-1">
          Comprehensive insights across all Instagram automation activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuMessageCircle size={20} />
          </div>
          <p className="text-2xl font-bold text-black">1,247</p>
          <p className="text-sm text-slate-600">Total DMs</p>
          <p className="text-xs text-[#2A8B8A] mt-2">↑ 12% vs last month</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuHeart size={20} />
          </div>
          <p className="text-2xl font-bold text-black">8.4%</p>
          <p className="text-sm text-slate-600">Engagement Rate</p>
          <p className="text-xs text-[#2A8B8A] mt-2">↑ 2.1% vs last month</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuUsers size={20} />
          </div>
          <p className="text-2xl font-bold text-black">456</p>
          <p className="text-sm text-slate-600">New Leads</p>
          <p className="text-xs text-[#2A8B8A] mt-2">↑ 24% vs last month</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A] w-fit mb-3">
            <LuImage size={20} />
          </div>
          <p className="text-2xl font-bold text-black">45</p>
          <p className="text-sm text-slate-600">Posts Published</p>
          <p className="text-xs text-[#2A8B8A] mt-2">↑ 8% vs last month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-black mb-4">Response Times</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">AI Responses</span>
                <span className="text-sm font-semibold text-black">{"< 30s"}</span>
              </div>
              <div className="w-full bg-slate-200  rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "95%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Manual Responses</span>
                <span className="text-sm font-semibold text-black">~15min</span>
              </div>
              <div className="w-full bg-slate-200  rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-black mb-4">Top Performing Content</h3>
          <div className="space-y-3">
            {["Summer Collection Reel", "Behind The Scenes Story", "Product Launch Post"].map((content, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 /50 rounded-lg">
                <span className="text-sm font-medium text-black">{content}</span>
                <div className="flex items-center gap-2">
                  <LuTrendingUp className="text-[#2A8B8A]" size={16} />
                  <span className="text-sm font-semibold text-[#2A8B8A]">{(85 - i * 10).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-black mb-4">Conversion Funnel</h3>
        <div className="space-y-4">
          {[
            { stage: "Story Views", value: 10000, percentage: 100 },
            { stage: "Story Replies", value: 850, percentage: 8.5 },
            { stage: "DM Conversations", value: 520, percentage: 5.2 },
            { stage: "Qualified Leads", value: 234, percentage: 2.34 },
            { stage: "Conversions", value: 89, percentage: 0.89 }
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-black">{item.stage}</span>
                <span className="text-sm font-semibold text-slate-600">
                  {item.value.toLocaleString()} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-[#2A8B8A] h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
