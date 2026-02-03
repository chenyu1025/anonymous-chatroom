import { Message } from '@/lib/types'

import Image from 'next/image'
import { Reply } from 'lucide-react'
import { OWNER_THEMES } from '@/lib/themes'

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  userType: 'owner' | 'guest'
  onReply: (message: Message) => void
}

export default function MessageBubble({ message, isCurrentUser, userType, onReply }: MessageBubbleProps) {
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
    // 只有 owner 可以应用主题样式
    if (userType === 'owner' && themeId && themeId !== 'default') {
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
    // 无论是主人还是访客，自己的消息在右边，别人的消息在左边
    return isCurrentUser ? 'justify-end' : 'justify-start'
  }

  return (
    <div className={`flex ${getContainerStyles()} mb-4 message-animate items-end`}>
      {/* 只有 owner 显示头像，别人看 owner 显示在左侧 */}
      {userType === 'owner' && !isCurrentUser && theme.avatar && (
        <div className={`relative w-10 h-10 mr-2 rounded-full overflow-hidden border-2 shadow-md bg-white shrink-0 ${theme.borderClass}`}>
          <Image
            src={theme.avatar}
            alt={theme.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl relative ${getBubbleStyles()} group`}
        onDoubleClick={() => onReply(message)}
        onContextMenu={(e) => {
          e.preventDefault()
          onReply(message)
        }}
      >
        {/* 引用内容 - 确保有内容才显示 */}
        {message.reply_to && message.reply_to.id && (
          <div className="mb-2 p-2 rounded bg-black/5 text-xs border-l-2 border-gray-400/50 truncate max-w-full">
            <div className="font-bold opacity-75 mb-0.5">
              {message.reply_to.user_type === 'owner' ? '主人' : '匿名用户'}
            </div>
            <div className="truncate opacity-80">
              {message.reply_to.type === 'image' ? '[图片]' :
                message.reply_to.type === 'audio' ? '[语音]' :
                  message.reply_to.content}
            </div>
          </div>
        )}

        {/* 引用按钮 - 移动端常驻，桌面端悬浮显示 */}
        {!isCurrentUser && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onReply(message)
            }}
            className={`absolute bottom-0 -right-8 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-purple-600 hover:bg-purple-50 shadow-sm transition-all
              opacity-100 md:opacity-0 md:group-hover:opacity-100`}
            title="引用回复"
          >
            <Reply size={14} />
          </button>
        )}

        {/* 小箭头：只有 owner 且使用了主题样式时显示 */}
        {userType === 'owner' && ((themeId && themeId !== 'default') || userType === 'owner') ? (
          <div
            className={`absolute top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent
              ${isCurrentUser ? '-right-2 border-l-[10px]' : '-left-2 border-r-[10px]'}`}
            style={isCurrentUser ? { borderLeftColor: theme.arrowColor } : { borderRightColor: theme.arrowColor }}
          />
        ) : null}

        {/* 消息内容：图片/语音/文本 */}
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

      {/* 只有 owner 显示头像，自己看 owner 显示在右侧 */}
      {userType === 'owner' && isCurrentUser && theme.avatar && (
        <div className={`relative w-10 h-10 ml-2 rounded-full overflow-hidden border-2 shadow-md bg-white shrink-0 ${theme.borderClass}`}>
          <Image
            src={theme.avatar}
            alt={theme.name}
            fill
            className="object-cover"
          />
        </div>
      )}
    </div>
  )
}
