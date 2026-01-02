export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      auth_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auth_sessions: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          refresh_token: string | null
          updated_at: string
          user_id: string | null
          version: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string | null
          version?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      beats: {
        Row: {
          audio_file: string | null
          audio_preview: string | null
          basic_license_price_diaspora: number | null
          basic_license_price_local: number | null
          bpm: number | null
          category: string
          cover_image: string | null
          custom_license_price_diaspora: number | null
          custom_license_price_local: number | null
          description: string | null
          exclusive_license_price_diaspora: number | null
          exclusive_license_price_local: number | null
          favorites_count: number | null
          genre: string | null
          id: string
          is_featured: boolean | null
          is_trending: boolean | null
          is_weekly_pick: boolean | null
          key: string | null
          license_terms: string | null
          license_type: string | null
          plays: number | null
          premium_license_price_diaspora: number | null
          premium_license_price_local: number | null
          producer_id: string
          purchase_count: number | null
          soundpack_id: string | null
          status: string | null
          stems_url: string | null
          tags: string[] | null
          title: string
          track_type: string | null
          type: string | null
          upload_date: string | null
        }
        Insert: {
          audio_file?: string | null
          audio_preview?: string | null
          basic_license_price_diaspora?: number | null
          basic_license_price_local?: number | null
          bpm?: number | null
          category?: string
          cover_image?: string | null
          custom_license_price_diaspora?: number | null
          custom_license_price_local?: number | null
          description?: string | null
          exclusive_license_price_diaspora?: number | null
          exclusive_license_price_local?: number | null
          favorites_count?: number | null
          genre?: string | null
          id?: string
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_weekly_pick?: boolean | null
          key?: string | null
          license_terms?: string | null
          license_type?: string | null
          plays?: number | null
          premium_license_price_diaspora?: number | null
          premium_license_price_local?: number | null
          producer_id: string
          purchase_count?: number | null
          soundpack_id?: string | null
          status?: string | null
          stems_url?: string | null
          tags?: string[] | null
          title: string
          track_type?: string | null
          type?: string | null
          upload_date?: string | null
        }
        Update: {
          audio_file?: string | null
          audio_preview?: string | null
          basic_license_price_diaspora?: number | null
          basic_license_price_local?: number | null
          bpm?: number | null
          category?: string
          cover_image?: string | null
          custom_license_price_diaspora?: number | null
          custom_license_price_local?: number | null
          description?: string | null
          exclusive_license_price_diaspora?: number | null
          exclusive_license_price_local?: number | null
          favorites_count?: number | null
          genre?: string | null
          id?: string
          is_featured?: boolean | null
          is_trending?: boolean | null
          is_weekly_pick?: boolean | null
          key?: string | null
          license_terms?: string | null
          license_type?: string | null
          plays?: number | null
          premium_license_price_diaspora?: number | null
          premium_license_price_local?: number | null
          producer_id?: string
          purchase_count?: number | null
          soundpack_id?: string | null
          status?: string | null
          stems_url?: string | null
          tags?: string[] | null
          title?: string
          track_type?: string | null
          type?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beats_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beats_soundpack_id_fkey"
            columns: ["soundpack_id"]
            isOneToOne: false
            referencedRelation: "soundpacks"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          added_at: string
          beat_id: string
          cart_id: string
          id: string
          license_type: string
          quantity: number
        }
        Insert: {
          added_at?: string
          beat_id: string
          cart_id: string
          id?: string
          license_type?: string
          quantity?: number
        }
        Update: {
          added_at?: string
          beat_id?: string
          cart_id?: string
          id?: string
          license_type?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          action_url: string | null
          created_at: string | null
          created_by: string | null
          description: string
          frequency: string
          id: string
          is_active: boolean | null
          points: number
          title: string
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          points?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          points?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string | null
          followee_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          followee_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          followee_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          beat_id: string
          currency_code: string
          id: string
          order_id: string
          price_charged: number
          quantity: number | null
        }
        Insert: {
          beat_id: string
          currency_code: string
          id?: string
          order_id: string
          price_charged: number
          quantity?: number | null
        }
        Update: {
          beat_id?: string
          currency_code?: string
          id?: string
          order_id?: string
          price_charged?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_date: string | null
          id: string
          is_read: boolean | null
          notification_type: string
          recipient_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_date?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          recipient_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_date?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          recipient_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity?: number
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          consent_timestamp: string | null
          currency_used: string
          id: string
          order_date: string | null
          payment_method: string
          payment_reference: string | null
          split_code: string | null
          status: string | null
          total_price: number
          transaction_signatures: string[] | null
        }
        Insert: {
          buyer_id: string
          consent_timestamp?: string | null
          currency_used: string
          id?: string
          order_date?: string | null
          payment_method: string
          payment_reference?: string | null
          split_code?: string | null
          status?: string | null
          total_price: number
          transaction_signatures?: string[] | null
        }
        Update: {
          buyer_id?: string
          consent_timestamp?: string | null
          currency_used?: string
          id?: string
          order_date?: string | null
          payment_method?: string
          payment_reference?: string | null
          split_code?: string | null
          status?: string | null
          total_price?: number
          transaction_signatures?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          id: string
          order_id: string
          payment_date: string | null
          payment_details: Json | null
          payment_method: string
          platform_share: number | null
          producer_share: number | null
          status: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          id?: string
          order_id: string
          payment_date?: string | null
          payment_details?: Json | null
          payment_method: string
          platform_share?: number | null
          producer_share?: number | null
          status?: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          id?: string
          order_id?: string
          payment_date?: string | null
          payment_details?: Json | null
          payment_method?: string
          platform_share?: number | null
          producer_share?: number | null
          status?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          beat_id: string | null
          created_at: string | null
          failure_reason: string | null
          id: string
          payment_id: string | null
          payout_date: string | null
          producer_id: string
          status: string
          transaction_details: Json | null
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          beat_id?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payment_id?: string | null
          payout_date?: string | null
          producer_id: string
          status?: string
          transaction_details?: Json | null
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          beat_id?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payment_id?: string | null
          payout_date?: string | null
          producer_id?: string
          status?: string
          transaction_details?: Json | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          beats: string[] | null
          cover_image: string | null
          created_date: string | null
          id: string
          is_public: boolean | null
          name: string
          owner_id: string
        }
        Insert: {
          beats?: string[] | null
          cover_image?: string | null
          created_date?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          owner_id: string
        }
        Update: {
          beats?: string[] | null
          cover_image?: string | null
          created_date?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          referral_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          referral_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          referral_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_logs_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          referred_email: string | null
          referred_user_id: string | null
          referrer_user_id: string
          reward_points: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id: string
          reward_points?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_points?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_splits: {
        Row: {
          beat_id: string
          created_date: string | null
          id: string
          party_email: string | null
          party_id: string | null
          party_name: string | null
          party_role: string | null
          percentage: number
        }
        Insert: {
          beat_id: string
          created_date?: string | null
          id?: string
          party_email?: string | null
          party_id?: string | null
          party_name?: string | null
          party_role?: string | null
          percentage: number
        }
        Update: {
          beat_id?: string
          created_date?: string | null
          id?: string
          party_email?: string | null
          party_id?: string | null
          party_name?: string | null
          party_role?: string | null
          percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "royalty_splits_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "royalty_splits_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          link_url: string | null
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          message: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          message?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      soundpacks: {
        Row: {
          basic_license_price_diaspora: number | null
          basic_license_price_local: number | null
          category: string | null
          cover_art_url: string | null
          created_at: string | null
          currency_code: string | null
          custom_license_price_diaspora: number | null
          custom_license_price_local: number | null
          description: string | null
          exclusive_license_price_diaspora: number | null
          exclusive_license_price_local: number | null
          file_count: number | null
          id: string
          license_terms: string | null
          license_type: string | null
          metadata: Json | null
          premium_license_price_diaspora: number | null
          premium_license_price_local: number | null
          producer_id: string
          published: boolean | null
          purchase_count: number | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          basic_license_price_diaspora?: number | null
          basic_license_price_local?: number | null
          category?: string | null
          cover_art_url?: string | null
          created_at?: string | null
          currency_code?: string | null
          custom_license_price_diaspora?: number | null
          custom_license_price_local?: number | null
          description?: string | null
          exclusive_license_price_diaspora?: number | null
          exclusive_license_price_local?: number | null
          file_count?: number | null
          id?: string
          license_terms?: string | null
          license_type?: string | null
          metadata?: Json | null
          premium_license_price_diaspora?: number | null
          premium_license_price_local?: number | null
          producer_id: string
          published?: boolean | null
          purchase_count?: number | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          basic_license_price_diaspora?: number | null
          basic_license_price_local?: number | null
          category?: string | null
          cover_art_url?: string | null
          created_at?: string | null
          currency_code?: string | null
          custom_license_price_diaspora?: number | null
          custom_license_price_local?: number | null
          description?: string | null
          exclusive_license_price_diaspora?: number | null
          exclusive_license_price_local?: number | null
          file_count?: number | null
          id?: string
          license_terms?: string | null
          license_type?: string | null
          metadata?: Json | null
          premium_license_price_diaspora?: number | null
          premium_license_price_local?: number | null
          producer_id?: string
          published?: boolean | null
          purchase_count?: number | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soundpacks_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url: string
          status?: string
          task_id: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchased_beats: {
        Row: {
          beat_id: string
          currency_code: string
          id: string
          license_type: string | null
          order_id: string
          purchase_date: string | null
          user_id: string
        }
        Insert: {
          beat_id: string
          currency_code: string
          id?: string
          license_type?: string | null
          order_id: string
          purchase_date?: string | null
          user_id: string
        }
        Update: {
          beat_id?: string
          currency_code?: string
          id?: string
          license_type?: string | null
          order_id?: string
          purchase_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchased_beats_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchased_beats_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchased_beats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchased_soundpacks: {
        Row: {
          id: string
          order_id: string | null
          pack_id: string
          purchase_date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          pack_id: string
          purchase_date?: string | null
          user_id: string
        }
        Update: {
          id?: string
          order_id?: string | null
          pack_id?: string
          purchase_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchased_soundpacks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchased_soundpacks_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "soundpacks"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_number: string | null
          bank_code: string | null
          bio: string | null
          country: string | null
          created_date: string | null
          email: string
          favorites: Json | null
          featured_beats: Json | null
          follower_count: number | null
          full_name: string
          id: string
          is_producer_of_week: boolean | null
          music_interests: string[] | null
          notifications_opt_in: boolean | null
          onboarding_completed: boolean | null
          paystack_id: string | null
          paystack_split_code: string | null
          paystack_subaccount_code: string | null
          profile_picture: string | null
          referral_code: string | null
          referral_points: number | null
          referred_count: number | null
          role: string
          settings: Json | null
          stage_name: string | null
          status: string | null
          storefront_url: string | null
          stripe_id: string | null
          verified_account_name: string | null
          wallet_address: string | null
        }
        Insert: {
          account_number?: string | null
          bank_code?: string | null
          bio?: string | null
          country?: string | null
          created_date?: string | null
          email: string
          favorites?: Json | null
          featured_beats?: Json | null
          follower_count?: number | null
          full_name: string
          id?: string
          is_producer_of_week?: boolean | null
          music_interests?: string[] | null
          notifications_opt_in?: boolean | null
          onboarding_completed?: boolean | null
          paystack_id?: string | null
          paystack_split_code?: string | null
          paystack_subaccount_code?: string | null
          profile_picture?: string | null
          referral_code?: string | null
          referral_points?: number | null
          referred_count?: number | null
          role: string
          settings?: Json | null
          stage_name?: string | null
          status?: string | null
          storefront_url?: string | null
          stripe_id?: string | null
          verified_account_name?: string | null
          wallet_address?: string | null
        }
        Update: {
          account_number?: string | null
          bank_code?: string | null
          bio?: string | null
          country?: string | null
          created_date?: string | null
          email?: string
          favorites?: Json | null
          featured_beats?: Json | null
          follower_count?: number | null
          full_name?: string
          id?: string
          is_producer_of_week?: boolean | null
          music_interests?: string[] | null
          notifications_opt_in?: boolean | null
          onboarding_completed?: boolean | null
          paystack_id?: string | null
          paystack_split_code?: string | null
          paystack_subaccount_code?: string | null
          profile_picture?: string | null
          referral_code?: string | null
          referral_points?: number | null
          referred_count?: number | null
          role?: string
          settings?: Json | null
          stage_name?: string | null
          status?: string | null
          storefront_url?: string | null
          stripe_id?: string | null
          verified_account_name?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_favorite: {
        Args: { beat_id_param: string; user_id_param: string }
        Returns: undefined
      }
      award_referral_success: {
        Args: { referral_uuid: string; reward_points?: number }
        Returns: {
          message: string
          referrer_id: string
          success: boolean
          total_points: number
        }[]
      }
      award_task_points: {
        Args: { admin_user_id: string; submission_uuid: string }
        Returns: boolean
      }
      check_follow_status: {
        Args: { p_followee_id: string; p_follower_id: string }
        Returns: boolean
      }
      check_table_exists: { Args: { table_name: string }; Returns: boolean }
      delete_beat_favorites: {
        Args: { beat_id_param: string }
        Returns: undefined
      }
      finalize_order_fulfillment: {
        Args: { p_order_id: string }
        Returns: Json
      }
      follow_producer: {
        Args: { p_followee_id: string; p_follower_id: string }
        Returns: undefined
      }
      generate_referral_code: { Args: never; Returns: string }
      get_complete_schema: { Args: never; Returns: Json }
      get_producer_of_week: {
        Args: never
        Returns: {
          account_number: string | null
          bank_code: string | null
          bio: string | null
          country: string | null
          created_date: string | null
          email: string
          favorites: Json | null
          featured_beats: Json | null
          follower_count: number | null
          full_name: string
          id: string
          is_producer_of_week: boolean | null
          music_interests: string[] | null
          notifications_opt_in: boolean | null
          onboarding_completed: boolean | null
          paystack_id: string | null
          paystack_split_code: string | null
          paystack_subaccount_code: string | null
          profile_picture: string | null
          referral_code: string | null
          referral_points: number | null
          referred_count: number | null
          role: string
          settings: Json | null
          stage_name: string | null
          status: string | null
          storefront_url: string | null
          stripe_id: string | null
          verified_account_name: string | null
          wallet_address: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "users"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_random_published_beats: {
        Args: { beat_count?: number }
        Returns: {
          id: string
          producer_id: string
          title: string
        }[]
      }
      get_random_published_beats_by_category: {
        Args: { beat_count?: number; category?: string }
        Returns: {
          id: string
          producer_id: string
          title: string
        }[]
      }
      get_user_favorites: {
        Args: { user_id_param: string }
        Returns: {
          beat_id: string
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      increment_counter: {
        Args: { p_column_name: string; p_id: string; p_table_name: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_producer: { Args: never; Returns: boolean }
      producer_has_beat_in_order: {
        Args: { order_id: string }
        Returns: boolean
      }
      producer_owns_beat: { Args: { beat_id: string }; Returns: boolean }
      refresh_auth_token: {
        Args: {
          p_new_access_token: string
          p_new_refresh_token?: string
          p_refresh_token: string
          p_user_id: string
        }
        Returns: boolean
      }
      remove_favorite: {
        Args: { beat_id_param: string; user_id_param: string }
        Returns: undefined
      }
      unfollow_producer: {
        Args: { p_followee_id: string; p_follower_id: string }
        Returns: undefined
      }
      update_session_version: {
        Args: { p_user_id: string; p_version: string }
        Returns: undefined
      }
      user_owns_order: { Args: { order_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
