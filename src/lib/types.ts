export type Message = {
  id: string
  content: string
  user_id: string
  user_type: 'owner' | 'guest'
  created_at: string
  users?: {
    session_id: string
    theme_id?: string
  }
}

export type User = {
  id: string
  user_type: 'owner' | 'guest'
  session_id: string
  last_seen: string
  is_online: boolean
  created_at: string
}
