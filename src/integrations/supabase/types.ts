export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          status: string | null
          stems_url: string | null
          tags: string[] | null
          title: string
          track_type: string | null
          upload_date: string | null
        }
        Insert: {
          audio_file?: string | null
          audio_preview?: string | null
          basic_license_price_diaspora?: number | null
          basic_license_price_local?: number | null
          bpm?: number | null
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
          status?: string | null
          stems_url?: string | null
          tags?: string[] | null
          title: string
          track_type?: string | null
          upload_date?: string | null
        }
        Update: {
          audio_file?: string | null
          audio_preview?: string | null
          basic_license_price_diaspora?: number | null
          basic_license_price_local?: number | null
          bpm?: number | null
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
          status?: string | null
          stems_url?: string | null
          tags?: string[] | null
          title?: string
          track_type?: string | null
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
          password_hash: string
          paystack_id: string | null
          paystack_split_code: string | null
          paystack_subaccount_code: string | null
          profile_picture: string | null
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
          password_hash: string
          paystack_id?: string | null
          paystack_split_code?: string | null
          paystack_subaccount_code?: string | null
          profile_picture?: string | null
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
          password_hash?: string
          paystack_id?: string | null
          paystack_split_code?: string | null
          paystack_subaccount_code?: string | null
          profile_picture?: string | null
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
        Args: { user_id_param: string; beat_id_param: string }
        Returns: undefined
      }
      check_follow_status: {
        Args: { p_follower_id: string; p_followee_id: string }
        Returns: boolean
      }
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      delete_beat_favorites: {
        Args: { beat_id_param: string }
        Returns: undefined
      }
      follow_producer: {
        Args: { p_follower_id: string; p_followee_id: string }
        Returns: undefined
      }
      get_complete_schema: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_producer_of_week: {
        Args: Record<PropertyKey, never>
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
          password_hash: string
          paystack_id: string | null
          paystack_split_code: string | null
          paystack_subaccount_code: string | null
          profile_picture: string | null
          role: string
          settings: Json | null
          stage_name: string | null
          status: string | null
          storefront_url: string | null
          stripe_id: string | null
          verified_account_name: string | null
          wallet_address: string | null
        }[]
      }
      get_random_published_beats: {
        Args: { beat_count?: number }
        Returns: {
          id: string
          title: string
          producer_id: string
        }[]
      }
      get_random_published_beats_by_category: {
        Args: { beat_count?: number; category?: string }
        Returns: {
          id: string
          title: string
          producer_id: string
        }[]
      }
      get_user_favorites: {
        Args: { user_id_param: string }
        Returns: {
          beat_id: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_producer: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      producer_has_beat_in_order: {
        Args: { order_id: string }
        Returns: boolean
      }
      producer_owns_beat: {
        Args: { beat_id: string }
        Returns: boolean
      }
      refresh_auth_token: {
        Args: {
          p_user_id: string
          p_refresh_token: string
          p_new_access_token: string
          p_new_refresh_token?: string
        }
        Returns: boolean
      }
      remove_favorite: {
        Args: { user_id_param: string; beat_id_param: string }
        Returns: undefined
      }
      unfollow_producer: {
        Args: { p_follower_id: string; p_followee_id: string }
        Returns: undefined
      }
      update_session_version: {
        Args: { p_user_id: string; p_version: string }
        Returns: undefined
      }
      user_owns_order: {
        Args: { order_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
