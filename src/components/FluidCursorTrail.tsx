'use client'

import { useEffect, useRef } from 'react'

export default function FluidCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    // 仅在桌面端启用，避免移动端性能问题和触摸冲突
    if (window.matchMedia('(pointer: coarse)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const points: { x: number; y: number; age: number }[] = []
    const maxAge = 50 // 轨迹存活时间
    let mouse = { x: width / 2, y: height / 2 }

    const handleMouseMove = (e: MouseEvent) => {
      mouse = { x: e.clientX, y: e.clientY }
      // 移动时添加点
      points.push({ x: e.clientX, y: e.clientY, age: maxAge })
    }

    const animate = () => {
      if (!ctx) return
      
      // 清除画布但保留一点残影效果（可选，但这里我们用全清来配合SVG滤镜）
      ctx.clearRect(0, 0, width, height)

      // 绘制轨迹
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (points.length > 1) {
        ctx.beginPath()
        
        // 绘制连线
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i]
          const p2 = points[i + 1]
          
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          
          // 根据生命周期设置粗细和透明度
          const ageRatio = p1.age / maxAge
          ctx.lineWidth = ageRatio * 15 // 尾巴粗细
          ctx.strokeStyle = `rgba(168, 85, 247, ${ageRatio * 0.5})` // 紫色拖尾
          ctx.stroke()
        }
      }

      // 更新点
      for (let i = points.length - 1; i >= 0; i--) {
        points[i].age--
        if (points[i].age <= 0) {
          points.splice(i, 1)
        }
      }

      // 自动添加点（如果没有移动但有点存在，让它慢慢消失）
      // 如果需要更连贯的线条，可以在静止时也添加点，或者不做处理

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden mix-blend-screen">
      {/* SVG 滤镜用于液态融合效果 */}
      <svg className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <canvas
        ref={canvasRef}
        style={{ filter: 'url(#goo)' }}
        className="w-full h-full opacity-60"
      />
    </div>
  )
}
