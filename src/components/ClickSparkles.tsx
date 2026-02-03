'use client'

import { useEffect, useState } from 'react'

interface Sparkle {
  id: number
  x: number
  y: number
  color: string
  size: number
  createdAt: number
}

const COLORS = ['#FFC0CB', '#FF69B4', '#E6E6FA', '#ADD8E6', '#F0F8FF']

export default function ClickSparkles() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 每次点击生成 5-8 个火花
      const count = Math.floor(Math.random() * 4) + 5
      const newSparkles: Sparkle[] = []
      
      for (let i = 0; i < count; i++) {
        newSparkles.push({
          id: Date.now() + i + Math.random(),
          x: e.clientX,
          y: e.clientY,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 10 + 5,
          createdAt: Date.now()
        })
      }

      setSparkles(prev => [...prev, ...newSparkles])
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  // 清理旧火花
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      setSparkles(prev => prev.filter(s => now - s.createdAt < 1000))
    }, 100)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {sparkles.map(sparkle => (
        <span
          key={sparkle.id}
          className="absolute inline-block rounded-full animate-sparkle"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: sparkle.color,
            // 随机散射方向
            '--tx': `${(Math.random() - 0.5) * 100}px`,
            '--ty': `${(Math.random() - 0.5) * 100}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
