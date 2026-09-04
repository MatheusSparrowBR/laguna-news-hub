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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          project_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          project_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      news_geography: {
        Row: {
          created_at: string
          decision: string
          excluded_localities: string[]
          id: string
          manual_decision: string | null
          matched_entities: string[]
          matched_localities: string[]
          news_id: string
          reason: string | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          score: number
          source_mode: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision: string
          excluded_localities?: string[]
          id?: string
          manual_decision?: string | null
          matched_entities?: string[]
          matched_localities?: string[]
          news_id: string
          reason?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number
          source_mode?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision?: string
          excluded_localities?: string[]
          id?: string
          manual_decision?: string | null
          matched_entities?: string[]
          matched_localities?: string[]
          news_id?: string
          reason?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number
          source_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_geography_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: true
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          kind: string
          message: string | null
          news_id: string | null
          post_id: string | null
          project_id: string
          read_at: string | null
          title: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          kind: string
          message?: string | null
          news_id?: string | null
          post_id?: string | null
          project_id: string
          read_at?: string | null
          title: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
          news_id?: string | null
          post_id?: string | null
          project_id?: string
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsor_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          project_id: string
          provider: string
          state_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          project_id: string
          provider: string
          state_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          project_id?: string
          provider?: string
          state_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      post_assets: {
        Row: {
          asset_type: string
          created_at: string
          file_size: number | null
          height: number | null
          id: string
          mime_type: string | null
          post_id: string
          public_url: string | null
          storage_path: string
          width: number | null
        }
        Insert: {
          asset_type?: string
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          post_id: string
          public_url?: string | null
          storage_path: string
          width?: number | null
        }
        Update: {
          asset_type?: string
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          post_id?: string
          public_url?: string | null
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          campaign_id: string | null
          caption: string | null
          channel: string
          created_at: string
          external_post_id: string | null
          hashtags: string | null
          id: string
          idempotency_key: string | null
          image_url: string | null
          is_sponsored: boolean
          news_id: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          project_id: string
          published_at: string | null
          scheduled_at: string | null
          sponsor_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          template_key: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          caption?: string | null
          channel?: string
          created_at?: string
          external_post_id?: string | null
          hashtags?: string | null
          id?: string
          idempotency_key?: string | null
          image_url?: string | null
          is_sponsored?: boolean
          news_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          project_id: string
          published_at?: string | null
          scheduled_at?: string | null
          sponsor_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          template_key?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          caption?: string | null
          channel?: string
          created_at?: string
          external_post_id?: string | null
          hashtags?: string | null
          id?: string
          idempotency_key?: string | null
          image_url?: string | null
          is_sponsored?: boolean
          news_id?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          project_id?: string
          published_at?: string | null
          scheduled_at?: string | null
          sponsor_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          template_key?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsor_campaigns"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "posts_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
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
      publication_logs: {
        Row: {
          attempt: number
          attempted_at: string
          created_at: string
          error_code: string | null
          error_message: string | null
          external_id: string | null
          id: string
          post_id: string
          provider: string
          published_at: string | null
          response_metadata: Json | null
          status: string
        }
        Insert: {
          attempt?: number
          attempted_at?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          post_id: string
          provider?: string
          published_at?: string | null
          response_metadata?: Json | null
          status?: string
        }
        Update: {
          attempt?: number
          attempted_at?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          post_id?: string
          provider?: string
          published_at?: string | null
          response_metadata?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      social_account_credentials: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          project_id: string
          provider: string
          token_type: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          project_id: string
          provider: string
          token_type?: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          project_id?: string
          provider?: string
          token_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_account_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          account_id: string | null
          connected_at: string | null
          created_at: string
          display_name: string | null
          id: string
          last_verified_at: string | null
          project_id: string
          provider: string
          scopes: string[]
          status: string
          token_expires_at: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_id?: string | null
          connected_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_verified_at?: string | null
          project_id: string
          provider?: string
          scopes?: string[]
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_id?: string | null
          connected_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_verified_at?: string | null
          project_id?: string
          provider?: string
          scopes?: string[]
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          active: boolean
          category_id: string | null
          consecutive_failures: number
          created_at: string
          id: string
          last_checked_at: string | null
          last_error: string | null
          last_http_status: number | null
          last_news_found_at: string | null
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
          consecutive_failures?: number
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          last_http_status?: number | null
          last_news_found_at?: string | null
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
          consecutive_failures?: number
          created_at?: string
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          last_http_status?: number | null
          last_news_found_at?: string | null
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
      sponsor_campaigns: {
        Row: {
          budget: number | null
          contracted_posts: number
          created_at: string
          delivered_posts: number
          description: string | null
          end_date: string | null
          id: string
          name: string
          notes: string | null
          project_id: string
          sponsor_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          contracted_posts?: number
          created_at?: string
          delivered_posts?: number
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          project_id: string
          sponsor_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          contracted_posts?: number
          created_at?: string
          delivered_posts?: number
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          project_id?: string
          sponsor_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_campaigns_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_deliverables: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          notes: string | null
          post_id: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          notes?: string | null
          post_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          post_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_deliverables_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sponsor_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_deliverables_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          active: boolean
          contact_name: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          instagram_handle: string | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          project_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean
          contact_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          project_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean
          contact_name?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          project_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_project_id_fkey"
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
      recalcular_delivered_posts: {
        Args: { _campaign_id: string }
        Returns: undefined
      }
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
        | "rejected"
        | "scheduled"
        | "archived"
      post_status:
        | "draft"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
        | "awaiting_approval"
        | "approved"
        | "queued"
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
        "rejected",
        "scheduled",
        "archived",
      ],
      post_status: [
        "draft",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "cancelled",
        "awaiting_approval",
        "approved",
        "queued",
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
