export type Message = {
  id: string
  content: string
  user_id: string
  user_type: 'owner' | 'guest'
  created_at: string
  type?: 'text' | 'image' | 'audio'
  file_url?: string
  reply_to_id?: string
  reply_to?: Message
  room_id?: string | null
  users?: {
    session_id: string
    theme_id?: string
    room_id?: string | null
  }
  isOptimistic?: boolean
}

export type User = {
  id: string
  user_type: 'owner' | 'guest'
  session_id: string
  last_seen: string
  is_online: boolean
  created_at: string
  theme_id?: string
  room_id?: string | null
}

export type Room = {
  id: string
  password_hash: string
  created_at: string
}
