'use client'

import { useEffect, useRef, useState } from 'react'

export default function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gradientColors, setGradientColors] = useState(['#e0c3fc', '#8ec5fc'])

  // 根据时间计算渐变色
  useEffect(() => {
    const updateGradient = () => {
      const hour = new Date().getHours()
      
      // 0-5: 深夜/凌晨 (深紫 - 深蓝)
      if (hour >= 0 && hour < 6) {
        setGradientColors(['#2d1b4e', '#1a2a6c'])
      }
      // 6-11: 早晨 (浅粉 - 浅蓝)
      else if (hour >= 6 && hour < 12) {
        setGradientColors(['#ffd1ff', '#fad0c4'])
      }
      // 12-17: 下午 (明亮蓝 - 暖橙)
      else if (hour >= 12 && hour < 18) {
        setGradientColors(['#89f7fe', '#66a6ff'])
      }
      // 18-23: 傍晚/晚上 (紫红 - 深靛蓝)
      else {
        setGradientColors(['#a18cd1', '#fbc2eb'])
      }
    }

    updateGradient()
    // 每分钟检查一次时间
    const interval = setInterval(updateGradient, 60000)
    return () => clearInterval(interval)
  }, [])

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
    <>
      <div 
        className="fixed inset-0 z-[-1] transition-colors duration-[5000ms] ease-in-out"
        style={{
          background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none opacity-60"
      />
    </>
  )
}
