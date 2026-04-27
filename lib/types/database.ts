export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type VideoStatus = "todo" | "doing" | "done";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          theme_preference: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          theme_preference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          theme_preference?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      video_logs: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          status: VideoStatus;
          last_position: number;
          watch_seconds: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          status?: VideoStatus;
          last_position?: number;
          watch_seconds?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          status?: VideoStatus;
          last_position?: number;
          watch_seconds?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          id: string;
          video_id: string;
          user_id: string;
          comment: string | null;
          rating: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          user_id: string;
          comment?: string | null;
          rating?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          user_id?: string;
          comment?: string | null;
          rating?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      search_keywords: {
        Row: {
          id: string;
          keyword: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          keyword: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          keyword?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      search_channels: {
        Row: {
          id: string;
          channel_url: string;
          channel_name: string | null;
          channel_id: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_url: string;
          channel_name?: string | null;
          channel_id?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_url?: string;
          channel_name?: string | null;
          channel_id?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      youtube_videos: {
        Row: {
          id: string;
          title: string;
          channel_title: string;
          channel_id: string | null;
          thumbnail: string;
          published_at: string;
          view_count: number;
          duration: string;
          is_korean: boolean;
          is_global: boolean;
          matched_keywords: string[];
          matched_channels: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          channel_title: string;
          channel_id?: string | null;
          thumbnail: string;
          published_at: string;
          view_count?: number;
          duration: string;
          is_korean?: boolean;
          is_global?: boolean;
          matched_keywords?: string[];
          matched_channels?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          channel_title?: string;
          channel_id?: string | null;
          thumbnail?: string;
          published_at?: string;
          view_count?: number;
          duration?: string;
          is_korean?: boolean;
          is_global?: boolean;
          matched_keywords?: string[];
          matched_channels?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      video_status: VideoStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
