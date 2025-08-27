"use client";

import React, { useState, useEffect } from "react";
import WabaRegistration from "../components/WabaRegistration";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import { apiService } from "../services/apiService";
// import ConnectionStatus from "../components/ConnectionStatus";

const STITCHBYTE_PRIMARY = "#2A8B8A";
const STITCHBYTE_SECONDARY = "#238080";
const FONT_FAMILY = "'Inter', 'Segoe UI', Arial, sans-serif";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  companyName: string;
  role: string;
  subscription?: {
    plan_id: string;
    plan_name: string;
    status: string;
    end_date: string;
    trial_end_date?: string;
    auto_renew: boolean;
  };
}

export default function SettingsPage() {
  // --- Meta OAuth Config ---
  const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || "1717883002200842";
  const REDIRECT_URI = process.env.NEXT_PUBLIC_META_REDIRECT_URI || "http://localhost:8000/api/auth/meta/callback";
  // Updated scope to include all required permissions for WhatsApp Business API
  const SCOPE = "whatsapp_business_management,whatsapp_business_messaging,business_management,pages_read_engagement,pages_manage_metadata";
  // In production, get this from backend for CSRF protection
  const STATE = "stitchbyte_csrf_token";

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication and fetch user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Settings page: Token found:", !!token);
    
    if (!token) {
      console.log("Settings page: No token, redirecting to home");
      router.push("/");
      return;
    }

    // Clear any previous errors
    setError("");

    // Fetch current user data
    const fetchUser = async () => {
      try {
        console.log("Fetching user data...");
        const response = await fetch("http://localhost:8000/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log("Unauthorized, redirecting to login");
            localStorage.removeItem("token");
            router.push("/");
            return;
          }
          // For other errors, try to get the error message
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
          } catch {
            throw new Error(`Failed to fetch user data: HTTP ${response.status}`);
          }
        }
        
        const data = await response.json();
        console.log("User data:", data);
        setUser(data.user || data); // Handle both {user: {...}} and direct user object
      } catch (error) {
        console.error("Error fetching user:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        
        // Provide more specific error messages
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
          setError("Unable to connect to the server. Please check if the backend is running on port 8000.");
        } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          setError("Your session has expired. Please sign in again.");
          localStorage.removeItem("token");
          router.push("/");
          return;
        } else {
          setError(`Failed to load user data: ${errorMessage}`);
        }
        // Don't redirect on network errors, let user see the error and try again
      } finally {
        setAuthLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Fetch connection status for the current user's company
  useEffect(() => {
    if (!user) return;
    
    const fetchConnection = async () => {
      setLoading(true);
      try {
        console.log("Fetching WhatsApp connection for company:", user.companyId);
        console.log("User object:", user);
        
        // Use the new API service method
        const response = await apiService.getWhatsAppConfig(user.companyId);
        console.log("WhatsApp config data:", response);
        
        // Handle the wrapped response structure: {success: true, data: {...}}
        const data = response?.success ? response.data : response;
        console.log("Extracted data:", data);
        
        if (data && (data.selected_option || data.phone_number_id || data.status === 'connected')) {
          console.log("✅ Connection found, setting connection state");
          setConnection(data);
        } else {
          console.log("❌ No WhatsApp connection found or invalid data structure");
          console.log("Data structure received:", JSON.stringify(response, null, 2));
          setConnection(null);
        }
      } catch (error) {
        console.error("❌ Error fetching connection:", error);
        setConnection(null);
        setError("Failed to load WhatsApp connection status. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchConnection();
  }, [user]);

  const handleConnect = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    // Include user and company information in the state parameter for multi-tenant support
    const stateData = {
      csrf: STATE,
      userId: user.id,
      companyId: user.companyId,
      email: user.email
    };
    const encodedState = btoa(JSON.stringify(stateData));
    
    try {
      // Option 1: Get OAuth URL from backend (recommended for production)
      try {
        const response = await apiService.getMetaOAuthUrl();
        if (response?.oauth_url) {
          window.location.href = response.oauth_url;
          return;
        }
      } catch (backendError) {
        console.warn('Backend OAuth URL failed, falling back to direct URL:', backendError);
      }
      
      // Option 2: Fallback - Use corrected OAuth URL with v19.0 and proper scopes
      const metaLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPE}&response_type=code&state=${encodedState}`;
      window.location.href = metaLoginUrl;
      
    } catch (error) {
      console.error('Error initiating Meta OAuth:', error);
      setError('Failed to initiate WhatsApp connection. Please try again.');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    const confirmDisconnect = window.confirm("Are you sure you want to disconnect your WhatsApp Business account?");
    if (!confirmDisconnect) return;

    try {
      setLoading(true);
      setError("");
      
      // Use API service for disconnect
      await apiService.deleteWhatsAppConfig();
      
      setConnection(null);
      setSuccess("WhatsApp account disconnected successfully");
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (error) {
      console.error('Error disconnecting WhatsApp account:', error);
      setError("Failed to disconnect WhatsApp account");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError("");
      
      // Get reconnect URL from backend
      const response = await apiService.getReconnectUrl();
      
      if (response?.url) {
        window.location.href = response.url;
      } else {
        setError("Failed to get reconnect URL");
      }
      
    } catch (error) {
      console.error('Error getting reconnect URL:', error);
      setError("Failed to initiate reconnection");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError("");
      
      // Refresh WhatsApp configuration
      await apiService.refreshWhatsAppConfig();
      
      // Refetch the connection data
      const response = await apiService.getWhatsAppConfig(user.companyId);
      
      // Handle the wrapped response structure: {success: true, data: {...}}
      const data = response?.success ? response.data : response;
      
      if (data && (data.selected_option || data.phone_number_id || data.status === 'connected')) {
        setConnection(data);
        setSuccess("WhatsApp configuration refreshed successfully");
      } else {
        setConnection(null);
        setError("No WhatsApp connection found after refresh");
      }
      
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (error) {
      console.error('Error refreshing WhatsApp config:', error);
      setError("Failed to refresh WhatsApp configuration");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (authLoading) {
    return (
      <section className="min-h-screen bg-[#F0F6FF] flex flex-col items-center justify-center px-4" style={{ fontFamily: FONT_FAMILY }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A8B8A] mx-auto mb-4"></div>
          <p className="text-[#65676b]">Loading settings...</p>
        </div>
      </section>
    );
  }

  // Show error state if user failed to load but we're not loading
  if (!user && !authLoading && error) {
    return (
      <section className="min-h-screen bg-[#F0F6FF] flex flex-col items-center justify-center px-4" style={{ fontFamily: FONT_FAMILY }}>
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#2B1A5A] mb-2">Unable to Load Settings</h2>
          <p className="text-[#65676b] mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-[#2A8B8A] text-white px-4 py-2 rounded-lg hover:bg-[#238080] transition shadow-lg"
            >
              Refresh Page
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="block w-full text-[#2A8B8A] border border-[#2A8B8A] px-4 py-2 rounded-lg hover:bg-[#2A8B8A] hover:text-white transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </section>
    );
  }

  // If still loading or no user yet, show loading
  if (!user) {
    return (
      <section className="min-h-screen bg-[#F0F6FF] flex flex-col items-center justify-center px-4" style={{ fontFamily: FONT_FAMILY }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A8B8A] mx-auto mb-4"></div>
          <p className="text-[#65676b]">Loading settings...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#F0F6FF] flex flex-col items-center justify-center px-4" style={{ fontFamily: FONT_FAMILY }}>
      <div className="w-full max-w-2xl space-y-6">
        
        {/* User Information Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: STITCHBYTE_PRIMARY }}>Account Settings</h2>
              <p className="text-[#65676b] mt-1">Manage your account and integrations</p>
              {/* <ConnectionStatus className="mt-2" /> */}
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-[#65676b] hover:text-red-600 border border-gray-300/50 rounded-lg hover:border-red-300 transition bg-white/80 backdrop-blur-sm"
            >
              Sign Out
            </button>
          </div>

          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-[#2B1A5A]">User Information</h3>
              <div className="space-y-3">
                <div className="bg-[#f0f2f5]/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                  <div className="text-xs text-[#65676b] mb-1">User ID</div>
                  <div className="font-mono text-sm text-[#2B1A5A]">{user.id}</div>
                </div>
                <div className="bg-[#f0f2f5]/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                  <div className="text-xs text-[#65676b] mb-1">Name</div>
                  <div className="text-sm text-[#2B1A5A] font-medium">{user.firstName} {user.lastName}</div>
                </div>
                <div className="bg-[#f0f2f5]/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                  <div className="text-xs text-[#65676b] mb-1">Email</div>
                  <div className="text-sm text-[#2B1A5A]">{user.email}</div>
                </div>
                <div className="bg-[#f0f2f5]/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                  <div className="text-xs text-[#65676b] mb-1">Role</div>
                  <div className="text-sm text-[#2B1A5A] capitalize">{user.role}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-[#2B1A5A]">Company Information</h3>
              <div className="space-y-3">
                <div className="bg-[#f0f2f5]/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                  <div className="text-xs text-[#65676b] mb-1">Company ID</div>
                  <div className="font-mono text-sm text-[#2B1A5A]">{user.companyId}</div>
                </div>
                <div className="bg-[#f0f2f5]/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                  <div className="text-xs text-[#65676b] mb-1">Company Name</div>
                  <div className="text-sm text-[#2B1A5A] font-medium">{user.companyName}</div>
                </div>
                {user.subscription && (
                  <>
                    <div className="bg-[#f0f2f5]/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                      <div className="text-xs text-[#65676b] mb-1">Current Plan</div>
                      <div className="text-sm text-[#2B1A5A] font-medium">{user.subscription.plan_name}</div>
                      <div className={`text-xs mt-1 font-medium ${
                        user.subscription.status === 'active' ? 'text-green-600' : 
                        user.subscription.status === 'trial' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {user.subscription.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="bg-[#f0f2f5]/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                      <div className="text-xs text-[#65676b] mb-1">Plan Expires</div>
                      <div className="text-sm text-[#2B1A5A]">
                        {new Date(user.subscription.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Integration Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
          <h3 className="text-lg font-semibold mb-2 text-[#2B1A5A]">WhatsApp Business Integration</h3>
          <p className="mb-6 text-[#65676b] text-sm">Connect your WhatsApp Business number to send messages through StitchByte.</p>
          
          {connection ? (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className="bg-green-50/80 backdrop-blur-sm rounded-lg p-4 border border-green-200/50 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="font-semibold text-green-800">WhatsApp Business Connected</div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-sm text-green-700 font-medium">Business Account:</div>
                    <div className="text-lg text-green-800 font-bold">
                      {connection.selected_option?.business_name || connection.business_name || "Connected Account"}
                    </div>
                  </div>
                  <div className="text-xs text-green-600">
                    ✓ Ready to send and receive messages
                  </div>
                </div>
              </div>

              {/* WhatsApp Business Account Details */}
              {connection.selected_option && (
                <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50">
                  <h4 className="font-semibold text-blue-800 mb-3">Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-blue-600 font-medium">WABA ID:</div>
                      <div className="text-blue-800 font-mono">{connection.selected_option.waba_id}</div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-medium">Account Name:</div>
                      <div className="text-blue-800">{connection.selected_option.name}</div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-medium">Currency:</div>
                      <div className="text-blue-800">{connection.selected_option.currency}</div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-medium">Review Status:</div>
                      <div className={`font-medium ${
                        connection.selected_option.review_status === 'APPROVED' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {connection.selected_option.review_status}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-medium">Namespace:</div>
                      <div className="text-blue-800 font-mono text-xs">{connection.selected_option.namespace}</div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-medium">Connected At:</div>
                      <div className="text-blue-800 text-xs">
                        {new Date(connection.selected_option.connected_at || connection.connected_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone Numbers */}
              {connection.phone_numbers && connection.phone_numbers.length > 0 && (
                <div className="bg-purple-50/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200/50">
                  <h4 className="font-semibold text-purple-800 mb-3">Phone Numbers</h4>
                  <div className="space-y-2">
                    {connection.phone_numbers.map((phone: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                        <div>
                          <div className="font-medium text-purple-800">
                            {phone.display_phone_number || phone.phone_number}
                          </div>
                          <div className="text-xs text-purple-600">
                            ID: {phone.id} • Status: {phone.status || 'Active'}
                          </div>
                        </div>
                        {phone.verified_name && (
                          <div className="text-xs text-purple-600">
                            Verified: {phone.verified_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleRefresh}
                  className="flex-1 bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-600 transition text-sm flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? "Refreshing..." : "Refresh Config"}
                </button>
                <button
                  onClick={handleReconnect}
                  className="flex-1 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-[#20B85A] transition text-sm flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  {loading ? "Connecting..." : "Reconnect"}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-3 text-sm text-red-600 hover:text-red-700 border border-red-300/50 rounded-lg hover:border-red-400 transition bg-white/80 backdrop-blur-sm"
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-[#2A8B8A] rounded-full"></div>
                  <div className="font-semibold text-[#2A8B8A]">Connect WhatsApp</div>
                </div>
                <div className="text-sm text-blue-700 mb-3">
                  Connect your WhatsApp Business number to start sending messages. If you don't have a business number, you can use Meta's test number.
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-md p-3 border border-blue-200/50">
                  <div className="text-xs text-blue-600 mb-1">What you'll connect:</div>
                  <div className="text-sm text-blue-800">
                    • Your WhatsApp Business number (if you have one)
                  </div>
                  <div className="text-sm text-blue-800">
                    • Or Meta's test number for testing
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleConnect}
                className="w-full bg-[#25D366] text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-[#20B85A] transition text-base flex items-center justify-center gap-2"
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                {loading ? "Connecting..." : "Connect WhatsApp Business"}
              </button>
            </div>
          )}
          
          {error && <div className="text-[#e55353] text-center mt-4 p-3 bg-red-50/80 backdrop-blur-sm rounded-lg border border-red-200/50 shadow-lg">{error}</div>}
          {success && <div className="text-[#31a24c] text-center mt-4 p-3 bg-green-50/80 backdrop-blur-sm rounded-lg border border-green-200/50 shadow-lg">{success}</div>}
        </div>
      {/* WABA Registration Button/Prompt */}
      <div className="mt-8">
        <WabaRegistration />
      </div>
      </div>
    </section>
  );
}
