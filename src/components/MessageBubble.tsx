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
    // 只要有主题ID，就应用主题样式（之前只允许 owner 使用主题）
    if (themeId && themeId !== 'default') {
      return `${theme.bubbleClass} ${theme.textClass} border-2 shadow-sm`
    }

    // 默认样式回退
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
    // 注意：这里逻辑可能需要调整，如果希望所有人都在右边（自己）左边（别人），或者保持现状
    // 目前保持现状：主人在左，访客在右
    return userType === 'owner' ? 'justify-start' : 'justify-end'
  }

  return (
    <div className={`flex ${getContainerStyles()} mb-4 message-animate items-end`}>
      {/* 只要有头像配置，就显示头像，不再限制只有 owner 显示 */}
      {theme.avatar && (
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
        {/* 小箭头：只要使用了主题样式，就显示小箭头 */}
        {(themeId && themeId !== 'default') || userType === 'owner' ? (
          <div
            className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-b-[8px] border-b-transparent"
            style={{ borderRightColor: theme.arrowColor }}
          />
        ) : null}
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
