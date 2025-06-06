export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          twitter_username: string | null;
          farcaster_fid: number | null;
          farcaster_username: string | null;
          farcaster_display_name: string | null;
          neynar_signer_uuid: string | null;
          yolo_mode: boolean | null;
          notifications_enabled: boolean | null;
          auto_approve: boolean | null;
          usdc_balance: number | null;
          total_spent: number | null;
          spending_approved: boolean | null;
          spending_limit: number | null;
          notification_token: string | null;
          notification_url: string | null;
          has_frame: boolean | null;
          wallet_address: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          twitter_username?: string | null;
          farcaster_fid?: number | null;
          farcaster_username?: string | null;
          farcaster_display_name?: string | null;
          neynar_signer_uuid?: string | null;
          yolo_mode?: boolean | null;
          notifications_enabled?: boolean | null;
          auto_approve?: boolean | null;
          usdc_balance?: number | null;
          total_spent?: number | null;
          spending_approved?: boolean | null;
          spending_limit?: number | null;
          notification_token?: string | null;
          notification_url?: string | null;
          has_frame?: boolean | null;
          wallet_address?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          twitter_username?: string | null;
          farcaster_fid?: number | null;
          farcaster_username?: string | null;
          farcaster_display_name?: string | null;
          neynar_signer_uuid?: string | null;
          yolo_mode?: boolean | null;
          notifications_enabled?: boolean | null;
          auto_approve?: boolean | null;
          usdc_balance?: number | null;
          total_spent?: number | null;
          spending_approved?: boolean | null;
          spending_limit?: number | null;
          notification_token?: string | null;
          notification_url?: string | null;
          has_frame?: boolean | null;
          wallet_address?: string | null;
        };
      };
      tweets: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          content: string;
          original_content: string | null;
          twitter_url: string | null;
          twitter_created_at: string | null;
          cast_status:
            | "pending"
            | "approved"
            | "rejected"
            | "cast"
            | "failed"
            | null;
          cast_hash: string | null;
          cast_created_at: string | null;
          cast_price: number | null;
          payment_approved: boolean | null;
          payment_processed: boolean | null;
          is_edited: boolean | null;
          edit_count: number | null;
          auto_cast: boolean | null;
          tweet_id: string | null;
          quoted_tweet_url: string | null;
          media_urls: Record<string, any> | null;
          is_retweet: boolean | null;
          retweet_tweet_id: string | null;
          profile_image_url: string | null;
          twitter_username: string | null;
          twitter_display_name: string | null;
          is_blue_tick_verified: boolean | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          original_content?: string | null;
          twitter_url?: string | null;
          twitter_created_at?: string | null;
          cast_status?:
            | "pending"
            | "approved"
            | "rejected"
            | "cast"
            | "failed"
            | null;
          cast_hash?: string | null;
          cast_created_at?: string | null;
          cast_price?: number | null;
          payment_approved?: boolean | null;
          payment_processed?: boolean | null;
          is_edited?: boolean | null;
          edit_count?: number | null;
          auto_cast?: boolean | null;
          tweet_id?: string | null;
          quoted_tweet_url?: string | null;
          media_urls?: Record<string, any> | null;
          is_retweet?: boolean | null;
          retweet_tweet_id?: string | null;
          profile_image_url?: string | null;
          twitter_username?: string | null;
          twitter_display_name?: string | null;
          is_blue_tick_verified?: boolean | null;
        };
        Update: {
          content?: string;
          original_content?: string | null;
          twitter_url?: string | null;
          twitter_created_at?: string | null;
          cast_status?:
            | "pending"
            | "approved"
            | "rejected"
            | "cast"
            | "failed"
            | null;
          cast_hash?: string | null;
          cast_created_at?: string | null;
          cast_price?: number | null;
          payment_approved?: boolean | null;
          payment_processed?: boolean | null;
          is_edited?: boolean | null;
          edit_count?: number | null;
          auto_cast?: boolean | null;
          tweet_id?: string | null;
          quoted_tweet_url?: string | null;
          media_urls?: Record<string, any> | null;
          is_retweet?: boolean | null;
          retweet_tweet_id?: string | null;
          profile_image_url?: string | null;
          twitter_username?: string | null;
          twitter_display_name?: string | null;
          is_blue_tick_verified?: boolean | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          created_at: string | null;
          user_id: string | null;
          tweet_id: string | null;
          notification_type:
            | "new_tweet_detected"
            | "cast_approved"
            | "cast_rejected"
            | "cast_posted"
            | "payment_required"
            | "balance_low";
          title: string;
          message: string;
          sent: boolean | null;
          read: boolean | null;
          clicked: boolean | null;
          sent_at: string | null;
          delivery_method: "push" | "email" | "in_app" | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          user_id?: string | null;
          tweet_id?: string | null;
          notification_type:
            | "new_tweet_detected"
            | "cast_approved"
            | "cast_rejected"
            | "cast_posted"
            | "payment_required"
            | "balance_low";
          title: string;
          message: string;
          sent?: boolean | null;
          read?: boolean | null;
          clicked?: boolean | null;
          sent_at?: string | null;
          delivery_method?: "push" | "email" | "in_app" | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          user_id?: string | null;
          tweet_id?: string | null;
          notification_type?:
            | "new_tweet_detected"
            | "cast_approved"
            | "cast_rejected"
            | "cast_posted"
            | "payment_required"
            | "balance_low";
          title?: string;
          message?: string;
          sent?: boolean | null;
          read?: boolean | null;
          clicked?: boolean | null;
          sent_at?: string | null;
          delivery_method?: "push" | "email" | "in_app" | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          created_at: string | null;
          user_id: string | null;
          tweet_id: string | null;
          transaction_type: "deposit" | "cast_payment" | "refund";
          amount: number;
          currency: string | null;
          status: "pending" | "completed" | "failed" | "cancelled" | null;
          transaction_hash: string | null;
          block_number: number | null;
          gas_used: number | null;
          description: string | null;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          user_id?: string | null;
          tweet_id?: string | null;
          transaction_type: "deposit" | "cast_payment" | "refund";
          amount: number;
          currency?: string | null;
          status?: "pending" | "completed" | "failed" | "cancelled" | null;
          transaction_hash?: string | null;
          block_number?: number | null;
          gas_used?: number | null;
          description?: string | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          user_id?: string | null;
          tweet_id?: string | null;
          transaction_type?: "deposit" | "cast_payment" | "refund";
          amount?: number;
          currency?: string | null;
          status?: "pending" | "completed" | "failed" | "cancelled" | null;
          transaction_hash?: string | null;
          block_number?: number | null;
          gas_used?: number | null;
          description?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
    };
  };
}
