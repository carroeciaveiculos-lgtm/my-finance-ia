export interface Profile {
  id: string
  email: string | null
  nome: string | null
  created_at: string | null
}

export interface UserSession {
  id: string
  email: string
  nome: string
}
