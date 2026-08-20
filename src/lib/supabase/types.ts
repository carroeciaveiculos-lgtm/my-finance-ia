// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          categoria_pai_id: string | null
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          categoria_pai_id?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          categoria_pai_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_categoria_pai_id_fkey"
            columns: ["categoria_pai_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacao: {
        Row: {
          created_at: string
          data_correspondencia: string | null
          documento_id: string | null
          id: string
          lancamento_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_correspondencia?: string | null
          documento_id?: string | null
          id?: string
          lancamento_id?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_correspondencia?: string | null
          documento_id?: string | null
          id?: string
          lancamento_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliacao_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_importados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacao_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      consorcios: {
        Row: {
          created_at: string
          id: string
          nome: string
          parcelas_pagas: number
          parcelas_total: number
          status: string
          updated_at: string
          user_id: string
          valor_credito: number
          valor_parcela: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          parcelas_pagas?: number
          parcelas_total: number
          status: string
          updated_at?: string
          user_id: string
          valor_credito: number
          valor_parcela: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          parcelas_pagas?: number
          parcelas_total?: number
          status?: string
          updated_at?: string
          user_id?: string
          valor_credito?: number
          valor_parcela?: number
        }
        Relationships: []
      }
      contas: {
        Row: {
          banco: string | null
          created_at: string
          id: string
          nome: string
          saldo_inicial: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          banco?: string | null
          created_at?: string
          id?: string
          nome: string
          saldo_inicial?: number
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          banco?: string | null
          created_at?: string
          id?: string
          nome?: string
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dividas: {
        Row: {
          created_at: string
          id: string
          nome: string
          parcelas_pagas: number
          parcelas_total: number | null
          status: string | null
          taxa_juros: number | null
          updated_at: string
          user_id: string
          valor_pago: number
          valor_total: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          parcelas_pagas?: number
          parcelas_total?: number | null
          status?: string | null
          taxa_juros?: number | null
          updated_at?: string
          user_id: string
          valor_pago?: number
          valor_total: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          parcelas_pagas?: number
          parcelas_total?: number | null
          status?: string | null
          taxa_juros?: number | null
          updated_at?: string
          user_id?: string
          valor_pago?: number
          valor_total?: number
        }
        Relationships: []
      }
      documentos_importados: {
        Row: {
          caminho_storage: string | null
          conta_id: string | null
          created_at: string
          id: string
          nome_arquivo: string
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          caminho_storage?: string | null
          conta_id?: string | null
          created_at?: string
          id?: string
          nome_arquivo: string
          status: string
          tipo: string
          user_id: string
        }
        Update: {
          caminho_storage?: string | null
          conta_id?: string | null
          created_at?: string
          id?: string
          nome_arquivo?: string
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_importados_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
        ]
      }
      investimentos: {
        Row: {
          created_at: string
          data_aplicacao: string | null
          id: string
          nome: string
          tipo: string | null
          updated_at: string
          user_id: string
          valor_aplicado: number
          valor_atual: number
        }
        Insert: {
          created_at?: string
          data_aplicacao?: string | null
          id?: string
          nome: string
          tipo?: string | null
          updated_at?: string
          user_id: string
          valor_aplicado: number
          valor_atual: number
        }
        Update: {
          created_at?: string
          data_aplicacao?: string | null
          id?: string
          nome?: string
          tipo?: string | null
          updated_at?: string
          user_id?: string
          valor_aplicado?: number
          valor_atual?: number
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          categoria_id: string | null
          conta_id: string | null
          created_at: string
          data: string
          descricao: string | null
          documento_id: string | null
          id: string
          subcategoria_id: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          conta_id?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          subcategoria_id?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          conta_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          documento_id?: string | null
          id?: string
          subcategoria_id?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_importados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          created_at: string
          data_limite: string | null
          id: string
          nome: string
          status: string | null
          updated_at: string
          user_id: string
          valor_atual: number
          valor_objetivo: number
        }
        Insert: {
          created_at?: string
          data_limite?: string | null
          id?: string
          nome: string
          status?: string | null
          updated_at?: string
          user_id: string
          valor_atual?: number
          valor_objetivo: number
        }
        Update: {
          created_at?: string
          data_limite?: string | null
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          valor_atual?: number
          valor_objetivo?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nome?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      seguros: {
        Row: {
          created_at: string
          data_inicio: string | null
          data_vigencia: string | null
          id: string
          nome: string
          seguradora: string | null
          status: string | null
          tipo: string | null
          updated_at: string
          user_id: string
          valor_premio: number | null
        }
        Insert: {
          created_at?: string
          data_inicio?: string | null
          data_vigencia?: string | null
          id?: string
          nome: string
          seguradora?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          user_id: string
          valor_premio?: number | null
        }
        Update: {
          created_at?: string
          data_inicio?: string | null
          data_vigencia?: string | null
          id?: string
          nome?: string
          seguradora?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
          user_id?: string
          valor_premio?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

