'use client'

import { useState, useRef } from 'react'
import { Send, Image as ImageIcon, Mic, Square, Loader2, Plus, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AudioRecorder } from '@/lib/audio-recorder'

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'audio', fileUrl?: string) => void
  disabled?: boolean
  userType: 'owner' | 'guest'
}

export default function MessageInput({ onSendMessage, disabled, userType }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; url: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const startYRef = useRef(0)
  const shouldCancelRef = useRef(false)
  const [isCanceling, setIsCanceling] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!message.trim() || sending || disabled) return

    setSending(true)
    try {
      await onSendMessage(message.trim())
      setMessage('')
      // Don't close tools here as we might want to continue typing or keep input focused
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      await onSendMessage('', 'image', publicUrl)
      setShowTools(false)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('图片上传失败，请确保已启用 Storage 并配置策略')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const startRecording = async (e?: React.TouchEvent | React.MouseEvent) => {
    // 记录触摸起始位置
    if (e && 'touches' in e) {
      startYRef.current = e.touches[0].clientY
    }
    shouldCancelRef.current = false
    setIsCanceling(false)

    try {
      // 初始化录音器
      const recorder = new AudioRecorder()
      audioRecorderRef.current = recorder

      // 立即初始化 AudioContext 以响应用户手势
      recorder.initContext()

      await recorder.start()
      setIsRecording(true)
    } catch (error: any) {
      console.error('Error accessing microphone:', error)
      alert(error.message || '无法访问麦克风')
    }
  }

  const stopRecording = async () => {
    if (audioRecorderRef.current && isRecording) {
      const result = await audioRecorderRef.current.stop()
      setIsRecording(false)
      setIsCanceling(false)

      if (shouldCancelRef.current) {
        console.log('Recording cancelled')
        return
      }

      setRecordedAudio(result)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRecording) return

    const currentY = e.touches[0].clientY
    const diff = startYRef.current - currentY

    // 如果向上滑动超过 50px，标记为取消状态
    if (diff > 50) {
      setIsCanceling(true)
      shouldCancelRef.current = true
    } else {
      setIsCanceling(false)
      shouldCancelRef.current = false
    }
  }

  const handleMouseLeave = () => {
    if (isRecording) {
      shouldCancelRef.current = true
      stopRecording()
    }
  }

  const cancelRecording = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio.url)
      setRecordedAudio(null)
    }
  }

  const confirmSendVoice = () => {
    if (recordedAudio) {
      uploadVoice(recordedAudio.blob)
    }
  }

  const uploadVoice = async (blob: Blob) => {
    setUploading(true)
    try {
      // 使用 .wav 扩展名
      const fileName = `${Date.now()}.wav`
      const { data, error } = await supabase.storage
        .from('voices')
        .upload(fileName, blob, {
          contentType: 'audio/wav'
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('voices')
        .getPublicUrl(fileName)

      await onSendMessage('', 'audio', publicUrl)
      setShowTools(false)
      setRecordedAudio(null) // Clear after success
    } catch (error) {
      console.error('Voice upload failed:', error)
      alert('语音发送失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 relative">
      {uploading && (
        <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      )}

      {/* 语音预览弹窗 */}
      {recordedAudio && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-medium text-center text-gray-800">发送语音消息？</h3>

            <div className="flex justify-center py-4">
              <audio controls src={recordedAudio.url} className="w-full" />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelRecording}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmSendVoice}
                className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Send size={16} />
                <span>发送</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end space-x-3">
        <button
          onClick={() => setShowTools(!showTools)}
          className={`p-3 rounded-full transition-colors flex-shrink-0 ${showTools ? 'bg-gray-200' : 'bg-gray-100 text-gray-600'}`}
          type="button"
        >
          {showTools ? <X size={20} /> : <Plus size={20} />}
        </button>

        {showTools ? (
          <div className="flex-1 flex space-x-4 animate-in fade-in slide-in-from-left-5 duration-200 overflow-hidden">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-blue-50 text-blue-600 p-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-blue-100 transition-colors whitespace-nowrap"
              type="button"
            >
              <ImageIcon size={20} />
              <span>图片</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />

            {userType === 'owner' && (
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={handleMouseLeave}
                onTouchStart={(e) => {
                  // 防止页面滚动和长按菜单
                  e.preventDefault();
                  startRecording(e);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopRecording();
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  handleTouchMove(e);
                }}
                className={`flex-1 p-3 rounded-xl flex items-center justify-center space-x-2 transition-colors whitespace-nowrap select-none touch-none ${isRecording
                  ? (isCanceling ? 'bg-red-600 text-white' : 'bg-red-500 text-white')
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                type="button"
                style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
              >
                {isRecording ? (isCanceling ? <Trash2 size={20} /> : <Square size={20} />) : <Mic size={20} />}
                <span>
                  {isRecording
                    ? (isCanceling ? '松开取消' : '松开发送')
                    : '按住说话'}
                </span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex space-x-3 min-w-0">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="匿名提问..."
              disabled={disabled || sending}
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:opacity-50 text-[16px] sm:text-sm"
            />
            <button
              type="submit"
              disabled={!message.trim() || sending || disabled}
              className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send size={20} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
