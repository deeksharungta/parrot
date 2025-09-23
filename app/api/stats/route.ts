import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Fetch global app statistics
    const [
      totalUsers,
      totalTweets,
      totalTransactions,
      totalNotifications,
      userRankings,
      allUsers,
      recentActivity,
      dailyStats,
      statusBreakdown,
    ] = await Promise.all([
      // Total users count
      supabase
        .from("users")
        .select("id, created_at, total_spent", { count: "exact" }),

      // Total tweets with status breakdown
      supabase
        .from("tweets")
        .select(
          "id, created_at, cast_status, cast_price, is_edited, is_retweet, is_thread_tweet, user_id, twitter_username",
        ),

      // Total transactions
      supabase
        .from("transactions")
        .select("id, created_at, transaction_type, amount, status, user_id"),

      // Total notifications
      supabase
        .from("notifications")
        .select(
          "id, created_at, notification_type, sent, read, clicked, user_id",
        ),

      // User rankings (top users by spending)
      supabase
        .from("users")
        .select(
          "id, farcaster_username, farcaster_display_name, total_spent, created_at",
        )
        .order("total_spent", { ascending: false })
        .limit(10),

      // All users with detailed stats
      supabase
        .from("users")
        .select(
          "id, created_at, farcaster_username, farcaster_display_name, total_spent, usdc_balance, free_casts_left, yolo_mode, notifications_enabled",
        )
        .order("created_at", { ascending: false }),

      // All activity - all users (no time restriction)
      supabase
        .from("tweets")
        .select(
          "id, created_at, cast_status, content, twitter_username, user_id",
        )
        .order("created_at", { ascending: false })
        .limit(50),

      // All daily stats (no time restriction)
      supabase.from("tweets").select("created_at, cast_status, cast_price"),

      // Status breakdown
      supabase
        .from("tweets")
        .select(
          "cast_status, cast_price, is_edited, is_retweet, is_thread_tweet",
        ),
    ]);

    if (totalUsers.error) {
      console.error("Error fetching total users:", totalUsers.error);
      return NextResponse.json(
        { error: "Failed to fetch user statistics" },
        { status: 500 },
      );
    }

    if (totalTweets.error) {
      console.error("Error fetching total tweets:", totalTweets.error);
      return NextResponse.json(
        { error: "Failed to fetch tweet statistics" },
        { status: 500 },
      );
    }

    if (totalTransactions.error) {
      console.error(
        "Error fetching total transactions:",
        totalTransactions.error,
      );
      return NextResponse.json(
        { error: "Failed to fetch transaction statistics" },
        { status: 500 },
      );
    }

    if (totalNotifications.error) {
      console.error(
        "Error fetching total notifications:",
        totalNotifications.error,
      );
      return NextResponse.json(
        { error: "Failed to fetch notification statistics" },
        { status: 500 },
      );
    }

    if (userRankings.error) {
      console.error("Error fetching user rankings:", userRankings.error);
      return NextResponse.json(
        { error: "Failed to fetch user rankings" },
        { status: 500 },
      );
    }

    if (allUsers.error) {
      console.error("Error fetching all users:", allUsers.error);
      return NextResponse.json(
        { error: "Failed to fetch all users" },
        { status: 500 },
      );
    }

    if (recentActivity.error) {
      console.error("Error fetching recent activity:", recentActivity.error);
      return NextResponse.json(
        { error: "Failed to fetch recent activity" },
        { status: 500 },
      );
    }

    const users = totalUsers.data || [];
    const tweets = totalTweets.data || [];
    const transactions = totalTransactions.data || [];
    const notifications = totalNotifications.data || [];
    const topUsers = userRankings.data || [];
    const allUsersData = allUsers.data || [];
    const recentTweets = recentActivity.data || [];
    const dailyData = dailyStats.data || [];
    const statusData = statusBreakdown.data || [];

    // Calculate global app statistics
    const stats = {
      overview: {
        totalUsers: totalUsers.count || users.length,
        totalTweets: tweets.length,
        totalCasts: tweets.filter((t) => t.cast_status === "cast").length,
        totalTransactions: transactions.length,
        totalNotifications: notifications.length,
        totalUSDCSpent: transactions
          .filter(
            (t) =>
              t.transaction_type === "cast_payment" && t.status === "completed",
          )
          .reduce((sum, t) => sum + t.amount, 0),
        totalUSDCDeposited: transactions
          .filter(
            (t) => t.transaction_type === "deposit" && t.status === "completed",
          )
          .reduce((sum, t) => sum + t.amount, 0),
      },
      tweets: {
        total: tweets.length,
        pending: tweets.filter((t) => t.cast_status === "pending").length,
        approved: tweets.filter((t) => t.cast_status === "approved").length,
        rejected: tweets.filter((t) => t.cast_status === "rejected").length,
        cast: tweets.filter((t) => t.cast_status === "cast").length,
        failed: tweets.filter((t) => t.cast_status === "failed").length,
        edited: tweets.filter((t) => t.is_edited).length,
        retweets: tweets.filter((t) => t.is_retweet).length,
        threads: tweets.filter((t) => t.is_thread_tweet).length,
        successRate:
          tweets.length > 0
            ? Math.round(
                (tweets.filter((t) => t.cast_status === "cast").length /
                  tweets.length) *
                  100,
              )
            : 0,
        averageCastPrice:
          tweets.filter((t) => t.cast_price && t.cast_price > 0).length > 0
            ? Math.round(
                (tweets
                  .filter((t) => t.cast_price && t.cast_price > 0)
                  .reduce((sum, t) => sum + (t.cast_price || 0), 0) /
                  tweets.filter((t) => t.cast_price && t.cast_price > 0)
                    .length) *
                  100,
              ) / 100
            : 0,
      },
      transactions: {
        total: transactions.length,
        deposits: transactions.filter((t) => t.transaction_type === "deposit")
          .length,
        castPayments: transactions.filter(
          (t) => t.transaction_type === "cast_payment",
        ).length,
        refunds: transactions.filter((t) => t.transaction_type === "refund")
          .length,
        completed: transactions.filter((t) => t.status === "completed").length,
        pending: transactions.filter((t) => t.status === "pending").length,
        failed: transactions.filter((t) => t.status === "failed").length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        totalDeposits: transactions
          .filter(
            (t) => t.transaction_type === "deposit" && t.status === "completed",
          )
          .reduce((sum, t) => sum + t.amount, 0),
        totalSpent: transactions
          .filter(
            (t) =>
              t.transaction_type === "cast_payment" && t.status === "completed",
          )
          .reduce((sum, t) => sum + t.amount, 0),
      },
      notifications: {
        total: notifications.length,
        sent: notifications.filter((n) => n.sent).length,
        read: notifications.filter((n) => n.read).length,
        clicked: notifications.filter((n) => n.clicked).length,
        newTweetDetected: notifications.filter(
          (n) => n.notification_type === "new_tweet_detected",
        ).length,
        castApproved: notifications.filter(
          (n) => n.notification_type === "cast_approved",
        ).length,
        castRejected: notifications.filter(
          (n) => n.notification_type === "cast_rejected",
        ).length,
        castPosted: notifications.filter(
          (n) => n.notification_type === "cast_posted",
        ).length,
        paymentRequired: notifications.filter(
          (n) => n.notification_type === "payment_required",
        ).length,
        balanceLow: notifications.filter(
          (n) => n.notification_type === "balance_low",
        ).length,
      },
      userRankings: topUsers.map((user, index) => ({
        rank: index + 1,
        username:
          user.farcaster_username || user.farcaster_display_name || "Unknown",
        displayName: user.farcaster_display_name,
        totalSpent: user.total_spent || 0,
        joinedAt: user.created_at,
      })),
      allUsers: allUsersData.map((user) => ({
        id: user.id,
        username:
          user.farcaster_username || user.farcaster_display_name || "Unknown",
        displayName: user.farcaster_display_name,
        totalSpent: user.total_spent || 0,
        usdcBalance: user.usdc_balance || 0,
        freeCastsLeft: user.free_casts_left || 0,
        yoloMode: user.yolo_mode || false,
        notificationsEnabled: user.notifications_enabled || false,
        joinedAt: user.created_at,
        daysActive: user.created_at
          ? Math.ceil(
              (Date.now() - new Date(user.created_at).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
      })),
      recentActivity: recentTweets.map((tweet) => ({
        id: tweet.id,
        createdAt: tweet.created_at,
        status: tweet.cast_status,
        username: tweet.twitter_username || "Unknown",
        content:
          tweet.content?.substring(0, 100) +
          (tweet.content?.length > 100 ? "..." : ""),
      })),
      dailyStats: (() => {
        // Group daily data by date
        const dailyMap = new Map();
        dailyData.forEach((tweet) => {
          const date = new Date(tweet.created_at).toISOString().split("T")[0];
          if (!dailyMap.has(date)) {
            dailyMap.set(date, {
              date,
              total: 0,
              cast: 0,
              pending: 0,
              rejected: 0,
            });
          }
          const dayData = dailyMap.get(date);
          dayData.total++;
          if (tweet.cast_status === "cast") dayData.cast++;
          else if (tweet.cast_status === "pending") dayData.pending++;
          else if (tweet.cast_status === "rejected") dayData.rejected++;
        });
        return Array.from(dailyMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      })(),
      summary: {
        totalCasts: tweets.filter((t) => t.cast_status === "cast").length,
        successRate:
          tweets.length > 0
            ? Math.round(
                (tweets.filter((t) => t.cast_status === "cast").length /
                  tweets.length) *
                  100,
              )
            : 0,
        averageCastPrice:
          tweets.filter((t) => t.cast_price && t.cast_price > 0).length > 0
            ? Math.round(
                (tweets
                  .filter((t) => t.cast_price && t.cast_price > 0)
                  .reduce((sum, t) => sum + (t.cast_price || 0), 0) /
                  tweets.filter((t) => t.cast_price && t.cast_price > 0)
                    .length) *
                  100,
              ) / 100
            : 0,
        totalUSDCSpent: transactions
          .filter(
            (t) =>
              t.transaction_type === "cast_payment" && t.status === "completed",
          )
          .reduce((sum, t) => sum + t.amount, 0),
        totalUsers: totalUsers.count || users.length,
        activeUsers: new Set(tweets.map((t) => t.user_id)).size,
        averageCastsPerUser:
          users.length > 0
            ? Math.round((tweets.length / users.length) * 100) / 100
            : 0,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error in stats API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
