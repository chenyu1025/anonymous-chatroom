import { Message } from '@/lib/types'

import Image from 'next/image'

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

  const getBubbleStyles = () => {
    if (userType === 'owner') {
      return 'bg-[#98e29d] text-emerald-900 border-2 border-emerald-200 shadow-sm'
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
        <div className="relative w-10 h-10 mr-2 rounded-full overflow-hidden border-2 border-emerald-300 shadow-md bg-white shrink-0">
          <Image
            src="/sprigatito.png"
            alt="新叶喵"
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl relative ${getBubbleStyles()}`}>
        {userType === 'owner' && (
          <div className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[10px] border-r-[#98e29d] border-b-[8px] border-b-transparent" />
        )}
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className={`text-xs mt-1 ${userType === 'owner' ? 'text-emerald-700/70' : (isCurrentUser ? 'text-gray-300' : 'text-gray-500')}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
