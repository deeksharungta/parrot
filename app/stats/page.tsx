"use client";

import React, { useEffect, useState } from "react";
import Header from "../components/ui/Header";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { motion } from "framer-motion";
import { analytics } from "@/lib/analytics";

interface StatsData {
  overview: {
    totalUsers: number;
    totalTweets: number;
    totalCasts: number;
    totalTransactions: number;
    totalNotifications: number;
    totalUSDCSpent: number;
    totalUSDCDeposited: number;
  };
  tweets: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cast: number;
    failed: number;
    edited: number;
    retweets: number;
    threads: number;
    successRate: number;
    averageCastPrice: number;
  };
  transactions: {
    total: number;
    deposits: number;
    castPayments: number;
    refunds: number;
    completed: number;
    pending: number;
    failed: number;
    totalAmount: number;
    totalDeposits: number;
    totalSpent: number;
  };
  notifications: {
    total: number;
    sent: number;
    read: number;
    clicked: number;
    newTweetDetected: number;
    castApproved: number;
    castRejected: number;
    castPosted: number;
    paymentRequired: number;
    balanceLow: number;
  };
  userRankings: Array<{
    rank: number;
    username: string;
    displayName: string;
    totalSpent: number;
    joinedAt: string;
  }>;
  allUsers: Array<{
    id: string;
    username: string;
    displayName: string;
    totalSpent: number;
    usdcBalance: number;
    freeCastsLeft: number;
    yoloMode: boolean;
    notificationsEnabled: boolean;
    joinedAt: string;
    daysActive: number;
  }>;
  recentActivity: Array<{
    id: string;
    createdAt: string;
    status: string;
    username: string;
    content: string;
  }>;
  dailyStats: Array<{
    date: string;
    total: number;
    cast: number;
    pending: number;
    rejected: number;
  }>;
  summary: {
    totalCasts: number;
    successRate: number;
    averageCastPrice: number;
    totalUSDCSpent: number;
    totalUsers: number;
    activeUsers: number;
    averageCastsPerUser: number;
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        {icon && <div className="text-orange-500">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {trend && (
          <div
            className={`flex items-center text-sm font-medium ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <span className="mr-1">{trend.isPositive ? "↗" : "↘"}</span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ProgressBar({
  value,
  max,
  label,
  color = "orange",
}: {
  value: number;
  max: number;
  label: string;
  color?: string;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">
          {value} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${
            color === "orange"
              ? "bg-orange-500"
              : color === "green"
                ? "bg-green-500"
                : color === "blue"
                  ? "bg-blue-500"
                  : "bg-gray-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "rank" | "spent" | "balance" | "days" | "username"
  >("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Track page view
  useEffect(() => {
    analytics.trackPageView("stats");
  }, []);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/stats");

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(
            `Failed to fetch stats: ${response.status} ${errorText}`,
          );
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch statistics",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Sort users based on selected criteria
  const sortedUsers = React.useMemo(() => {
    if (!stats?.allUsers) return [];

    return [...stats.allUsers].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case "rank":
          // For rank, we'll sort by total spent (higher spending = better rank)
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case "spent":
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case "balance":
          aValue = a.usdcBalance;
          bValue = b.usdcBalance;
          break;
        case "days":
          aValue = a.daysActive;
          bValue = b.daysActive;
          break;
        case "username":
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        default:
          aValue = a.totalSpent;
          bValue = b.totalSpent;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [stats?.allUsers, sortBy, sortOrder]);

  if (loading) {
    return (
      <div>
        <Header title="Statistics" />
        <div className="flex items-center justify-center h-64">
          <motion.div
            className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <Header title="Statistics" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Failed to load statistics</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Statistics" />

      <motion.div
        className="px-5 pb-20 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Overview Cards */}
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatCard
            title="Total Users"
            value={stats.overview.totalUsers}
            subtitle="Registered users"
            icon="👥"
            delay={0.1}
          />
          <StatCard
            title="Total Casts"
            value={stats.overview.totalCasts}
            subtitle="Successfully posted"
            icon="📊"
            delay={0.2}
          />
          <StatCard
            title="Success Rate"
            value={`${stats.tweets.successRate}%`}
            subtitle="Cast approval rate"
            icon="🎯"
            delay={0.3}
          />
          <StatCard
            title="USDC Spent"
            value={`$${stats.overview.totalUSDCSpent.toFixed(2)}`}
            subtitle="Total spent on casts"
            icon="💰"
            delay={0.4}
          />
        </motion.div>

        {/* Tweet Status Breakdown */}
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Tweet Status
          </h3>
          <div className="space-y-4">
            <ProgressBar
              value={stats.tweets.cast}
              max={stats.tweets.total}
              label="Successfully Cast"
              color="green"
            />
            <ProgressBar
              value={stats.tweets.pending}
              max={stats.tweets.total}
              label="Pending Approval"
              color="orange"
            />
            <ProgressBar
              value={stats.tweets.rejected}
              max={stats.tweets.total}
              label="Rejected"
              color="red"
            />
          </div>
        </motion.div>

        {/* Detailed Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <StatCard
            title="Total Tweets"
            value={stats.tweets.total}
            subtitle="Imported from X"
            delay={0.6}
          />
          <StatCard
            title="Active Users"
            value={stats.summary.activeUsers}
            subtitle="Users who cast tweets"
            delay={0.7}
          />
          <StatCard
            title="Avg Casts/User"
            value={stats.summary.averageCastsPerUser}
            subtitle="Average per user"
            delay={0.8}
          />
          <StatCard
            title="Avg Cast Price"
            value={`$${stats.tweets.averageCastPrice.toFixed(2)}`}
            subtitle="Average cost per cast"
            delay={0.9}
          />
        </motion.div>

        {/* User Rankings */}
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Top Users by Spending
          </h3>
          <div className="space-y-3">
            {stats.userRankings.slice(0, 5).map((user, index) => (
              <motion.div
                key={user.rank}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      user.rank === 1
                        ? "bg-yellow-100 text-yellow-800"
                        : user.rank === 2
                          ? "bg-gray-100 text-gray-800"
                          : user.rank === 3
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.rank}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${user.totalSpent.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Total spent</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* All Users Detailed Stats */}
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              All Users ({stats.allUsers.length})
            </h3>
            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="rank">By Rank</option>
                <option value="spent">By Spending</option>
                <option value="balance">By Balance</option>
                <option value="days">By Days Active</option>
                <option value="username">By Username</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedUsers.map((user, index) => (
              <motion.div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1.3 + index * 0.05 }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      sortBy === "rank" && index < 3
                        ? index === 0
                          ? "bg-yellow-100 text-yellow-800"
                          : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : "bg-orange-100 text-orange-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                    <p className="text-xs text-gray-400">
                      {user.daysActive} days active
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    ${user.totalSpent.toFixed(2)} spent
                  </p>
                  <p className="text-xs text-gray-500">
                    ${user.usdcBalance.toFixed(2)} balance
                  </p>
                  <div className="flex space-x-2">
                    {user.yoloMode && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Yolo
                      </span>
                    )}
                    {user.notificationsEnabled && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Notifications
                      </span>
                    )}
                    {user.freeCastsLeft > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.freeCastsLeft} free
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Transaction Overview */}
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Transaction Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Deposits</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ${stats.transactions.totalDeposits.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Spent</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                ${stats.transactions.totalSpent.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {stats.transactions.completed}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {stats.transactions.failed}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
