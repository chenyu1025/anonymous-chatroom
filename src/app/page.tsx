'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import MessageBubble from '@/components/MessageBubble'
import MessageInput from '@/components/MessageInput'
import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'
import { getSessionId, getUserType } from '@/lib/session'
import { Users, Settings, X, Palette, LogOut, ChevronDown } from 'lucide-react'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import ThemeSelector from '@/components/ThemeSelector'
import { DEFAULT_THEME_ID, OWNER_THEMES } from '@/lib/themes'
import BackgroundParticles from '@/components/BackgroundParticles'
import ClickSparkles from '@/components/ClickSparkles'
import FluidCursorTrail from '@/components/FluidCursorTrail'
import { soundManager } from '@/lib/sound'
import { FullScreenEffectType, getEasterEgg } from '@/lib/easter-eggs'
import FullScreenEffects from '@/components/FullScreenEffects'

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState(1)
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUserUuid, setCurrentUserUuid] = useState('')
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'owner' | 'guest'>('guest')
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [currentThemeId, setCurrentThemeId] = useState(DEFAULT_THEME_ID)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  // 全屏特效状态
  const [fullScreenEffect, setFullScreenEffect] = useState<FullScreenEffectType>('none')

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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)
  const isLoadingMoreRef = useRef(false)
  const isAtBottomRef = useRef(true)

  const router = useRouter()

  // 初始化用户
  useEffect(() => {
    const sessionId = getSessionId()
    const type = getUserType()
    setCurrentUserId(sessionId)
    setUserType(type)
    setLoading(false)

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
      body: JSON.stringify({ userType: type, sessionId: sessionId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUserUuid(data.user.id)
          currentUserUuidRef.current = data.user.id

          // 如果是主人，恢复自己的主题
          if (type === 'owner' && data.user.theme_id) {
            setCurrentThemeId(data.user.theme_id)
            currentThemeIdRef.current = data.user.theme_id
            localStorage.setItem('chatroom_theme_id', data.user.theme_id)
          }
        }
      })
      .catch(console.error)

    // 如果是访客，尝试获取当前在线的主人的主题
    if (type === 'guest') {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (data.users && Array.isArray(data.users)) {
            const owner = data.users.find((u: any) => u.user_type === 'owner')
            if (owner) {
              ownerIdRef.current = owner.id
              if (owner.theme_id) {
                setCurrentThemeId(owner.theme_id)
                currentThemeIdRef.current = owner.theme_id
                localStorage.setItem('chatroom_theme_id', owner.theme_id)
              }
            }
          }
        })
        .catch(console.error)
    }
  }, [])

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
        themeId
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
        themeId
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
        const res = await fetch('/api/messages?limit=50')
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
    const channel = supabase
      .channel('room1')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          const newMessage = payload.new as Message

          // 检查是否为隐藏的主题切换动作
          if (newMessage.content && newMessage.content.startsWith('ACTION:THEME_CHANGE:')) {
            const newThemeId = newMessage.content.split(':')[2]
            const isGuest = localStorage.getItem('chatroom_user_type') !== 'owner'

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
              }
            }
          }

          setMessages((prev) => {
            // 1. 检查是否已经存在该 ID 的消息（防止重复推送）
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
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
          if (newUser && newUser.id && newUser.theme_id) {
            // 如果更新的是主人，且当前用户是访客，则同步全局主题
            const isGuest = localStorage.getItem('chatroom_user_type') !== 'owner'

            // 判定是否为 owner 更新：
            // 1. 明确标记为 owner
            // 2. 匹配已知的 ownerId
            // 3. 或者是访客收到非自己的 update 且带有 theme_id (因为只有 owner 能改主题)
            const isMe = (currentUserUuidRef.current && newUser.id === currentUserUuidRef.current) ||
              (currentUserId && newUser.session_id === currentUserId)

            const isOwnerUpdate = newUser.user_type === 'owner' ||
              (ownerIdRef.current && newUser.id === ownerIdRef.current) ||
              (isGuest && !isMe && newUser.theme_id)

            if (isOwnerUpdate && isGuest) {
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
  }, [loading])

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
        isOptimistic: true
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
          replyToId: replyingTo?.id
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 加载更多消息
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return

    setIsLoadingMore(true)
    setLoadError(false)
    isLoadingMoreRef.current = true

    // 记录当前滚动高度
    if (containerRef.current) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight
    }

    try {
      const oldestMessage = messages[0]
      if (!oldestMessage?.created_at) {
        throw new Error('Invalid message data')
      }

      console.log('Loading more messages before:', oldestMessage.created_at)
      const res = await fetch(`/api/messages?limit=50&before=${encodeURIComponent(oldestMessage.created_at)}`)
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
          return [...uniqueNewMessages, ...prev]
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

  // 监听滚动
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget

    // 加载更多
    if (scrollTop < 50 && hasMore && !isLoadingMore) {
      loadMoreMessages()
    }

    // 显示/隐藏回到底部按钮 (距离底部超过 300px 时显示)
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const isAtBottom = distanceFromBottom <= 300
    isAtBottomRef.current = isAtBottom
    setShowScrollToBottom(!isAtBottom)
  }

  // 处理消息更新后的滚动位置
  useLayoutEffect(() => {
    // 如果是加载更多，恢复滚动位置
    if (isLoadingMoreRef.current && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight
      const diff = newScrollHeight - prevScrollHeightRef.current
      containerRef.current.scrollTop = diff
      isLoadingMoreRef.current = false
    } else {
      // 如果是新消息（且不是加载更多）
      const lastMessage = messages[messages.length - 1]
      
      // 判断是否是自己发的消息
      const isMyMessage = lastMessage && (
        (currentUserUuidRef.current && lastMessage.user_id === currentUserUuidRef.current) ||
        (!!lastMessage.users?.session_id && lastMessage.users.session_id === currentUserId)
      )

      // 如果是自己发的消息，或者当前就在底部，则滚动到底部
      if (isMyMessage || isAtBottomRef.current) {
        scrollToBottom()
      }
    }
  }, [messages])

  // 退出主人模式
  const handleLogout = () => {
    if (confirm('确定要退出主人模式吗？')) {
      localStorage.setItem('chatroom_user_type', 'guest')
      setUserType('guest')
      window.location.reload()
    }
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
      <BackgroundParticles />
      <ClickSparkles />
      <FluidCursorTrail />
      <FullScreenEffects type={fullScreenEffect} onComplete={() => setFullScreenEffect('none')} />
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
            <div className="flex items-center space-x-1 text-gray-600">
              <Users size={16} />
              <span className="text-sm">{onlineUsers}</span>
            </div>

            {userType === 'guest' && (
              <button
                onClick={() => router.push('/auth/owner')}
                className="text-purple-600 hover:text-purple-700"
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
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 [overflow-anchor:none]"
      >
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className={`text-sm px-4 py-1 rounded-full transition-colors ${loadError
                ? 'text-red-600 hover:bg-red-50'
                : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoadingMore ? '加载中...' : (loadError ? '加载失败，点击重试' : '点击加载更多历史消息')}
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="mb-2">暂无消息</p>
              <p className="text-sm">开始聊天吧！</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.user_id === currentUserUuidRef.current || (!!message.users?.session_id && message.users.session_id === currentUserId)}
                userType={message.user_type}
                viewerType={userType}
                onReply={setReplyingTo}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
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