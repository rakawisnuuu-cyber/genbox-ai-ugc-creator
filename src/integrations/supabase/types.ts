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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      characters: {
        Row: {
          age_range: string
          config: Json | null
          created_at: string
          description: string
          gender: string
          gradient_from: string
          gradient_to: string
          hero_image_url: string | null
          id: string
          identity_prompt: string | null
          is_preset: boolean
          name: string
          reference_images: string[] | null
          reference_photo_url: string | null
          shot_metadata: Json | null
          style: string
          tags: string[] | null
          thumbnail_url: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string
          config?: Json | null
          created_at?: string
          description?: string
          gender?: string
          gradient_from?: string
          gradient_to?: string
          hero_image_url?: string | null
          id?: string
          identity_prompt?: string | null
          is_preset?: boolean
          name: string
          reference_images?: string[] | null
          reference_photo_url?: string | null
          shot_metadata?: Json | null
          style?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string
          config?: Json | null
          created_at?: string
          description?: string
          gender?: string
          gradient_from?: string
          gradient_to?: string
          hero_image_url?: string | null
          id?: string
          identity_prompt?: string | null
          is_preset?: boolean
          name?: string
          reference_images?: string[] | null
          reference_photo_url?: string | null
          shot_metadata?: Json | null
          style?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          character_id: string | null
          created_at: string
          id: string
          image_url: string | null
          metadata: Json | null
          model: string
          prompt: string | null
          provider: string
          status: string
          type: string
          upscale_factor: number | null
          upscaled_url: string | null
          user_id: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          model?: string
          prompt?: string | null
          provider?: string
          status?: string
          type?: string
          upscale_factor?: number | null
          upscaled_url?: string | null
          user_id: string
        }
        Update: {
          character_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          model?: string
          prompt?: string | null
          provider?: string
          status?: string
          type?: string
          upscale_factor?: number | null
          upscaled_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          uses_remaining: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          uses_remaining?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          uses_remaining?: number | null
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          id: string
          image_credits: number
          updated_at: string
          user_id: string
          video_credits: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_credits?: number
          updated_at?: string
          user_id: string
          video_credits?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_credits?: number
          updated_at?: string
          user_id?: string
          video_credits?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      video_projects: {
        Row: {
          aspect_ratio: string
          character_id: string | null
          created_at: string
          final_video_url: string | null
          id: string
          model: string
          modules: Json
          product_image_url: string | null
          status: string
          template: string
          title: string
          total_duration: number
          updated_at: string
          user_id: string
          with_dialogue: boolean
        }
        Insert: {
          aspect_ratio?: string
          character_id?: string | null
          created_at?: string
          final_video_url?: string | null
          id?: string
          model?: string
          modules?: Json
          product_image_url?: string | null
          status?: string
          template: string
          title?: string
          total_duration?: number
          updated_at?: string
          user_id: string
          with_dialogue?: boolean
        }
        Update: {
          aspect_ratio?: string
          character_id?: string | null
          created_at?: string
          final_video_url?: string | null
          id?: string
          model?: string
          modules?: Json
          product_image_url?: string | null
          status?: string
          template?: string
          title?: string
          total_duration?: number
          updated_at?: string
          user_id?: string
          with_dialogue?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "video_projects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
