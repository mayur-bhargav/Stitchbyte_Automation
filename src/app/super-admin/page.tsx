"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import { apiService } from "../services/apiService";
import {
  LuBuilding2,
  LuUsers,
  LuUserCheck,
  LuCreditCard,
  LuIndianRupee,
  LuActivity,
  LuTrendingUp,
  LuSearch,
  LuChevronLeft,
  LuChevronRight,
  LuLoaderCircle,
  LuClock,
  LuCalendar,
  LuMail,
  LuPhone,
  LuShield
} from "react-icons/lu";

interface DashboardStats {
  total_companies: number;
  total_users: number;
  total_team_members: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  mrr: number;
  total_automations: number;
  total_campaigns: number;
  total_contacts: number;
  messages_today: number;
  new_signups_30_days: number;
  churn_rate: number;
}

interface Company {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  created_at: string;
  user_count: number;
  owner_email?: string;
  subscription?: {
    plan_id: string;
    status: string;
    end_date?: string;
  };
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  created_at: string;
  company_name?: string;
  subscription?: {
    plan_id: string;
    status: string;
    end_date?: string;
  };
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date?: string;
  user_email?: string;
  user_name?: string;
}

const SUPER_ADMIN_EMAILS = ["admin@stitchbyte.com", "info@stitchbyte.in", "mayurbhargava026@gmail.com"];

export default function SuperAdminPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "companies" | "users" | "subscriptions">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    // Check if user is super admin
    if (!user || !SUPER_ADMIN_EMAILS.includes(user.email)) {
      router.push("/dashboard");
      return;
    }

    loadDashboardData();
  }, [user, router]);

  useEffect(() => {
    if (activeTab === "companies") {
      loadCompanies();
    } else if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "subscriptions") {
      loadSubscriptions();
    }
  }, [activeTab, currentPage, searchQuery]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOptional<DashboardStats>("/super-admin/dashboard/stats");
      if (response) setStats(response);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      if (searchQuery) queryParams.append('search', searchQuery);
      
      const response = await apiService.getOptional<{ companies: Company[], total_pages: number }>(`/super-admin/companies?${queryParams.toString()}`);
      if (response) {
        setCompanies(response.companies);
        setTotalPages(response.total_pages);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      if (searchQuery) queryParams.append('search', searchQuery);
      
      const response = await apiService.getOptional<{ users: User[], total_pages: number }>(`/super-admin/users?${queryParams.toString()}`);
      if (response) {
        setUsers(response.users);
        setTotalPages(response.total_pages);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      
      const response = await apiService.getOptional<{ subscriptions: Subscription[], total_pages: number }>(`/super-admin/subscriptions?${queryParams.toString()}`);
      if (response) {
        setSubscriptions(response.subscriptions);
        setTotalPages(response.total_pages);
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      trial: "bg-blue-100 text-blue-700",
      premium: "bg-purple-100 text-purple-700"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  const getPlanBadge = (planId: string) => {
    const colors = {
      basic: "bg-blue-100 text-blue-700",
      pro: "bg-purple-100 text-purple-700",
      enterprise: "bg-orange-100 text-orange-700",
      starter: "bg-green-100 text-green-700"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[planId as keyof typeof colors] || "bg-gray-100 text-gray-700"}`}>
        {planId}
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LuLoaderCircle className="w-12 h-12 animate-spin text-[#25D366] mx-auto mb-4" />
          <p className="text-gray-600">Loading super admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <LuShield className="w-8 h-8 text-[#25D366]" />
            <h1 className="text-3xl font-bold text-gray-900">StitchByte Super Admin</h1>
          </div>
          <p className="text-gray-600">Platform-wide monitoring and management</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LuBuilding2 className="w-8 h-8 text-blue-500" />
                <span className="text-sm text-gray-500">Companies</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_companies || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{stats.new_signups_30_days || 0} new (30d)</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LuUsers className="w-8 h-8 text-purple-500" />
                <span className="text-sm text-gray-500">Total Users</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_users || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{stats.total_team_members || 0} team members</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LuCreditCard className="w-8 h-8 text-green-500" />
                <span className="text-sm text-gray-500">Subscriptions</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.active_subscriptions || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{stats.expired_subscriptions || 0} expired</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LuIndianRupee className="w-8 h-8 text-orange-500" />
                <span className="text-sm text-gray-500">MRR</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.mrr || 0)}</div>
              <div className="text-sm text-gray-600 mt-1">{(stats.churn_rate || 0).toFixed(1)}% churn</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LuActivity className="w-8 h-8 text-indigo-500" />
                <span className="text-sm text-gray-500">Automations</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_automations || 0}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LuTrendingUp className="w-8 h-8 text-pink-500" />
                <span className="text-sm text-gray-500">Campaigns</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_campaigns || 0}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LuUserCheck className="w-8 h-8 text-cyan-500" />
                <span className="text-sm text-gray-500">Contacts</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_contacts || 0}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <LuActivity className="w-8 h-8 text-teal-500" />
                <span className="text-sm text-gray-500">Messages Today</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.messages_today || 0}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab("overview"); setCurrentPage(1); }}
              className={`px-6 py-4 font-medium ${activeTab === "overview" ? "text-[#25D366] border-b-2 border-[#25D366]" : "text-gray-600 hover:text-gray-900"}`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveTab("companies"); setCurrentPage(1); }}
              className={`px-6 py-4 font-medium ${activeTab === "companies" ? "text-[#25D366] border-b-2 border-[#25D366]" : "text-gray-600 hover:text-gray-900"}`}
            >
              Companies
            </button>
            <button
              onClick={() => { setActiveTab("users"); setCurrentPage(1); }}
              className={`px-6 py-4 font-medium ${activeTab === "users" ? "text-[#25D366] border-b-2 border-[#25D366]" : "text-gray-600 hover:text-gray-900"}`}
            >
              Users
            </button>
            <button
              onClick={() => { setActiveTab("subscriptions"); setCurrentPage(1); }}
              className={`px-6 py-4 font-medium ${activeTab === "subscriptions" ? "text-[#25D366] border-b-2 border-[#25D366]" : "text-gray-600 hover:text-gray-900"}`}
            >
              Subscriptions
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Platform Health</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-2xl font-bold">
                        {((stats.active_subscriptions || 0) + (stats.expired_subscriptions || 0)) > 0 
                          ? (((stats.active_subscriptions || 0) / ((stats.active_subscriptions || 0) + (stats.expired_subscriptions || 0))) * 100).toFixed(1)
                          : '0.0'}%
                      </div>
                      <div className="text-sm opacity-90">Active Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {(stats.total_companies || 0) > 0 
                          ? ((stats.total_users || 0) / (stats.total_companies || 1)).toFixed(1)
                          : '0.0'}
                      </div>
                      <div className="text-sm opacity-90">Avg Users/Company</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {(stats.total_companies || 0) > 0 
                          ? ((stats.total_automations || 0) / (stats.total_companies || 1)).toFixed(1)
                          : '0.0'}
                      </div>
                      <div className="text-sm opacity-90">Avg Automations</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {(stats.total_companies || 0) > 0 
                          ? ((stats.total_contacts || 0) / (stats.total_companies || 1)).toFixed(0)
                          : '0'}
                      </div>
                      <div className="text-sm opacity-90">Avg Contacts</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "companies" && (
              <div>
                <div className="mb-4">
                  <div className="relative">
                    <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search companies..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <LuLoaderCircle className="w-8 h-8 animate-spin text-[#25D366] mx-auto" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {companies.map((company) => (
                          <tr key={company.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{company.company_name}</div>
                              <div className="text-sm text-gray-500">{company.company_email}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{company.owner_email || "-"}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{company.user_count}</td>
                            <td className="px-4 py-3">
                              {company.subscription ? (
                                <div className="flex gap-2">
                                  {getPlanBadge(company.subscription.plan_id)}
                                  {getStatusBadge(company.subscription.status)}
                                </div>
                              ) : (
                                <span className="text-gray-400">No subscription</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(company.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "users" && (
              <div>
                <div className="mb-4">
                  <div className="relative">
                    <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <LuLoaderCircle className="w-8 h-8 animate-spin text-[#25D366] mx-auto" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.company_name || "-"}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {user.subscription ? (
                                <div className="flex gap-2">
                                  {getPlanBadge(user.subscription.plan_id)}
                                  {getStatusBadge(user.subscription.status)}
                                </div>
                              ) : (
                                <span className="text-gray-400">No subscription</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "subscriptions" && (
              <div>
                {loading ? (
                  <div className="text-center py-12">
                    <LuLoaderCircle className="w-8 h-8 animate-spin text-[#25D366] mx-auto" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {subscriptions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{sub.user_name || "Unknown"}</div>
                              <div className="text-sm text-gray-500">{sub.user_email || "-"}</div>
                            </td>
                            <td className="px-4 py-3">{getPlanBadge(sub.plan_id)}</td>
                            <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sub.start_date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{sub.end_date ? formatDate(sub.end_date) : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {activeTab !== "overview" && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LuChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <LuChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
