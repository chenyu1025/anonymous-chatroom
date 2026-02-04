import { Message } from '@/lib/types'

import Image from 'next/image'
import { Reply, Loader2 } from 'lucide-react'
import { OWNER_THEMES } from '@/lib/themes'

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  userType: 'owner' | 'guest' // 消息发送者的类型
  viewerType: 'owner' | 'guest' // 当前查看者的类型
  onReply: (message: Message) => void
}

import { useState, useMemo } from 'react'
import AudioPlayer from './AudioPlayer'
import { getEasterEgg } from '@/lib/easter-eggs'

export default function MessageBubble({ message, isCurrentUser, userType, viewerType, onReply }: MessageBubbleProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)

  // 计算彩蛋效果
  const easterEgg = useMemo(() => {
    if (message.type !== 'text' || !message.content) return null
    return getEasterEgg(message.content)
  }, [message.content, message.type])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取当前主题
  const themeId = message.users?.theme_id || 'sprigatito'
  const theme = OWNER_THEMES.find(t => t.id === themeId) || OWNER_THEMES[0]

  const getContainerStyles = () => {
    // 1. 如果当前查看者是主人
    if (viewerType === 'owner') {
      // 只要是主人发的消息，都在右边（不管是不是当前Session）；访客发的在左边
      return userType === 'owner' ? 'justify-end' : 'justify-start'
    }

    // 2. 如果当前查看者是访客
    // 主人发的在左边
    if (userType === 'owner') return 'justify-start'
    // 访客自己发的、或者其他访客发的，都在右边
    return 'justify-end'
  }

  // 是否右对齐
  const isRightAligned = getContainerStyles() === 'justify-end'

  const getBubbleStyles = () => {
    let baseStyles = ''

    // 只有 owner 可以应用主题样式
    if (userType === 'owner' && themeId && themeId !== 'default') {
      baseStyles = `${theme.bubbleClass} ${theme.textClass} border-2 shadow-sm`
    } else if (userType === 'owner') {
      // 默认样式回退
      baseStyles = `${theme.bubbleClass} ${theme.textClass} border-2 shadow-sm`
    } else {
      // 访客样式：玻璃拟态 (Glassmorphism)
      if (isRightAligned) {
        // 右边（自己）：半透明，融入感更强
        if (isCurrentUser) {
          baseStyles = 'bg-white/40 backdrop-blur-md text-gray-800 shadow-sm border border-white/20'
        } else {
          // 右边（其他访客）：较不透明，突出显示
          baseStyles = 'bg-white/75 backdrop-blur-md text-gray-800 shadow-sm border border-white/40'
        }
      } else {
        // 左边（访客）：半透明白色，带有磨砂感
        baseStyles = 'bg-white/60 backdrop-blur-md text-gray-800 border border-white/30'
      }
    }

    // 应用彩蛋样式
    if (easterEgg) {
      if (easterEgg.effect === 'shake') baseStyles += ' animate-shake'
      if (easterEgg.effect === 'glow') baseStyles += ' animate-glow'
      if (easterEgg.effect === 'fire') baseStyles += ' animate-fire'
    }

    return baseStyles
  }

  // 动态样式
  const dynamicStyles = easterEgg?.color ? {
    '--glow-color': easterEgg.color
  } as React.CSSProperties : {}

  return (
    <>
      <div className={`flex ${getContainerStyles()} mb-4 message-animate items-end`}>
        {/* 头像显示逻辑：
            1. 只有 owner 才有头像
            2. 如果 owner 消息在左边，头像显示在气泡左侧
            3. 如果 owner 消息在右边，头像不显示（或者显示在右侧，看需求，这里先只处理左侧）
        */}
        {userType === 'owner' && !isRightAligned && theme.avatar && (
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
          className={`max-w-[70%] px-4 py-2 rounded-2xl relative ${getBubbleStyles()} group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
          style={dynamicStyles}
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

          {/* 彩蛋粒子效果容器 */}
          {easterEgg && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
              {/* 爱心/表情漂浮 */}
              {(easterEgg.effect === 'love' || easterEgg.effect === 'rain' || easterEgg.effect === 'confetti') && easterEgg.emoji && (
                Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className={`absolute text-lg ${easterEgg.effect === 'rain' ? 'animate-rain' : 'animate-float-up'}`}
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: easterEgg.effect === 'rain' ? '-20px' : 'auto',
                      bottom: easterEgg.effect === 'rain' ? 'auto' : '0',
                      animationDelay: `${Math.random() * 1.5}s`,
                      animationDuration: `${Math.random() * 1 + 1.5}s`,
                      opacity: 0
                    }}
                  >
                    {easterEgg.emoji}
                  </span>
                ))
              )}

              {/* Shark Shadow: 鲨鱼鳍倒影 */}
              {easterEgg.effect === 'shark-shadow' && (
                <div className="absolute bottom-0 left-0 w-full h-8 overflow-hidden pointer-events-none">
                  <div className="absolute bottom-[-4px] animate-shark-swim left-0">
                    {/* 使用 Shark Emoji 但处理成黑色剪影，并水平翻转使其游向右侧 */}
                    <span className="text-2xl inline-block transform -scale-x-100 filter brightness-0">
                      🦈
                    </span>
                  </div>
                </div>
              )}

              {/* Wizard Shadow: 魔法师剪影 */}
              {easterEgg.effect === 'wizard-shadow' && (
                <div className="absolute bottom-0 left-0 w-full h-12 overflow-hidden pointer-events-none">
                  <div className="absolute bottom-1 animate-wizard-fly left-0">
                    {/* 魔法师 Emoji 处理成黑色剪影 */}
                    <span className="text-2xl inline-block filter brightness-0">
                      🧙‍♂️
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 引用按钮 - 移动端常驻，桌面端悬浮显示 */}
          {/* 如果当前是右对齐（自己的消息或访客视角下的其他访客消息），按钮在左边；否则在右边 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onReply(message)
            }}
            className={`absolute bottom-0 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-purple-600 hover:bg-purple-50 shadow-sm transition-all
              ${isRightAligned ? '-left-8' : '-right-8'}
              opacity-100 md:opacity-0 md:group-hover:opacity-100`}
            title="引用回复"
          >
            <Reply size={14} />
          </button>

          {/* 小箭头：只有 owner 且使用了主题样式时显示 */}
          {userType === 'owner' && ((themeId && themeId !== 'default') || userType === 'owner') ? (
            <div
              className={`absolute top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent
                ${isRightAligned ? '-right-2 border-l-[10px]' : '-left-2 border-r-[10px]'}`}
              style={isRightAligned ? { borderLeftColor: theme.arrowColor } : { borderRightColor: theme.arrowColor }}
            />
          ) : null}

          {/* 消息内容：图片/语音/文本 */}
          {message.type === 'image' && message.file_url ? (
            <div className="relative w-48 h-48 mb-1 rounded-lg overflow-hidden group-image">
              <Image
                src={message.file_url}
                alt="图片"
                fill
                className="object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                onClick={() => {
                  setIsImageLoading(true)
                  setIsZoomed(true)
                }}
              />
            </div>
          ) : message.type === 'audio' && message.file_url ? (
            <div className="mb-1">
              <AudioPlayer src={message.file_url} isOwner={userType === 'owner'} />
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}

          <p className={`text-xs mt-1 ${userType === 'owner' ? 'opacity-70' : (isCurrentUser ? 'text-gray-300' : 'text-gray-500')}`}>
            {formatTime(message.created_at)}
          </p>
        </div>

        {/* 只有 owner 显示头像，自己看 owner 显示在右侧（如果 owner 消息在右侧） */}
        {userType === 'owner' && isRightAligned && theme.avatar && (
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

      {/* 图片放大查看器 */}
      {isZoomed && message.type === 'image' && message.file_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative w-full h-full max-w-4xl max-h-screen p-4 flex items-center justify-center">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
              </div>
            )}
            <Image
              src={message.file_url}
              alt="查看大图"
              fill
              className={`object-contain transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
              sizes="100vw"
              priority
            />
            <button
              className="absolute top-6 right-6 text-white/80 hover:text-white bg-black/50 p-2 rounded-full"
              onClick={() => setIsZoomed(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
