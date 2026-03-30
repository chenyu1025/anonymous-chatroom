'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import MessageBubble from '@/components/MessageBubble'
import MessageInput from '@/components/MessageInput'
import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'
import { getSessionId, getUserType, setUserType as setSessionUserType } from '@/lib/session'
import { Settings, X, Palette, LogOut, ChevronDown, Plus, Share2, Check } from 'lucide-react'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import ThemeSelector from '@/components/ThemeSelector'
import { DEFAULT_THEME_ID, OWNER_THEMES } from '@/lib/themes'
import ClickSparkles from '@/components/ClickSparkles'
import FluidCursorTrail from '@/components/FluidCursorTrail'
import { soundManager } from '@/lib/sound'
import { FullScreenEffectType, getEasterEgg } from '@/lib/easter-eggs'
import FullScreenEffects from '@/components/FullScreenEffects'

interface ChatRoomProps {
  roomId?: string | null
}

export default function ChatRoom({ roomId = null }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState(1)
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUserUuid, setCurrentUserUuid] = useState('')
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'owner' | 'guest'>('guest')
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [currentThemeId, setCurrentThemeId] = useState(DEFAULT_THEME_ID)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // 全屏特效状态
  const [fullScreenEffect, setFullScreenEffect] = useState<FullScreenEffectType>('none')
  const [effectKey, setEffectKey] = useState(0)

  // 使用 ref 来追踪最新状态，以便在闭包中使用
  const currentThemeIdRef = useRef(DEFAULT_THEME_ID)
  const currentUserUuidRef = useRef('')
  const ownerIdRef = useRef('')

  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isBirthday, setIsBirthday] = useState(false)

  // 获取当前主题对象
  const currentTheme = OWNER_THEMES.find(t => t.id === currentThemeId) || OWNER_THEMES[0]

  // 检查是否是 3.25 生日
  useEffect(() => {
    const checkBirthday = () => {
      const now = new Date()
      const is325 = now.getMonth() === 2 && now.getDate() === 25 // 3月是 month 2
      setIsBirthday(is325)
    }

    checkBirthday()
    // 每天检查一次 (或者如果用户跨夜了)
    const timer = setInterval(checkBirthday, 60000 * 60)
    return () => clearInterval(timer)
  }, [])

  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const isLoadingMoreRef = useRef(false)
  const atBottomStateRef = useRef(true)

  const router = useRouter()

  // 获取在线用户数
  const fetchOnlineUsers = async () => {
    try {
      const url = roomId ? `/api/users?roomId=${roomId}` : '/api/users'
      const res = await fetch(url)
      const data = await res.json()
      if (data.users) {
        setOnlineUsers(data.users.length)
        console.log('Online users:', data.users.length)
      }
    } catch (error) {
      console.error('Failed to fetch online users:', error)
    }
  }

  // 初始化用户
  useEffect(() => {
    const sessionId = getSessionId()
    const type = getUserType(roomId)
    setCurrentUserId(sessionId)
    setUserType(type)
    setLoading(false)

    // 立即获取一次在线人数
    fetchOnlineUsers()
    // 每 30 秒更新一次在线人数
    const onlineInterval = setInterval(fetchOnlineUsers, 30000)

    // 心跳机制：每 60 秒上报一次在线状态，确保“只浏览不发消息”的用户也被算作在线
    const heartbeatInterval = setInterval(() => {
      if (sessionId) {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userType: type,
            sessionId: sessionId,
            roomId: roomId || null
            // 不传 themeId，避免覆盖可能已更新的主题，仅更新 last_seen
          })
        }).catch(err => console.error('Heartbeat failed:', err))
      }
    }, 60000)

    // 尝试从本地存储恢复主题
    const savedThemeId = localStorage.getItem('chatroom_theme_id')
    if (savedThemeId) {
      setCurrentThemeId(savedThemeId)
      currentThemeIdRef.current = savedThemeId
    }

    // 上报在线状态
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userType: type,
        sessionId: sessionId,
        themeId: savedThemeId, // 如果本地有保存的主题，带上它以确保数据库与本地一致（尤其是新建用户时）
        roomId: roomId || null
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUserUuid(data.user.id)
          currentUserUuidRef.current = data.user.id

          // 更新在线人数
          fetchOnlineUsers()

          // 如果是主人，优先使用本地存储的主题（用户的主动选择），其次才是数据库主题
          if (type === 'owner') {
            // 如果本地有保存的主题
            if (savedThemeId) {
              // 如果数据库中的主题与本地不一致，主动同步一次到服务器，确保访客看到正确的主题
              if (data.user.theme_id !== savedThemeId) {
                console.log('Syncing local theme to server:', savedThemeId)
                fetch('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userType: type,
                    sessionId: sessionId,
                    themeId: savedThemeId,
                    roomId: roomId || null
                  })
                }).catch(console.error)
              }
            } else if (data.user.theme_id) {
              // 本地没有（比如清缓存了），才用数据库的
              setCurrentThemeId(data.user.theme_id)
              currentThemeIdRef.current = data.user.theme_id
              localStorage.setItem('chatroom_theme_id', data.user.theme_id)
            }
          } else {
            // 如果是访客，也优先保留本地主题，防止刷新时闪烁回默认主题
            // 后续的 fetch('/api/users') 会负责同步最新的 Owner 主题
            if (savedThemeId) {
              // 保持使用本地主题
            } else if (data.user.theme_id) {
              // 如果数据库有记录（虽然访客通常不存 theme_id，但以防万一），也可以用
              setCurrentThemeId(data.user.theme_id)
              currentThemeIdRef.current = data.user.theme_id
              localStorage.setItem('chatroom_theme_id', data.user.theme_id)
            }
          }
        }
      })
      .catch(console.error)

    // 如果是访客，尝试获取当前在线的主人的主题
    if (type === 'guest') {
      const url = roomId ? `/api/users?roomId=${roomId}` : '/api/users'
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.users && Array.isArray(data.users)) {
            const owner = data.users.find((u: any) => u.user_type === 'owner')
            if (owner) {
              ownerIdRef.current = owner.id
              // 访客强制同步主人的主题，覆盖本地存储
              if (owner.theme_id && owner.theme_id !== savedThemeId) {
                setCurrentThemeId(owner.theme_id)
                currentThemeIdRef.current = owner.theme_id
                localStorage.setItem('chatroom_theme_id', owner.theme_id)
              }
            } else {
              // 如果没找到在线主人，尝试从历史消息中恢复 Owner ID，或者保持当前本地主题
              // 不做任何回退操作，防止变回默认
              console.log('No online owner found, keeping local theme')
            }
          }
        })
        .catch(console.error)
    }

    return () => {
      clearInterval(onlineInterval)
      clearInterval(heartbeatInterval)
    }
  }, [roomId]) // Added roomId dependency

  // 切换主题
  const handleThemeChange = async (themeId: string) => {
    setCurrentThemeId(themeId)
    currentThemeIdRef.current = themeId
    localStorage.setItem('chatroom_theme_id', themeId)
    setShowThemeSelector(false)

    // 1. 更新数据库中的用户主题
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userType,
        sessionId: currentUserId,
        themeId,
        roomId: roomId || null
      })
    }).catch(console.error)

    // 3. 发送隐藏的系统消息以触发访客的实时同步
    // 这是为了防止 users 表订阅失败的备份机制
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `ACTION:THEME_CHANGE:${themeId}`,
        type: 'text',
        userType,
        userId: currentUserId,
        themeId,
        roomId: roomId || null
      })
    }).catch(console.error)

    // 2. 更新本地消息显示（针对所有该用户的历史消息）
    setMessages(prev => prev.map(msg => {
      // 优先使用 UUID 匹配（适用于所有消息），降级使用 session_id 匹配
      const isMyMessage = currentUserUuidRef.current
        ? msg.user_id === currentUserUuidRef.current
        : msg.users?.session_id === currentUserId || msg.user_id === currentUserId

      if (isMyMessage) {
        return {
          ...msg,
          users: {
            ...(msg.users || { session_id: currentUserId }),
            theme_id: themeId
          }
        }
      }
      return msg
    }))
  }

  // 获取初始消息和订阅实时更新
  useEffect(() => {
    if (loading) return

    // 1. 获取历史消息
    const fetchMessages = async () => {
      try {
        const url = roomId ? `/api/messages?limit=50&roomId=${roomId}` : '/api/messages?limit=50'
        const res = await fetch(url)
        const data = await res.json()
        if (data.messages) {
          // 尝试从历史消息中找到主人的 ID
          if (!ownerIdRef.current) {
            const ownerMsg = data.messages.find((m: any) => m.user_type === 'owner')
            if (ownerMsg) {
              ownerIdRef.current = ownerMsg.user_id
            }
          }

          // 处理回复消息可能是数组的情况
          const formattedMessages = data.messages
            .filter((msg: any) => !msg.content || !msg.content.startsWith('ACTION:THEME_CHANGE:'))
            .map((msg: any) => ({
              ...msg,
              reply_to: Array.isArray(msg.reply_to) ? msg.reply_to[0] : msg.reply_to
            }))
          setMessages(formattedMessages.reverse()) // 翻转以按时间正序显示
          if (data.messages.length < 50) {
            setHasMore(false)
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }
    fetchMessages()

    // 2. 订阅实时消息
    const channelId = roomId ? `room_${roomId}` : 'room_default'
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*', // 监听所有事件以更新在线人数 (INSERT/UPDATE/DELETE)
          schema: 'public',
          table: 'users'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Filter for current room
          const newUser = payload.new as any
          // If it's a delete event, newUser might be null or old might be present
          // For simplicity, we just refetch online users
          // But strictly, we should check room_id.
          // Since we fetch online users anyway, and that API filters by room, we can just trigger fetch.
          // But to avoid unnecessary fetches for other rooms' activity:
          const relevantRoomId = (payload.new as any)?.room_id || (payload.old as any)?.room_id

          // If room_id is null in DB, it matches roomId=null.
          if (relevantRoomId === (roomId || null)) {
            fetchOnlineUsers()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new as Message

          // Filter by room
          if (newMessage.room_id !== (roomId || null)) return

          // 检查是否为隐藏的主题切换动作
          if (newMessage.content && newMessage.content.startsWith('ACTION:THEME_CHANGE:')) {
            const newThemeId = newMessage.content.split(':')[2]
            const isGuest = getUserType(roomId) !== 'owner'

            // 如果我是访客，且消息来自主人，且有主题ID
            if (isGuest && newMessage.user_type === 'owner' && newThemeId) {
              setCurrentThemeId(newThemeId)
              currentThemeIdRef.current = newThemeId
              localStorage.setItem('chatroom_theme_id', newThemeId)

              // 更新所有主人消息的主题
              setMessages(prev => prev.map(msg => {
                // 只要是主人发的消息，或者是当前发送这条指令的用户
                if (msg.user_type === 'owner' || msg.user_id === newMessage.user_id) {
                  return {
                    ...msg,
                    users: {
                      ...(msg.users || { session_id: 'owner' }),
                      theme_id: newThemeId
                    }
                  }
                }
                return msg
              }))
            }
            // 不将此指令消息添加到列表中
            return
          }

          // 如果是自己发的消息，注入当前主题和 session_id
          if (currentUserUuidRef.current && newMessage.user_id === currentUserUuidRef.current) {
            newMessage.users = {
              session_id: currentUserId,
              theme_id: currentThemeIdRef.current
            }
          } else if (newMessage.user_type === 'owner') {
            // 如果收到主人的新消息，更新 ownerId
            if (!ownerIdRef.current) {
              ownerIdRef.current = newMessage.user_id
            }

            // 如果是主人发的消息（且不是自己），注入当前全局主题（因为访客会同步主人的主题）
            // 注意：这里无法立即获取 session_id，但对于显示主题来说 theme_id 是关键
            newMessage.users = {
              session_id: 'owner', // 占位符
              theme_id: currentThemeIdRef.current
            }
          }

          // 播放接收音效
          const isMyMessage = newMessage.user_id === currentUserUuidRef.current ||
            (!!newMessage.users?.session_id && newMessage.users.session_id === getSessionId())

          if (!isMyMessage) {
            soundManager.playReceive()
            // 收到别人发的消息时，也触发全屏彩蛋
            if (newMessage.type === 'text' && newMessage.content) {
              const easterEgg = getEasterEgg(newMessage.content)
              if (easterEgg && easterEgg.fullScreen) {
                setFullScreenEffect(easterEgg.fullScreen)
                setEffectKey(Date.now())
              }
            }
          }

          setMessages((prev) => {
            // 1. 检查是否已经存在该 ID 的消息（防止重复推送）
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }

            // 规范化 reply_to 字段（如果是数组，取第一个）
            if (Array.isArray(newMessage.reply_to)) {
              newMessage.reply_to = newMessage.reply_to[0]
            }

            // 2. 检查是否有匹配的乐观消息（由我发送、内容相同、最近创建、且是乐观状态）
            // 注意：这里我们放宽一点时间限制，或者主要依赖内容和用户匹配
            // 为了避免误伤，我们只替换最近的一条匹配的乐观消息
            const optimisticMatchIndex = prev.findIndex(m => {
              if (!m.isOptimistic || m.user_id !== newMessage.user_id || m.type !== newMessage.type) {
                return false
              }

              // 对于图片和语音，主要通过 file_url 匹配，或者通过 content 匹配（如果 optimistic 设置了默认文本）
              if (m.type === 'image' || m.type === 'audio') {
                return m.file_url === newMessage.file_url || m.content === newMessage.content
              }

              // 对于文本消息，必须内容一致
              return m.content === newMessage.content
            })

            if (optimisticMatchIndex !== -1) {
              // 替换乐观消息为真实消息
              const newMessages = [...prev]
              newMessages[optimisticMatchIndex] = {
                ...newMessage,
                // 保留一些可能还没有从 Realtime 同步过来的关联信息（如果有的话）
                reply_to: newMessage.reply_to || newMessages[optimisticMatchIndex].reply_to
              }
              return newMessages
            }

            // 尝试在本地查找引用的消息
            if (newMessage.reply_to_id && !newMessage.reply_to) {
              const repliedMsg = prev.find(m => m.id === newMessage.reply_to_id)
              if (repliedMsg) {
                newMessage.reply_to = repliedMsg
              }
            }
            return [...prev, newMessage]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newUser = payload.new

          // Filter by room
          if (newUser.room_id !== (roomId || null)) return

          if (newUser && newUser.id && newUser.theme_id) {
            // 如果更新的是主人，且当前用户是访客，则同步全局主题
            const isGuest = getUserType(roomId) !== 'owner'

            // 判定是否为 owner 更新：
            // 1. 明确标记为 owner
            // 2. 匹配已知的 ownerId
            // 3. 或者是访客收到非自己的 update 且带有 theme_id (因为只有 owner 能改主题)
            const isMe = (currentUserUuidRef.current && newUser.id === currentUserUuidRef.current) ||
              (currentUserId && newUser.session_id === currentUserId)

            const isOwnerUpdate = newUser.user_type === 'owner' ||
              (ownerIdRef.current && newUser.id === ownerIdRef.current) ||
              (isGuest && !isMe && newUser.theme_id)

            // 防御性检查：如果是访客，且收到的更新不是来自 Owner (或疑似 Owner)，则忽略主题变更
            // 防止其他访客的初始化心跳（可能带有旧的主题）污染当前全局状态
            // 只有当明确是 user_type === 'owner' 或者 id 匹配已知 ownerId 时，才同步主题
            const isTrustedOwnerSource = newUser.user_type === 'owner' || (ownerIdRef.current && newUser.id === ownerIdRef.current)

            if (isOwnerUpdate && isGuest && isTrustedOwnerSource) {
              // 更新 ownerId 引用（如果之前为空）
              if (!ownerIdRef.current) {
                ownerIdRef.current = newUser.id
              }

              setCurrentThemeId(newUser.theme_id)
              currentThemeIdRef.current = newUser.theme_id
              localStorage.setItem('chatroom_theme_id', newUser.theme_id)
            }

            // 更新该用户所有历史消息的主题
            setMessages((prev) => prev.map((msg) => {
              if (msg.user_id === newUser.id) {
                const updatedMsg: Message = {
                  ...msg,
                  users: {
                    ...(msg.users || { session_id: '' }), // 确保 session_id 存在
                    theme_id: newUser.theme_id
                  }
                }
                return updatedMsg
              }
              return msg
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loading, roomId]) // Added roomId dependency

  // 发送消息
  const sendMessage = async (content: string, type: 'text' | 'image' | 'audio' = 'text', fileUrl?: string) => {
    if (!currentUserId) return

    try {
      // 乐观更新：先在界面上显示消息
      const tempId = crypto.randomUUID()
      const now = new Date().toISOString()

      const optimisticMessage: Message = {
        id: tempId,
        content: content || (type === 'image' ? '[图片]' : type === 'audio' ? '[语音]' : content),
        type: type,
        file_url: fileUrl,
        user_id: currentUserUuid, // 使用 UUID
        user_type: userType,
        created_at: now,
        reply_to_id: replyingTo?.id,
        reply_to: replyingTo || undefined,
        users: {
          session_id: currentUserId,
          theme_id: currentThemeId
        },
        isOptimistic: true,
        room_id: roomId || null // Added room_id
      }

      setMessages(prev => [...prev, optimisticMessage])
      // 发送成功后清除回复状态（提前清除，提升体验）
      setReplyingTo(null)
      scrollToBottom()

      // 播放发送音效
      soundManager.playSend()

      // 检查并触发全屏彩蛋 (仅限文本消息)
      if (type === 'text') {
        const easterEgg = getEasterEgg(content)
        if (easterEgg && easterEgg.fullScreen) {
          setFullScreenEffect(easterEgg.fullScreen)
          setEffectKey(Date.now())
        }
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 不发送 id，让后端自动生成，避免权限错误
          content,
          type,
          fileUrl,
          userType,
          userId: currentUserId,
          themeId: currentThemeId,
          replyToId: replyingTo?.id,
          roomId: roomId || null // Added roomId
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '发送失败')
      }

      // 不需要在这里更新消息，因为 Realtime 会推送回来
      // 只要 ID 一致，React Key 就会一致，或者我们可以在 Realtime 接收处做去重
    } catch (error: any) {
      console.error('Failed to send message:', error)
      alert(error.message || '发送失败，请重试')
      // 如果失败，应该回滚（这里暂不处理回滚，用户刷新即可）
    }
  }

  // 滚动到底部
  const scrollToBottom = () => {
    // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' })
  }

  const setAtBottomState = (atBottom: boolean) => {
    if (atBottomStateRef.current === atBottom) return
    atBottomStateRef.current = atBottom
    setShowScrollToBottom(!atBottom)
  }

  // 加载更多消息
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return

    setIsLoadingMore(true)
    setLoadError(false)
    isLoadingMoreRef.current = true

    // 记录当前滚动高度
    // if (containerRef.current) {
    //   prevScrollHeightRef.current = containerRef.current.scrollHeight
    // }

    try {
      const oldestMessage = messages[0]
      if (!oldestMessage?.created_at) {
        throw new Error('Invalid message data')
      }

      console.log('Loading more messages before:', oldestMessage.created_at)
      let url = `/api/messages?limit=50&before=${encodeURIComponent(oldestMessage.created_at)}`
      if (roomId) url += `&roomId=${roomId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Network response was not ok')

      const data = await res.json()
      console.log('Loaded messages:', data.messages?.length)

      if (data.messages && data.messages.length > 0) {
        // 处理回复消息可能是数组的情况
        const newMessages = data.messages.reverse().map((msg: any) => ({
          ...msg,
          reply_to: Array.isArray(msg.reply_to) ? msg.reply_to[0] : msg.reply_to
        }))
        setMessages(prev => {
          // 过滤掉已存在的重复消息，避免 key 冲突
          const existingIds = new Set(prev.map(m => m.id))
          const uniqueNewMessages = newMessages.filter((m: Message) => !existingIds.has(m.id))

          console.log('Unique new messages:', uniqueNewMessages.length)

          if (uniqueNewMessages.length === 0) {
            // 如果获取到的消息都已存在，可能是因为时间戳精度问题，尝试再往前查一点或者停止加载
            // 这里我们简单地停止加载，避免无限循环
            return prev
          }

          // 尝试修复引用链：检查当前消息列表(prev)中是否有引用了新加载消息(uniqueNewMessages)的情况
          const updatedPrev = prev.map(msg => {
            if (msg.reply_to_id && !msg.reply_to) {
              const repliedMsg = uniqueNewMessages.find((m: Message) => m.id === msg.reply_to_id)
              // 防止引用自己（虽然数据库层应该限制，但前端防御一下）
              if (repliedMsg && repliedMsg.id !== msg.id) {
                return { ...msg, reply_to: repliedMsg }
              }
            }
            return msg
          })

          // 合并并强制按时间正序排序，防止任何乱序导致的“反向”视觉问题
          const combinedMessages = [...uniqueNewMessages, ...updatedPrev]
          return combinedMessages.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        })
        if (data.messages.length < 50) setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more messages:', error)
      isLoadingMoreRef.current = false // 发生错误时重置，避免错误的滚动调整
      setLoadError(true)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // 监听滚动 - Virtuoso 接管滚动，此函数不再使用
  // const handleScroll = (e: React.UIEvent<HTMLDivElement>) => { ... }

  // 处理消息更新后的滚动位置
  useLayoutEffect(() => {
    // 如果是加载更多，恢复滚动位置 - Virtuoso 会自动处理
    // if (isLoadingMoreRef.current && containerRef.current) {
    //   const newScrollHeight = containerRef.current.scrollHeight
    //   const diff = newScrollHeight - prevScrollHeightRef.current
    //   containerRef.current.scrollTop = diff
    //   isLoadingMoreRef.current = false
    // } else {
    // 如果是新消息（且不是加载更多）
    if (!isLoadingMoreRef.current) {
      const lastMessage = messages[messages.length - 1]

      // 判断是否是自己发的消息
      const isMyMessage = lastMessage && (
        (currentUserUuidRef.current && lastMessage.user_id === currentUserUuidRef.current) ||
        (!!lastMessage.users?.session_id && lastMessage.users.session_id === currentUserId)
      )

      // 如果是自己发的消息，则强制滚动到底部 (其他人的消息由 followOutput 处理)
      if (isMyMessage) {
        // 使用 setTimeout 确保渲染完成后滚动
        setTimeout(scrollToBottom, 50)
      }
    }

    // 重置标记
    if (isLoadingMoreRef.current) {
      isLoadingMoreRef.current = false
    }
    // }
  }, [messages])

  // 退出主人模式
  const handleLogout = () => {
    if (confirm('确定要退出主人模式吗？')) {
      setSessionUserType('guest', roomId)
      setUserType('guest')
      window.location.reload()
    }
  }

  // 复制访客链接
  const handleShareRoom = () => {
    if (!roomId || typeof window === 'undefined') return
    const url = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(url)
    setShowCopiedToast(true)
    setTimeout(() => setShowCopiedToast(false), 2000)
  }

  if (loading) {
    return (
      <div className="h-[100dvh] animate-gradient-soft flex flex-col overflow-hidden">
        {/* 骨架屏头部 */}
        <header className="glass shadow-sm px-4 py-3 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-12 h-5 bg-gray-100 rounded-full animate-pulse"></div>
          </div>
        </header>

        {/* 骨架屏消息列表 */}
        <div className="flex-1 p-4 space-y-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                relative max-w-[70%] h-16 rounded-2xl overflow-hidden
                ${i % 2 === 0 ? 'bg-white/40' : 'bg-white/60'}
              `}>
                <div className="absolute inset-0 animate-shimmer"></div>
              </div>
            </div>
          ))}
        </div>

        {/* 骨架屏输入框 */}
        <div className="p-4 glass border-t-0">
          <div className="w-full h-12 bg-white/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden relative transition-colors duration-500"
      style={{
        background: currentTheme.backgroundGradient,
        backgroundSize: '400% 400%',
        animation: 'gradient 15s ease infinite'
      }}
    >
      {/* <BackgroundParticles /> */}
      <ClickSparkles />
      <FluidCursorTrail />
      <FullScreenEffects
        key={effectKey}
        type={fullScreenEffect}
        onComplete={() => setFullScreenEffect('none')}
      />
      {/* 头部 */}
      <header className="glass shadow-sm px-4 py-3 z-10 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              {userType === 'owner' ? '我的聊天室' : '匿名聊天室'}
              {isBirthday && (
                <span className="text-lg animate-pulse" title="Happy 3.25!">👑</span>
              )}
            </h1>
            {userType === 'owner' && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 pulse-ring relative">
                  <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-75"></span>
                </span>
                主人
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {/* 隐藏在线人数显示，但保留逻辑 */}
            {/* <div className="flex items-center space-x-1 text-gray-600">
              <Users size={16} />
              <span className="text-sm">{onlineUsers}</span>
            </div> */}

            {roomId && (
              <button
                onClick={handleShareRoom}
                className="text-gray-600 hover:text-purple-600 flex items-center gap-1 relative"
                title="分享房间链接"
              >
                {showCopiedToast ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                {showCopiedToast && (
                  <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap animate-in fade-in zoom-in duration-200">
                    已复制
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-purple-600 flex items-center gap-1"
              title="创建新房间"
            >
              <Plus size={20} />
            </button>

            {userType === 'guest' && (
              <button
                onClick={() => {
                  const url = new URL(window.location.href)
                  url.searchParams.set('auth', 'owner')
                  window.location.href = url.toString()
                }}
                className="text-purple-600 hover:text-purple-700"
                title="切换为房主"
              >
                <Settings size={20} />
              </button>
            )}
            {userType === 'owner' && (
              <>
                <button
                  onClick={() => setShowThemeSelector(true)}
                  className="text-gray-600 hover:text-gray-800"
                  title="切换主题"
                >
                  <Palette size={20} />
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600"
                  title="退出主人模式"
                >
                  <LogOut size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 主题选择弹窗 */}
      {showThemeSelector && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-medium text-gray-700">切换气泡主题</h3>
              <button
                onClick={() => setShowThemeSelector(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <ThemeSelector
                currentThemeId={currentThemeId}
                onSelect={handleThemeChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-hidden relative">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          atBottomStateChange={setAtBottomState}
          atBottomThreshold={50}
          followOutput={(isAtBottom) => isAtBottom ? 'smooth' : false}
          startReached={() => {
            if (hasMore && !isLoadingMore) {
              loadMoreMessages()
            }
          }}
          itemContent={(index, message) => (
            <div className="px-4 pt-2">
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.user_id === currentUserUuidRef.current || (!!message.users?.session_id && message.users.session_id === currentUserId)}
                userType={message.user_type}
                viewerType={userType}
                onReply={setReplyingTo}
              />
            </div>
          )}
          components={{
            Header: () => hasMore ? (
              <div className="text-center py-4">
                <button
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                  className={`text-sm px-4 py-1 rounded-full transition-colors ${loadError
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoadingMore ? '加载中...' : (loadError ? '加载失败，点击重试' : '加载更多历史消息')}
                </button>
              </div>
            ) : (messages.length > 0 ? (
              <div className="text-center py-4 text-gray-400 text-xs">
                没有更多消息了
              </div>
            ) : null),
            EmptyPlaceholder: () => (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center text-gray-500">
                  <p className="mb-2">暂无消息</p>
                  <p className="text-sm">开始聊天吧！</p>
                </div>
              </div>
            ),
            Footer: () => <div className="h-4" /> // 底部留白
          }}
          className="h-full [overflow-anchor:none]"
        />
      </div>

      {/* 快速回到底部按钮 */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-32 right-6 md:bottom-24 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-purple-100 text-purple-600 hover:bg-purple-50 hover:scale-110 active:scale-95 transition-all duration-300 z-20 animate-in fade-in slide-in-from-bottom-4 group"
          title="回到底部"
        >
          <ChevronDown size={24} className="group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* 输入区域 */}
      <MessageInput
        onSendMessage={sendMessage}
        disabled={!currentUserId}
        userType={userType}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  )
}
