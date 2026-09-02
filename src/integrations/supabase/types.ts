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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          collected_at: string
          comments: number
          created_at: string
          id: string
          impressions: number
          likes: number
          post_id: string
          reach: number
          saves: number
          shares: number
          video_views: number
        }
        Insert: {
          collected_at?: string
          comments?: number
          created_at?: string
          id?: string
          impressions?: number
          likes?: number
          post_id: string
          reach?: number
          saves?: number
          shares?: number
          video_views?: number
        }
        Update: {
          collected_at?: string
          comments?: number
          created_at?: string
          id?: string
          impressions?: number
          likes?: number
          post_id?: string
          reach?: number
          saves?: number
          shares?: number
          video_views?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          items_processed: number
          project_id: string
          retry_count: number
          run_type: Database["public"]["Enums"]["run_type"]
          started_at: string
          status: Database["public"]["Enums"]["run_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_processed?: number
          project_id: string
          retry_count?: number
          run_type: Database["public"]["Enums"]["run_type"]
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_processed?: number
          project_id?: string
          retry_count?: number
          run_type?: Database["public"]["Enums"]["run_type"]
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          ai_confidence: number
          category_id: string | null
          city: string | null
          created_at: string
          discovered_at: string
          duplicate_group_id: string | null
          id: string
          image_url: string | null
          importance_score: number
          is_demo: boolean
          is_duplicate: boolean
          original_content: string | null
          project_id: string
          published_at: string | null
          source_id: string | null
          source_url: string | null
          state: string | null
          status: Database["public"]["Enums"]["news_status"]
          title: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: number
          category_id?: string | null
          city?: string | null
          created_at?: string
          discovered_at?: string
          duplicate_group_id?: string | null
          id?: string
          image_url?: string | null
          importance_score?: number
          is_demo?: boolean
          is_duplicate?: boolean
          original_content?: string | null
          project_id: string
          published_at?: string | null
          source_id?: string | null
          source_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["news_status"]
          title: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: number
          category_id?: string | null
          city?: string | null
          created_at?: string
          discovered_at?: string
          duplicate_group_id?: string | null
          id?: string
          image_url?: string | null
          importance_score?: number
          is_demo?: boolean
          is_duplicate?: boolean
          original_content?: string | null
          project_id?: string
          published_at?: string | null
          source_id?: string | null
          source_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["news_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_analysis: {
        Row: {
          analyzed_at: string | null
          created_at: string
          hashtags: string | null
          id: string
          instagram_caption: string | null
          instagram_title: string | null
          moderation_notes: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          news_id: string
          suggested_art_text: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          analyzed_at?: string | null
          created_at?: string
          hashtags?: string | null
          id?: string
          instagram_caption?: string | null
          instagram_title?: string | null
          moderation_notes?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          news_id: string
          suggested_art_text?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          analyzed_at?: string | null
          created_at?: string
          hashtags?: string | null
          id?: string
          instagram_caption?: string | null
          instagram_title?: string | null
          moderation_notes?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          news_id?: string
          suggested_art_text?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_analysis_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: true
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          created_at: string
          external_post_id: string | null
          id: string
          image_url: string | null
          news_id: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          project_id: string
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          external_post_id?: string | null
          id?: string
          image_url?: string | null
          news_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          project_id: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          external_post_id?: string | null
          id?: string
          image_url?: string | null
          news_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          project_id?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          active: boolean
          city: string
          country: string
          created_at: string
          id: string
          instagram_username: string | null
          name: string
          owner_id: string | null
          profile_name: string | null
          state: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          city: string
          country?: string
          created_at?: string
          id?: string
          instagram_username?: string | null
          name: string
          owner_id?: string | null
          profile_name?: string | null
          state: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          city?: string
          country?: string
          created_at?: string
          id?: string
          instagram_username?: string | null
          name?: string
          owner_id?: string | null
          profile_name?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          approval_required: boolean
          auto_publish_enabled: boolean
          created_at: string
          id: string
          max_posts_per_day: number
          minimum_confidence: number
          minimum_interval_minutes: number
          project_id: string
          updated_at: string
        }
        Insert: {
          approval_required?: boolean
          auto_publish_enabled?: boolean
          created_at?: string
          id?: string
          max_posts_per_day?: number
          minimum_confidence?: number
          minimum_interval_minutes?: number
          project_id: string
          updated_at?: string
        }
        Update: {
          approval_required?: boolean
          auto_publish_enabled?: boolean
          created_at?: string
          id?: string
          max_posts_per_day?: number
          minimum_confidence?: number
          minimum_interval_minutes?: number
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          id: string
          last_checked_at: string | null
          name: string
          project_id: string
          rss_url: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          name: string
          project_id: string
          rss_url?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          name?: string
          project_id?: string
          rss_url?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin_project: { Args: { _name?: string }; Returns: string }
      owns_project: { Args: { _project_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      moderation_status: "pending" | "approved" | "review_required" | "rejected"
      news_status:
        | "new"
        | "analyzing"
        | "awaiting_approval"
        | "approved"
        | "published"
        | "ignored"
        | "duplicate"
        | "review_required"
      post_status:
        | "draft"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      post_type: "feed" | "story" | "reel"
      run_status: "running" | "completed" | "failed" | "partial"
      run_type:
        | "source_scan"
        | "news_analysis"
        | "post_generation"
        | "publication"
        | "analytics"
      source_type: "rss" | "website" | "api" | "official"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      moderation_status: ["pending", "approved", "review_required", "rejected"],
      news_status: [
        "new",
        "analyzing",
        "awaiting_approval",
        "approved",
        "published",
        "ignored",
        "duplicate",
        "review_required",
      ],
      post_status: [
        "draft",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      post_type: ["feed", "story", "reel"],
      run_status: ["running", "completed", "failed", "partial"],
      run_type: [
        "source_scan",
        "news_analysis",
        "post_generation",
        "publication",
        "analytics",
      ],
      source_type: ["rss", "website", "api", "official"],
    },
  },
} as const
