"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LuInstagram,
  LuSettings,
  LuLink2,
  LuTrash2,
  LuKey,
  LuShield,
  LuBell,
  LuClock,
  LuToggleLeft,
  LuToggleRight,
  LuSave,
  LuCircleAlert,
  LuCircleCheck,
  LuChevronLeft
} from "react-icons/lu";
import { buildApiUrl } from "@/config/server";

interface InstagramAccount {
  account_id?: string;
  instagram_account_id: string;
  username?: string;
  page_name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  status: string;
  connected_at?: string;
  token_expires_at?: string;
  days_until_expiry?: number;
  needs_attention?: boolean;
}

interface InstagramSettings {
  auto_reply_enabled: boolean;
  auto_reply_delay: number;
  comment_automation_enabled: boolean;
  story_reply_enabled: boolean;
  ai_learning_enabled: boolean;
  notification_enabled: boolean;
  working_hours_enabled: boolean;
  working_hours_start: string;
  working_hours_end: string;
  rate_limit_messages: number;
  rate_limit_period: number;
}

export default function InstagramSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [connectingToInstagram, setConnectingToInstagram] = useState(false);
  const [settings, setSettings] = useState<InstagramSettings>({
    auto_reply_enabled: false,
    auto_reply_delay: 30,
    comment_automation_enabled: false,
    story_reply_enabled: false,
    ai_learning_enabled: true,
    notification_enabled: true,
    working_hours_enabled: false,
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    rate_limit_messages: 50,
    rate_limit_period: 60
  });

  useEffect(() => {
    fetchInstagramAccounts();
    fetchSettings();
  }, []);

  const fetchInstagramAccounts = async () => {
    try {
      setLoading(true);
  const token = localStorage.getItem('token');

  const response = await fetch(buildApiUrl('/api/v1/instagram/status'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Error fetching Instagram accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    // Fetch settings from API or local storage
    const savedSettings = localStorage.getItem('instagram_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const connectInstagram = async () => {
    setConnectingToInstagram(true);

    let redirected = false;

    try {
  const token = localStorage.getItem('token');

  const response = await fetch(buildApiUrl('/api/v1/instagram/connect-url'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to get Instagram connect URL', response.status);
        alert('Unable to start Instagram connection. Please try again.');
        return;
      }

      const data = await response.json();
      console.log('Instagram connect payload:', data);

      window.location.href = data.connectUrl;
      redirected = true;
    } catch (error) {
      console.error('Error initiating Instagram connect flow:', error);
      alert('Unable to start Instagram connection. Please try again.');
    } finally {
      if (!redirected) {
        setConnectingToInstagram(false);
      }
    }
  };

  const disconnectInstagram = async (account: InstagramAccount) => {
    if (!confirm('Are you sure you want to disconnect this Instagram account?')) {
      return;
    }
    
    try {
  const token = localStorage.getItem('token');

  const response = await fetch(buildApiUrl('/api/v1/instagram/disconnect'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: account.account_id,
          instagram_account_id: account.instagram_account_id
        })
      });
      
      if (response.ok) {
        await fetchInstagramAccounts();
      } else {
        alert('Failed to disconnect Instagram account');
      }
    } catch (error) {
      console.error("Error disconnecting Instagram:", error);
      alert('Failed to disconnect Instagram account');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to local storage and API
      localStorage.setItem('instagram_settings', JSON.stringify(settings));
      
      // TODO: Save to backend API
      // const response = await fetch(`${API_BASE_URL}/api/instagram/settings`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(settings)
      // });
      
      setTimeout(() => {
        alert('Settings saved successfully!');
        setSaving(false);
      }, 500);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings');
      setSaving(false);
    }
  };

  const SettingToggle = ({ 
    label, 
    description, 
    enabled, 
    onChange, 
    icon 
  }: { 
    label: string; 
    description: string; 
    enabled: boolean; 
    onChange: (value: boolean) => void;
    icon: React.ReactNode;
  }) => (
    <div className="flex items-start justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-[#2A8B8A]/50 transition-all">
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2 bg-[#2A8B8A]/10 rounded-lg text-[#2A8B8A]">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-black mb-1">{label}</h4>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className="ml-4 flex-shrink-0"
      >
        {enabled ? (
          <LuToggleRight className="text-[#2A8B8A]" size={32} />
        ) : (
          <LuToggleLeft className="text-slate-300" size={32} />
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Button */}
      <Link
        href="/instagram"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-[#2A8B8A] transition-all"
      >
        <LuChevronLeft size={20} />
        <span>Back to Instagram Hub</span>
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#2A8B8A] rounded-xl text-white">
              <LuSettings size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Instagram Settings</h1>
              <p className="text-slate-600">Configure your Instagram automation preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Connected Accounts</h2>
          <button
            onClick={connectInstagram}
            disabled={connectingToInstagram}
            className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <LuLink2 size={18} />
            {connectingToInstagram ? 'Connecting...' : 'Connect Account'}
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg">
            <LuInstagram className="mx-auto mb-3 text-slate-400" size={48} />
            <p className="text-slate-600">No Instagram accounts connected</p>
            <p className="text-sm text-slate-500 mt-1">Connect your Instagram Business account to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.instagram_account_id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  {account.profile_picture_url ? (
                    <img
                      src={account.profile_picture_url}
                      alt={account.username || account.page_name || 'Instagram account'}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2A8B8A] flex items-center justify-center text-white font-bold">
                      {(account.username || account.page_name || 'IG').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-black">
                      @{account.username || account.page_name || account.instagram_account_id}
                    </p>
                    <p className="text-sm text-slate-600">
                      {account.followers_count ? account.followers_count.toLocaleString() : 0} followers
                    </p>
                    {account.token_expires_at && (
                      <p className="text-xs text-slate-500">
                        Token expires {new Date(account.token_expires_at).toLocaleDateString()}
                      </p>
                    )}
                    {account.needs_attention && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <LuCircleAlert size={14} />
                        Action required
                      </p>
                    )}
                    {account.status && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                        Status: {account.status}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => disconnectInstagram(account)}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
                  >
                    <LuTrash2 size={16} />
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automation Settings - Only show when connected */}
      {accounts.length > 0 && (
        <>
          {/* Automation Settings */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <LuShield className="text-[#2A8B8A]" size={24} />
          <h2 className="text-xl font-bold text-black">Automation Settings</h2>
        </div>

        <div className="space-y-3">
          <SettingToggle
            label="Auto-Reply to DMs"
            description="Automatically reply to direct messages using AI"
            enabled={settings.auto_reply_enabled}
            onChange={(value) => setSettings({ ...settings, auto_reply_enabled: value })}
            icon={<LuInstagram size={20} />}
          />

          <SettingToggle
            label="Comment Automation"
            description="Automatically engage with comments on your posts"
            enabled={settings.comment_automation_enabled}
            onChange={(value) => setSettings({ ...settings, comment_automation_enabled: value })}
            icon={<LuInstagram size={20} />}
          />

          <SettingToggle
            label="Story Reply Automation"
            description="Auto-respond to story mentions and replies"
            enabled={settings.story_reply_enabled}
            onChange={(value) => setSettings({ ...settings, story_reply_enabled: value })}
            icon={<LuInstagram size={20} />}
          />

          <SettingToggle
            label="AI Learning"
            description="Allow AI to learn from your interactions to improve responses"
            enabled={settings.ai_learning_enabled}
            onChange={(value) => setSettings({ ...settings, ai_learning_enabled: value })}
            icon={<LuInstagram size={20} />}
          />
        </div>
      </div>

      {/* Response Settings */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <LuClock className="text-[#2A8B8A]" size={24} />
          <h2 className="text-xl font-bold text-black">Response Settings</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Auto-Reply Delay (seconds)
            </label>
            <input
              type="number"
              value={settings.auto_reply_delay}
              onChange={(e) => setSettings({ ...settings, auto_reply_delay: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] text-black"
              min="0"
              max="300"
            />
            <p className="text-xs text-slate-500 mt-1">Delay before sending automated replies (0-300 seconds)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Rate Limit (messages per period)
            </label>
            <input
              type="number"
              value={settings.rate_limit_messages}
              onChange={(e) => setSettings({ ...settings, rate_limit_messages: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] text-black"
              min="1"
              max="1000"
            />
            <p className="text-xs text-slate-500 mt-1">Maximum automated messages per period</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Rate Limit Period (minutes)
            </label>
            <input
              type="number"
              value={settings.rate_limit_period}
              onChange={(e) => setSettings({ ...settings, rate_limit_period: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] text-black"
              min="1"
              max="1440"
            />
            <p className="text-xs text-slate-500 mt-1">Time period for rate limiting (1-1440 minutes)</p>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <LuClock className="text-[#2A8B8A]" size={24} />
          <h2 className="text-xl font-bold text-black">Working Hours</h2>
        </div>

        <SettingToggle
          label="Enable Working Hours"
          description="Only send automated responses during specified hours"
          enabled={settings.working_hours_enabled}
          onChange={(value) => setSettings({ ...settings, working_hours_enabled: value })}
          icon={<LuClock size={20} />}
        />

        {settings.working_hours_enabled && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={settings.working_hours_start}
                onChange={(e) => setSettings({ ...settings, working_hours_start: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                End Time
              </label>
              <input
                type="time"
                value={settings.working_hours_end}
                onChange={(e) => setSettings({ ...settings, working_hours_end: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] text-black"
              />
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* Notifications */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <LuBell className="text-[#2A8B8A]" size={24} />
          <h2 className="text-xl font-bold text-black">Notifications</h2>
        </div>

        <SettingToggle
          label="Enable Notifications"
          description="Receive notifications for important automation events"
          enabled={settings.notification_enabled}
          onChange={(value) => setSettings({ ...settings, notification_enabled: value })}
          icon={<LuBell size={20} />}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-[#2A8B8A] text-white rounded-xl font-semibold hover:bg-[#238080] transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <LuSave size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
