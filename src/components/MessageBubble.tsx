import { Message } from '@/lib/types'

import Image from 'next/image'
import { OWNER_THEMES } from '@/lib/themes'

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  userType: 'owner' | 'guest'
}

export default function MessageBubble({ message, isCurrentUser, userType }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取当前主题
  const themeId = message.users?.theme_id || 'sprigatito'
  const theme = OWNER_THEMES.find(t => t.id === themeId) || OWNER_THEMES[0]

  const getBubbleStyles = () => {
    if (userType === 'owner') {
      return `${theme.bubbleClass} ${theme.textClass} border-2 shadow-sm`
    } else {
      return isCurrentUser
        ? 'bg-gray-600 text-white'
        : 'bg-gray-100 text-gray-800'
    }
  }

  const getContainerStyles = () => {
    // 主人在左边，访客（匿名）在右边
    return userType === 'owner' ? 'justify-start' : 'justify-end'
  }

  return (
    <div className={`flex ${getContainerStyles()} mb-4 message-animate items-end`}>
      {userType === 'owner' && (
        <div className={`relative w-10 h-10 mr-2 rounded-full overflow-hidden border-2 shadow-md bg-white shrink-0 ${theme.borderClass}`}>
          <Image
            src={theme.avatar}
            alt={theme.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl relative ${getBubbleStyles()}`}>
        {userType === 'owner' && (
          <div
            className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-b-[8px] border-b-transparent"
            style={{ borderRightColor: theme.arrowColor }}
          />
        )}
        {message.type === 'image' && message.file_url ? (
          <div className="relative w-48 h-48 mb-1 rounded-lg overflow-hidden">
            <Image
              src={message.file_url}
              alt="图片"
              fill
              className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.file_url, '_blank')}
            />
          </div>
        ) : message.type === 'audio' && message.file_url ? (
          <div className="min-w-[200px] mb-1">
            <audio controls src={message.file_url} className="w-full h-8" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        <p className={`text-xs mt-1 ${userType === 'owner' ? 'opacity-70' : (isCurrentUser ? 'text-gray-300' : 'text-gray-500')}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
