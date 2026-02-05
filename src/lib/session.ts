export const getSessionId = (): string => {
  if (typeof window === 'undefined') return ''

  try {
    let sessionId = localStorage.getItem('chatroom_session_id')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
      localStorage.setItem('chatroom_session_id', sessionId)
    }
    return sessionId
  } catch (e) {
    // 如果 localStorage 不可用（如隐身模式或禁用 Cookie），生成临时 ID
    console.warn('LocalStorage access failed, using temporary session id', e)
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }
}

export const getUserType = (roomId?: string | null): 'owner' | 'guest' => {
  if (typeof window === 'undefined') return 'guest'
  const key = roomId ? `chatroom_user_type_${roomId}` : 'chatroom_user_type'
  return localStorage.getItem(key) as 'owner' | 'guest' || 'guest'
}

export const setUserType = (userType: 'owner' | 'guest', roomId?: string | null) => {
  if (typeof window === 'undefined') return
  const key = roomId ? `chatroom_user_type_${roomId}` : 'chatroom_user_type'
  localStorage.setItem(key, userType)
}