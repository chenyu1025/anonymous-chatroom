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

export const getUserType = (): 'owner' | 'guest' => {
  if (typeof window === 'undefined') return 'guest'
  return localStorage.getItem('chatroom_user_type') as 'owner' | 'guest' || 'guest'
}

export const setUserType = (userType: 'owner' | 'guest') => {
  if (typeof window === 'undefined') return
  localStorage.setItem('chatroom_user_type', userType)
}