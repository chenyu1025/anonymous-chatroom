'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MessageBubble from '@/components/MessageBubble'
import MessageInput from '@/components/MessageInput'
import { supabase } from '@/lib/supabase'
import { Message } from '@/lib/types'
import { getSessionId, getUserType } from '@/lib/session'
import { Users, Settings } from 'lucide-react'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState(1)
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'owner' | 'guest'>('guest')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 初始化用户
  useEffect(() => {
    const sessionId = getSessionId()
    const type = getUserType()
    setCurrentUserId(sessionId)
    setUserType(type)
    setLoading(false)

    // 上报在线状态
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userType: type, sessionId: sessionId })
    }).catch(console.error)
  }, [])

  // 获取初始消息和订阅实时更新
  useEffect(() => {
    if (loading) return

    // 1. 获取历史消息
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages?limit=100')
        const data = await res.json()
        if (data.messages) {
          setMessages(data.messages.reverse()) // 翻转以按时间正序显示
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
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loading])

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!currentUserId) return

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userType,
          userId: currentUserId
        })
      })
      // 不需要手动更新 state，因为实时订阅会处理
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
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
          </div>
        </div>
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4">
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
                isCurrentUser={message.user_id === currentUserId}
                userType={message.user_type}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <MessageInput onSendMessage={sendMessage} disabled={!currentUserId} />
    </div>
  )
}