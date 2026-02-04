'use client'

import { useEffect, useRef, useState } from 'react'
import { FullScreenEffectType } from '@/lib/easter-eggs'
import Matter from 'matter-js'

interface FullScreenEffectProps {
  type: FullScreenEffectType
  emoji?: string
  onComplete: () => void
}

/* --------------------------------------------------------------------------------
   10. Emoji Storm (表情包雨 - 增强版)
   - Emoji 喷泉 + 物理碰撞 + 点击互动得分
-------------------------------------------------------------------------------- */
const EmojiStorm = ({ emoji = '❤️', onComplete }: { emoji?: string, onComplete: () => void }) => {
  const sceneRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!sceneRef.current) return

    // 1. Setup Matter.js
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint

    const engine = Engine.create()
    engineRef.current = engine

    // Normal gravity
    engine.gravity.y = 1

    const width = window.innerWidth
    const height = window.innerHeight

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    })

    // 2. Emoji Emitter Logic
    const emojis: Matter.Body[] = []
    const maxEmojis = 50
    let frameCount = 0

    const runner = Runner.create()

    Events.on(runner, 'afterUpdate', () => {
      frameCount++

      // Emit new emoji every 5 frames until max
      if (frameCount % 5 === 0 && emojis.length < maxEmojis) {
        const x = width / 2 + (Math.random() - 0.5) * 100 // Center bottom
        const y = height + 50

        const size = Math.random() * 30 + 20
        const body = Bodies.circle(x, y, size, {
          restitution: 0.8,
          friction: 0.005,
          label: 'emoji',
          render: {
            fillStyle: 'transparent', // Invisible physics body
            strokeStyle: 'transparent'
          }
        })

        // Shoot up
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 15, // Spread X
          y: -(Math.random() * 15 + 15)  // Shoot Y
        })

        emojis.push(body)
        Composite.add(engine.world, body)
      }

      // Cleanup fallen emojis
      for (let i = emojis.length - 1; i >= 0; i--) {
        if (emojis[i].position.y > height + 100 && emojis[i].velocity.y > 0) {
          Composite.remove(engine.world, emojis[i])
          emojis.splice(i, 1)
        }
      }
    })

    // Custom Render Loop for Emojis
    Events.on(render, 'afterRender', () => {
      const context = render.context
      context.font = '40px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      emojis.forEach(body => {
        const { x, y } = body.position
        const angle = body.angle

        context.save()
        context.translate(x, y)
        context.rotate(angle)
        context.fillText(emoji, 0, 0)
        context.restore()
      })
    })

    // 3. Mouse Interaction (Click to pop)
    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    })

    // Handle click/pop
    Events.on(mouseConstraint, 'mousedown', (event) => {
      const mousePosition = event.mouse.position
      // Simple hit test
      const clickedBodies = Matter.Query.point(emojis, mousePosition)

      clickedBodies.forEach(body => {
        // Pop effect
        Composite.remove(engine.world, body)
        const index = emojis.indexOf(body)
        if (index > -1) emojis.splice(index, 1)

        setScore(prev => prev + 1)
      })
    })

    Composite.add(engine.world, mouseConstraint)
    render.mouse = mouse

    // Resize handler
    const handleResize = () => {
      render.canvas.width = window.innerWidth
      render.canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // 4. Run
    Render.run(render)
    Runner.run(runner, engine)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      Render.stop(render)
      Runner.stop(runner)
      if (render.canvas) render.canvas.remove()
      Matter.World.clear(engine.world, false)
      Matter.Engine.clear(engine)
    }
  }, [emoji])

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto touch-none">
      <div ref={sceneRef} className="absolute inset-0" />

      {/* Score UI - Adjusted for mobile */}
      <div className="absolute top-10 right-6 sm:right-10 pointer-events-none animate-bounce z-[102]">
        <div className="bg-white/90 backdrop-blur rounded-full px-4 py-2 sm:px-6 sm:py-3 shadow-xl border-4 border-purple-200 flex items-center">
          <span className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
            {score}
          </span>
          <span className="ml-2 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">
            COMBO
          </span>
        </div>
      </div>

      {/* Instructions - Higher up for mobile */}
      <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none opacity-80 animate-pulse z-[102]">
        <p className="text-white font-bold text-lg sm:text-xl drop-shadow-lg px-4">
          TAP EMOJIS TO POP!
        </p>
      </div>

      <button
        onClick={onComplete}
        className="absolute top-10 left-6 sm:left-10 bg-black/30 hover:bg-black/50 text-white p-3 sm:p-2 rounded-full transition-colors z-[101]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  )
}

/* --------------------------------------------------------------------------------
   9. Zero Gravity (零重力 - Claymorphism + Physics)
   - 气泡漂浮 + 物理碰撞
-------------------------------------------------------------------------------- */
const ZeroGravity = ({ onComplete }: { onComplete: () => void }) => {
  const sceneRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const runnerRef = useRef<Matter.Runner | null>(null)

  useEffect(() => {
    if (!sceneRef.current) return

    // 1. Setup Matter.js
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Events = Matter.Events

    const engine = Engine.create()
    engine.gravity.y = 0 // Zero gravity
    engine.gravity.x = 0
    engineRef.current = engine

    const width = window.innerWidth
    const height = window.innerHeight

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    })
    renderRef.current = render

    // 2. Create Floating Phones
    const phones = []
    const colors = ['#4F46E5', '#818CF8', '#F97316', '#EC4899', '#10B981']

    // SVG Path for a simple smartphone icon
    // M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6zm2 2h8v14H8V4z
    // Simplified rectangle for physics body, but custom render for visual

    for (let i = 0; i < 15; i++) {
      const width = 40
      const height = 70
      const x = Math.random() * (window.innerWidth - width * 2) + width
      const y = Math.random() * (window.innerHeight - height * 2) + height
      const color = colors[Math.floor(Math.random() * colors.length)]

      const phone = Bodies.rectangle(x, y, width, height, {
        restitution: 0.8,
        friction: 0.01,
        frictionAir: 0.05, // Higher air friction for floating feel
        angle: Math.random() * Math.PI * 2,
        render: {
          fillStyle: color,
          strokeStyle: '#ffffff',
          lineWidth: 2,
          // We can't easily render SVG paths in Matter.js native renderer without custom rendering loop
          // So we stick to rounded rectangles which look like phones
        },
        chamfer: { radius: 8 } // Rounded corners
      })

      // Apply random initial velocity and rotation
      Matter.Body.setVelocity(phone, {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8
      })
      Matter.Body.setAngularVelocity(phone, (Math.random() - 0.5) * 0.2)

      phones.push(phone)
    }

    // 3. Walls (to keep phones inside)
    // Make walls very large to handle resize without scaling
    const wallThickness = 100
    const hugeSize = 10000
    const wallOptions = { isStatic: true, render: { visible: false } }

    const wallTop = Bodies.rectangle(width / 2, -wallThickness / 2, hugeSize, wallThickness, wallOptions)
    const wallBottom = Bodies.rectangle(width / 2, height + wallThickness / 2, hugeSize, wallThickness, wallOptions)
    const wallRight = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, hugeSize, wallOptions)
    const wallLeft = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, hugeSize, wallOptions)

    const walls = [wallTop, wallBottom, wallRight, wallLeft]

    Composite.add(engine.world, [...phones, ...walls])

    // 4. Mouse Control
    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    })
    Composite.add(engine.world, mouseConstraint)
    render.mouse = mouse

    // Resize Handler
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight

      render.canvas.width = newWidth
      render.canvas.height = newHeight

      // Update wall positions
      Matter.Body.setPosition(wallTop, { x: newWidth / 2, y: -wallThickness / 2 })
      Matter.Body.setPosition(wallBottom, { x: newWidth / 2, y: newHeight + wallThickness / 2 })
      Matter.Body.setPosition(wallRight, { x: newWidth + wallThickness / 2, y: newHeight / 2 })
      Matter.Body.setPosition(wallLeft, { x: -wallThickness / 2, y: newHeight / 2 })
    }
    window.addEventListener('resize', handleResize)

    // 5. Run
    Render.run(render)
    const runner = Runner.create()
    runnerRef.current = runner
    Runner.run(runner, engine)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      Render.stop(render)
      Runner.stop(runner)
      if (render.canvas) render.canvas.remove()
      Matter.World.clear(engine.world, false)
      Matter.Engine.clear(engine)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-white/30 backdrop-blur-sm animate-in fade-in duration-500 touch-none">
      <div ref={sceneRef} className="absolute inset-0" />

      {/* Instructions & Exit */}
      <div className="absolute top-20 left-0 right-0 text-center pointer-events-none">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 drop-shadow-md animate-bounce px-4">
          OOPS! MY PHONE!
        </h2>
        <p className="text-slate-600 font-medium mt-2 text-sm sm:text-base">Catch the flying phones!</p>
      </div>

      <button
        onClick={onComplete}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform active:scale-95 z-[101] whitespace-nowrap"
      >
        落地 (Land)
      </button>

      {/* CSS for Claymorphism effect on canvas circles is hard, simulating via overlay or just relying on canvas style above */}
    </div>
  )
}

/* --------------------------------------------------------------------------------
   11. Retro Arcade (1997 - 书籍雨)
   - CRT 扫描线 + 像素字体 + 书籍掉落堆叠
-------------------------------------------------------------------------------- */
const RetroArcade = ({ onComplete }: { onComplete: () => void }) => {
  const sceneRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)

  useEffect(() => {
    if (!sceneRef.current) return

    // 1. Setup Matter.js
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint

    const engine = Engine.create()
    engine.gravity.y = 1 // Normal gravity for books
    engineRef.current = engine

    const width = window.innerWidth
    const height = window.innerHeight

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    })

    // 2. Create Books
    const books: Matter.Body[] = []
    const bookColors = [
      '#8B4513', // SaddleBrown
      '#2F4F4F', // DarkSlateGray
      '#556B2F', // DarkOliveGreen
      '#800000', // Maroon
      '#191970', // MidnightBlue
      '#4B0082', // Indigo
      '#A0522D'  // Sienna
    ]

    // Spawn loop
    const runner = Runner.create()
    let frameCount = 0
    const maxBooks = 50

    Matter.Events.on(runner, 'afterUpdate', () => {
      frameCount++
      if (frameCount % 15 === 0 && books.length < maxBooks) { // Spawn every 15 frames
        const x = Math.random() * (width - 100) + 50

        // Book dimensions (varied)
        const bookWidth = Math.random() * 20 + 40 // 40-60px width
        const bookHeight = Math.random() * 10 + 60 // 60-70px height (spine length)
        const color = bookColors[Math.floor(Math.random() * bookColors.length)]

        const book = Bodies.rectangle(x, -50, bookWidth, bookHeight, {
          restitution: 0.1, // Low bounce
          friction: 0.8,    // High friction to stack
          frictionAir: 0.02,
          angle: Math.random() * Math.PI * 2,
          render: {
            fillStyle: color,
            strokeStyle: '#e2e8f0', // Light border like pages
            lineWidth: 2
          }
        })

        books.push(book)
        Composite.add(engine.world, book)
      }
    })

    // 3. Walls
    const wallThickness = 100
    const hugeSize = 10000
    const wallOptions = { isStatic: true, render: { visible: false } }

    const floor = Bodies.rectangle(width / 2, height + wallThickness / 2, hugeSize, wallThickness, wallOptions)
    const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, hugeSize, wallOptions)
    const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, hugeSize, wallOptions)

    Composite.add(engine.world, [floor, leftWall, rightWall])

    // 4. Mouse
    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    })
    Composite.add(engine.world, mouseConstraint)
    render.mouse = mouse

    // Resize Handler
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight

      render.canvas.width = newWidth
      render.canvas.height = newHeight

      // Update wall positions
      Matter.Body.setPosition(floor, { x: newWidth / 2, y: newHeight + wallThickness / 2 })
      Matter.Body.setPosition(rightWall, { x: newWidth + wallThickness / 2, y: newHeight / 2 })
      Matter.Body.setPosition(leftWall, { x: -wallThickness / 2, y: newHeight / 2 })
    }
    window.addEventListener('resize', handleResize)

    // 5. Run
    Render.run(render)
    Runner.run(runner, engine)

    return () => {
      window.removeEventListener('resize', handleResize)
      Render.stop(render)
      Runner.stop(runner)
      if (render.canvas) render.canvas.remove()
      Matter.World.clear(engine.world, false)
      Matter.Engine.clear(engine)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 font-mono pointer-events-auto overflow-hidden touch-none">
      {/* CRT Scanline Filter */}
      <div className="absolute inset-0 z-[105] pointer-events-none mix-blend-overlay opacity-30"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 4px, 6px 100%'
        }}
      />

      {/* Physics Canvas */}
      <div ref={sceneRef} className="absolute inset-0 z-[101]" />

      {/* Retro UI */}
      <div className="absolute top-10 left-0 right-0 text-center pointer-events-none z-[110]">
        <h1 className="text-2xl sm:text-4xl md:text-6xl text-amber-500 font-black tracking-widest animate-pulse px-4"
          style={{ textShadow: '2px 2px 0px #8b4513', fontFamily: '"Courier New", monospace' }}>
          1997 LIBRARY
        </h1>
        <p className="text-amber-200/80 mt-2 sm:mt-4 text-sm sm:text-xl blink">Reading in progress...</p>
      </div>

      <button
        onClick={onComplete}
        className="absolute top-10 right-6 sm:right-10 z-[120] text-amber-500 border-2 border-amber-500 p-2 sm:px-4 sm:py-2 hover:bg-amber-500 hover:text-black transition-colors font-bold tracking-widest bg-black/50"
        style={{ fontFamily: '"Courier New", monospace' }}
      >
        [X] CLOSE
      </button>

      {/* Inline Styles for Keyframes */}
      <style jsx>{`
        .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}

/* --------------------------------------------------------------------------------
   1. Sakura Breeze (樱花随风 - 捡手机)
   - 阳光光斑 + 旋转飘落的花瓣
-------------------------------------------------------------------------------- */
const SakuraBreeze = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden animate-in fade-in duration-1000">
    {/* 阳光光晕 */}
    <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(255,240,200,0.4)_0%,transparent_70%)] animate-pulse-slow" />

    {Array.from({ length: 40 }).map((_, i) => {
      const size = Math.random() * 15 + 10
      const delay = Math.random() * 2
      const duration = Math.random() * 3 + 4
      return (
        <div
          key={i}
          className="absolute animate-sakura-complex"
          style={{
            left: `${Math.random() * 120 - 10}%`, // 允许从屏幕外飘入
            top: '-50px',
            width: `${size}px`,
            height: `${size}px`,
            // 使用SVG作为背景
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0C10 0 12 5 15 5C18 5 20 10 20 10C20 10 15 12 15 15C15 18 10 20 10 20C10 20 8 15 5 15C2 15 0 10 0 10C0 10 5 5 5 5C5 5 10 0 10 0Z' fill='%23FFB7C5' fill-opacity='${Math.random() * 0.4 + 0.4}'/%3E%3C/svg%3E")`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            opacity: 0
          }}
        />
      )
    })}
  </div>
)

/* --------------------------------------------------------------------------------
   2. Police Glitch (赛博故障 - 只有一件事)
   - 蓝红警灯闪烁 + 故障错位 + 数字雨
-------------------------------------------------------------------------------- */
const PoliceGlitch = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* 警灯背景 */}
    <div className="absolute inset-0 bg-blue-900/10 animate-police-strobe mix-blend-overlay" />

    {/* 随机故障线条 */}
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={i}
        className="absolute bg-white/20 h-[1px] w-full animate-glitch-line"
        style={{
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random()}s`,
          animationDuration: `${Math.random() * 0.2 + 0.1}s`
        }}
      />
    ))}

    {/* 二进制数字雨 */}
    {Array.from({ length: 30 }).map((_, i) => (
      <div
        key={i}
        className="absolute text-[10px] text-blue-400/50 font-mono writing-vertical-rl animate-digital-rain"
        style={{
          left: `${Math.random() * 100}%`,
          top: '-100px',
          animationDuration: `${Math.random() * 2 + 1}s`,
          animationDelay: `${Math.random() * 2}s`
        }}
      >
        {Math.random() > 0.5 ? '10110' : '01001'}
      </div>
    ))}
  </div>
)

/* --------------------------------------------------------------------------------
   3. City Dream (城市梦境 - 玛利亚)
   - 模糊光斑(Bokeh) + 柔美羽毛
-------------------------------------------------------------------------------- */
const CityDream = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-b from-purple-900/10 to-pink-900/10">
    {/* 城市光斑 */}
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full blur-xl animate-float-bokeh"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 100 + 50}px`,
          height: `${Math.random() * 100 + 50}px`,
          background: i % 2 === 0 ? 'rgba(255, 200, 100, 0.2)' : 'rgba(255, 100, 150, 0.2)',
          animationDuration: `${Math.random() * 10 + 10}s`
        }}
      />
    ))}

    {/* 羽毛 */}
    {Array.from({ length: 25 }).map((_, i) => (
      <div
        key={`f-${i}`}
        className="absolute animate-feather-sway"
        style={{
          left: `${Math.random() * 100}%`,
          top: '-50px',
          fontSize: `${Math.random() * 20 + 20}px`,
          animationDuration: `${Math.random() * 5 + 5}s`,
          animationDelay: `${Math.random() * 3}s`,
          opacity: 0.9,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}
      >
        🪶
      </div>
    ))}
  </div>
)

/* --------------------------------------------------------------------------------
   4. Gothic Fog (哥特迷雾 - 奇夏)
   - 迷雾 + 蝙蝠剪影
-------------------------------------------------------------------------------- */
const GothicFog = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black/20">
    {/* 迷雾层 */}
    <div className="absolute inset-0 opacity-60 mix-blend-overlay animate-fog-flow"
      style={{
        backgroundImage: 'linear-gradient(to right, transparent, rgba(200,200,200,0.2), transparent)',
        backgroundSize: '200% 100%'
      }} />
    <div className="absolute inset-0 opacity-40 mix-blend-overlay animate-fog-flow-reverse"
      style={{
        backgroundImage: 'linear-gradient(to right, transparent, rgba(150,150,150,0.1), transparent)',
        backgroundSize: '200% 100%'
      }} />

    {/* 蝙蝠 - 使用SVG剪影代替Emoji */}
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-8 h-8 animate-bat-fly"
        style={{
          left: '-50px',
          top: `${Math.random() * 50 + 10}%`,
          animationDuration: `${Math.random() * 5 + 8}s`,
          animationDelay: `${Math.random() * 5}s`,
          opacity: 0.7
        }}
      >
        <svg viewBox="0 0 24 24" fill="black" className="w-full h-full drop-shadow-lg">
          <path d="M22,12C22,12 19,8 15,9C15,9 13.5,6 12,6C10.5,6 9,9 9,9C5,8 2,12 2,12C2,12 5,14 8,13C8,13 10,16 12,16C14,16 16,13 16,13C19,14 22,12 22,12Z" />
        </svg>
      </div>
    ))}
  </div>
)

/* --------------------------------------------------------------------------------
   5. Ink Flow (水墨禅意 - 旧梦)
   - 水墨山水画背景 (SVG 绘制) + 动态墨滴
   - 优化：使用 CSS Noise 替代 SVG feTurbulence 以提升移动端性能
-------------------------------------------------------------------------------- */
const InkFlow = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#f4e4bc]/10 animate-in fade-in duration-1000">
    {/* 古书滤镜：使用 sepia 营造陈旧感，叠加暖褐色遮罩 */}
    <div className="absolute inset-0 backdrop-sepia-[0.3] backdrop-contrast-[0.95] bg-[#8b5a2b]/5 mix-blend-color-burn z-[1]" />

    {/* SVG Filter for Gooey/Ink effect ONLY */}
    <svg className="hidden">
      <defs>
        <filter id="ink-spread">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        {/* 笔触纹理滤镜 */}
        <filter id="brush-stroke">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
        </filter>
      </defs>
    </svg>

    {/* 纸张纹理叠加 - 使用 CSS 噪点替代 SVG 滤镜 */}
    <div
      className="absolute inset-0 opacity-10 mix-blend-multiply z-[2]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '150px 150px'
      }}
    />

    {/* 水墨山水背景层 */}
    <div className="absolute inset-0 z-[0] opacity-30">
      {/* 远山 (淡墨) */}
      <svg className="absolute bottom-0 w-full h-[50%] text-gray-400/20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 L0 50 C 20 60 40 30 60 50 C 80 70 90 40 100 60 L 100 100 Z" fill="currentColor" style={{ filter: 'url(#brush-stroke)' }} />
      </svg>

      {/* 中景山 (中墨) */}
      <svg className="absolute bottom-0 w-full h-[40%] text-gray-600/30" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 L0 70 C 30 50 50 80 70 60 C 80 50 90 80 100 70 L 100 100 Z" fill="currentColor" style={{ filter: 'url(#brush-stroke)' }} />
      </svg>

      {/* 近景山 (浓墨) */}
      <svg className="absolute bottom-0 w-full h-[25%] text-gray-800/40" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 100 L0 80 C 15 70 30 90 50 80 C 70 70 85 90 100 80 L 100 100 Z" fill="currentColor" style={{ filter: 'url(#brush-stroke)' }} />
      </svg>

      {/* 孤舟/飞鸟点缀 */}
      <div className="absolute top-[30%] right-[20%] text-black/40 opacity-50 text-4xl animate-float-slow">
        〰️ 🛶
      </div>
    </div>

    {/* 动态墨滴扩散 (前景) */}
    <div className="absolute inset-0 z-[3]" style={{ filter: 'url(#ink-spread)' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`ink-${i}`}
          className="absolute rounded-full bg-black/70 animate-ink-spread"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            width: 'clamp(60px, 15vw, 120px)',
            height: 'clamp(60px, 15vw, 120px)',
            animationDuration: `${Math.random() * 4 + 4}s`,
            animationDelay: `${Math.random() * 2}s`,
            transform: 'scale(0)',
            opacity: 0
          }}
        />
      ))}

      {/* 烟雾/墨流 */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`flow-${i}`}
          className="absolute bg-gray-900/10 blur-xl animate-smoke-flow"
          style={{
            left: '-20%',
            top: `${Math.random() * 60 + 20}%`,
            width: '140%',
            height: 'clamp(40px, 8vh, 80px)',
            animationDuration: `${Math.random() * 10 + 10}s`,
            animationDelay: `${Math.random() * 5}s`,
            transform: 'rotate(-5deg)'
          }}
        />
      ))}
    </div>
  </div>
)

/* --------------------------------------------------------------------------------
   6. Star Paparazzi (聚光灯 - 夜规)
   - 随机白屏闪光 (移除钻石)
-------------------------------------------------------------------------------- */
const StarPaparazzi = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* 闪光灯层 */}
    <div className="absolute inset-0 bg-white animate-flash-strobe opacity-0" />

    {/* 移除钻石元素 */}
  </div>
)

/* --------------------------------------------------------------------------------
   7. Apocalypse Ash (末世余烬 - 野孩子)
   - 灰暗滤镜 + 飘落灰烬 + 上升火星
-------------------------------------------------------------------------------- */
const ApocalypseAsh = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black/30">
    <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" /> {/* Vignette */}

    {/* 灰烬 */}
    {Array.from({ length: 60 }).map((_, i) => (
      <div
        key={`ash-${i}`}
        className="absolute rounded-full bg-gray-400 animate-ash-fall"
        style={{
          left: `${Math.random() * 100}%`,
          top: '-10px',
          width: `${Math.random() * 4 + 1}px`,
          height: `${Math.random() * 4 + 1}px`,
          opacity: Math.random() * 0.5 + 0.2,
          animationDuration: `${Math.random() * 4 + 3}s`,
          animationDelay: `${Math.random() * 2}s`
        }}
      />
    ))}

    {/* 火星 */}
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={`ember-${i}`}
        className="absolute rounded-full bg-orange-500 animate-ember-rise"
        style={{
          left: `${Math.random() * 100}%`,
          bottom: '-10px',
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          boxShadow: '0 0 4px orangered',
          animationDuration: `${Math.random() * 3 + 2}s`,
          animationDelay: `${Math.random() * 2}s`
        }}
      />
    ))}
  </div>
)

/* --------------------------------------------------------------------------------
   8. Birthday Starlight (星光魔法 - 3.25 生日)
   - 极光背景 + 汇聚星光 + 隐晦年龄显示
-------------------------------------------------------------------------------- */
const BirthdayStarlight = () => {
  // 计算年龄 (1997-03-25)
  const birthYear = 1997
  const currentYear = new Date().getFullYear()
  const age = currentYear - birthYear

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-900/40 animate-in fade-in duration-1000">
      {/* 极光背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-amber-900/30 animate-pulse-slow" />

      {/* 魔法星光 */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute text-yellow-200 animate-twinkle-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 20 + 10}px`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0
          }}
        >
          {Math.random() > 0.5 ? '✨' : '⭐'}
        </div>
      ))}

      {/* 中心文字与年龄彩蛋 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
        <div className="text-4xl md:text-6xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-200 animate-float-up drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
          Happy 3.25
        </div>

        {/* 隐晦的年龄显示：Level X */}
        <div className="mt-4 text-lg md:text-xl font-mono text-yellow-100/60 tracking-[0.3em] md:tracking-[0.5em] opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1000 fill-mode-forwards text-center">
          LEVEL {age} UNLOCKED
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------------
   Main Component
-------------------------------------------------------------------------------- */
export default function FullScreenEffects({ type, emoji, onComplete }: FullScreenEffectProps) {
  useEffect(() => {
    // 6秒后自动结束特效 (稍微延长一点以展示完整效果)
    const timer = setTimeout(() => {
      onComplete()
    }, 6000)
    return () => clearTimeout(timer)
  }, [onComplete, type]) // Reset timer when type changes

  if (type === 'none') return null

  if (type === 'zero-gravity') {
    return <ZeroGravity onComplete={onComplete} />
  }

  if (type === 'emoji-storm') {
    return <EmojiStorm emoji={emoji} onComplete={onComplete} />
  }

  if (type === 'retro-arcade') {
    return <RetroArcade onComplete={onComplete} />
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {type === 'sakura-breeze' && <SakuraBreeze />}
      {type === 'police-glitch' && <PoliceGlitch />}
      {type === 'city-dream' && <CityDream />}
      {type === 'gothic-fog' && <GothicFog />}
      {type === 'ink-flow' && <InkFlow />}
      {type === 'star-paparazzi' && <StarPaparazzi />}
      {type === 'apocalypse-ash' && <ApocalypseAsh />}
      {type === 'birthday-starlight' && <BirthdayStarlight />}
    </div>
  )
}
