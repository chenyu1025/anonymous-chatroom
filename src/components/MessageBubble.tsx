import { Message } from '@/lib/types'

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
      return isCurrentUser
        ? 'bg-purple-600 text-white'
        : 'bg-purple-100 text-gray-800'
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
    <div className={`flex ${getContainerStyles()} mb-4 message-animate`}>
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${getBubbleStyles()}`}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-purple-100' : 'text-gray-500'}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
