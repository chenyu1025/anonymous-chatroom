'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import MessageBubble from '@/components/MessageBubble'
import MessageInput from '@/components/MessageInput'
import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'
import { getSessionId, getUserType } from '@/lib/session'
import { Users, Settings, X, Palette, LogOut } from 'lucide-react'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import ThemeSelector from '@/components/ThemeSelector'
import { DEFAULT_THEME_ID } from '@/lib/themes'

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

  // 使用 ref 来追踪最新状态，以便在闭包中使用
  const currentThemeIdRef = useRef(DEFAULT_THEME_ID)
  const currentUserUuidRef = useRef('')

  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)
  const isLoadingMoreRef = useRef(false)

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

          if (data.user.theme_id) {
            setCurrentThemeId(data.user.theme_id)
            currentThemeIdRef.current = data.user.theme_id
            // 同步到本地存储，确保多端同步
            localStorage.setItem('chatroom_theme_id', data.user.theme_id)
          }
        }
      })
      .catch(console.error)
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
          // 处理回复消息可能是数组的情况
          const formattedMessages = data.messages.map((msg: any) => ({
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

          // 如果是自己发的消息，注入当前主题和 session_id
          if (currentUserUuidRef.current && newMessage.user_id === currentUserUuidRef.current) {
            newMessage.users = {
              session_id: currentUserId,
              theme_id: currentThemeIdRef.current
            }
          }

          setMessages((prev) => {
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
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userType,
          userId: currentUserId,
          type,
          fileUrl,
          replyToId: replyingTo?.id
        })
      })
      // 发送成功后清除引用状态
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to send message:', error)
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
    const { scrollTop } = e.currentTarget
    if (scrollTop < 50 && hasMore && !isLoadingMore) {
      loadMoreMessages()
    }
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
      // 如果是新消息（且不是加载更多），滚动到底部
      scrollToBottom()
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
      <div className="h-[100dvh] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-800">
              {userType === 'owner' ? '我的聊天室' : '匿名聊天室'}
            </h1>
            {userType === 'owner' && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
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