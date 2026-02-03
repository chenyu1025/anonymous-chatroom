'use client'

import { useEffect, useRef } from 'react'

export default function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    // 粒子类
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      fadeSpeed: number

      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.size = Math.random() * 3 + 1 // 1-4px
        this.speedX = Math.random() * 0.4 - 0.2 // 缓慢横向移动
        this.speedY = Math.random() * 0.4 - 0.2 // 缓慢纵向移动
        this.opacity = Math.random() * 0.5 + 0.1 // 0.1 - 0.6
        this.fadeSpeed = Math.random() * 0.005 + 0.002
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        // 边界检查：从另一侧回来
        if (this.x > width) this.x = 0
        else if (this.x < 0) this.x = width
        if (this.y > height) this.y = 0
        else if (this.y < 0) this.y = height

        // 闪烁效果
        this.opacity += this.fadeSpeed
        if (this.opacity > 0.6 || this.opacity < 0.1) {
          this.fadeSpeed = -this.fadeSpeed
        }
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const particles: Particle[] = []
    const particleCount = Math.min(50, Math.floor(width / 20)) // 根据屏幕宽度控制数量

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    let animationId: number

    const animate = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      
      particles.forEach(p => {
        p.update()
        p.draw()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-60"
    />
  )
}
