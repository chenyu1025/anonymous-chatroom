'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  isOwner?: boolean
}

// 幽灵简笔画 SVG 组件
const GhostWizard = ({ isMoving }: { isMoving: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${isMoving ? 'scale-110 -rotate-12' : 'scale-100'}`}
  >
    {/* 巫师帽尖 */}
    <path
      d="M7 6.5L11 1C11.5 0.5 13 0.5 13.5 1.5L17 6.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="fill-white/90"
    />

    {/* 身体 */}
    <path
      d="M6 7V18C6 19.5 7 20 8 19C9 18 10 19.5 11 20C12 20.5 13 19 14 18C15 17 17 18 18 19V7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="fill-white/90"
    />

    {/* 帽檐 */}
    <path
      d="M3 6.5C3 6.5 8 8.5 12 8.5C16 8.5 21 6.5 21 6.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="fill-white/90"
    />

    {/* 眼睛 */}
    <circle cx="9" cy="11" r="1.5" fill="currentColor" />
    <circle cx="15" cy="11" r="1.5" fill="currentColor" />

    {/* 魔法杖 */}
    <path
      d="M19 13L22 10M22 10L20 8.5M22 10L23.5 11.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={isMoving ? 'animate-pulse' : ''}
    />

    {/* 魔法星星 */}
    {isMoving && (
      <>
        <path d="M22 4L23 6L21 5L22 4Z" fill="currentColor" className="animate-ping" style={{ transformOrigin: 'center', animationDuration: '1s' }} />
      </>
    )}
  </svg>
)

// 魔法杖简笔画 SVG 组件
const MagicWand = ({ isMoving }: { isMoving: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-transform duration-200 ${isMoving ? 'scale-110 -rotate-12' : 'scale-100'}`}
  >
    {/* 杖身 */}
    <path
      d="M6 18L18 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-gray-800"
    />

    {/* 杖头星星 */}
    <path
      d="M18 6L16 4M18 6L20 4M18 6L16 8M18 6L20 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={isMoving ? 'animate-spin-slow' : ''}
      style={{ transformOrigin: '18px 6px' }}
    />

    {/* 魔法光点 */}
    {isMoving && (
      <>
        <circle cx="12" cy="12" r="1" fill="currentColor" className="animate-ping" style={{ animationDelay: '0s', animationDuration: '1.5s' }} />
        <circle cx="9" cy="15" r="0.5" fill="currentColor" className="animate-ping" style={{ animationDelay: '0.5s', animationDuration: '1.5s' }} />
      </>
    )}
  </svg>
)

// 艺术感播放图标 - 带有魔法流动感的三角形
const ArtisticPlay = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.5 4.5L18.5 11.2C19.2 11.6 19.2 12.4 18.5 12.8L7.5 19.5C6.8 19.9 6 19.4 6 18.6V5.4C6 4.6 6.8 4.1 7.5 4.5Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M8 6L17 11.5L8 17V6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 12L21 11M19 12L21 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="opacity-60"
    />
  </svg>
)

// 艺术感暂停图标 - 两条微微弯曲的魔法线
const ArtisticPause = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 6C8 6 7 12 8 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16 6C16 6 17 12 16 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M9 12H15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="1 3"
      className="opacity-40"
    />
  </svg>
)

export default function AudioPlayer({ src, isOwner = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // 默认不显示加载中，防止移动端无限加载
  const [error, setError] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (!isDragging) {
        const time = audio.currentTime
        setCurrentTime(Number.isFinite(time) ? time : 0)
      }
    }

    const handleLoadedMetadata = () => {
      const d = audio.duration
      if (Number.isFinite(d)) {
        setDuration(d)
        setIsLoading(false)
      }
    }

    const handleCanPlay = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => {
      setIsLoading(false)
      setError(true)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleLoadedMetadata)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('playing', handleCanPlay)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Check if metadata is already loaded
    if (audio.readyState >= 1) {
      handleLoadedMetadata()
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('playing', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [isDragging])

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation() // 防止触发消息气泡的点击事件
    if (audioRef.current) {
      if (error) {
        // Retry loading if error
        audioRef.current.load()
        setError(false)
        setIsLoading(true)
        return
      }
      
      if (audioRef.current.paused) {
        // 如果是首次播放（readyState === 0），显式调用 load()
        if (audioRef.current.readyState === 0) {
          audioRef.current.load()
        }
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Playback failed:', error)
            // 不需要手动 setIsPlaying(false)，因为 pause 事件会触发
          })
        }
      } else {
        audioRef.current.pause()
      }
      // 移除手动 setIsPlaying，完全依赖事件驱动
    }
  }

  const handleSeek = (e: React.MouseEvent | React.TouchEvent) => {
    if (!progressBarRef.current || !duration) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = percentage * duration

    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    handleSeek(e)
  }

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (isDragging && progressBarRef.current && duration) {
      // Prevent scrolling on mobile
      if (e.cancelable && (e.type === 'touchmove' || 'touches' in e)) {
        e.preventDefault()
      }

      const rect = progressBarRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const newTime = percentage * duration
      setCurrentTime(newTime)
    }
  }, [isDragging, duration])

  const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (isDragging) {
      setIsDragging(false)
      if (audioRef.current) {
        audioRef.current.currentTime = currentTime
      }
    }
  }, [isDragging, currentTime])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove, { passive: false })
      window.addEventListener('touchend', handleDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove) // removeEventListener ignores options usually, but for safety
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-full select-none transition-all duration-300
        bg-white/30 backdrop-blur-md border border-white/20 shadow-sm
        text-gray-800
        ${isPlaying || isHovering ? 'w-[200px]' : 'w-[120px]'} group
      `}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* 播放/暂停按钮 */}
      <button
        onClick={togglePlay}
        // 移除 disabled 状态，允许用户点击播放来触发加载
        className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 transition-all active:scale-95
          bg-white text-gray-800 hover:bg-gray-50 shadow-sm p-1.5
        `}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <ArtisticPause />
        ) : (
          <ArtisticPlay />
        )}
      </button>

      {/* 进度条容器 */}
      <div className="flex-1 flex flex-col justify-center h-6 relative group-hover:opacity-100">
        {/* 时间显示 - 悬浮或拖动或播放时显示在上方 */}
        <div className={`absolute -top-4 left-0 w-full flex justify-between text-[9px] font-medium transition-opacity duration-200 ${isHovering || isDragging || isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{duration ? formatTime(duration) : '--:--'}</span>
        </div>

        {/* 进度条轨道 - 增加点击热区 */}
        <div
          className={`h-8 -my-2 flex items-center cursor-pointer group/bar relative ${isLoading && duration === 0 ? 'pointer-events-none opacity-50' : ''}`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div
            ref={progressBarRef}
            className="w-full h-1 bg-black/10 rounded-full relative"
          >
            {/* 已播放进度 */}
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 bg-gray-800`}
              style={{ width: `${progress}%` }}
            />

            {/* 幽灵魔法师滑块 / 魔法杖滑块 */}
            <div
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200
                ${isHovering || isDragging || isPlaying ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
              `}
              style={{ left: `${progress}%` }}
            >
              <div className="text-gray-800">
                {isOwner ? (
                  <GhostWizard isMoving={isDragging || isPlaying} />
                ) : (
                  <MagicWand isMoving={isDragging || isPlaying} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
