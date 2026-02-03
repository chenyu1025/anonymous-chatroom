'use client'

import { useEffect, useRef } from 'react'
import { FullScreenEffectType } from '@/lib/easter-eggs'

interface FullScreenEffectProps {
  type: FullScreenEffectType
  onComplete: () => void
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
   5. Ancient Tragedy (寒雪残红 - 旧梦)
   - 寒冷滤镜 + 飞雪 + 凋零红花
-------------------------------------------------------------------------------- */
const AncientTragedy = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-900/20">
    {/* 寒冷滤镜 */}
    <div className="absolute inset-0 mix-blend-overlay bg-blue-900/30" />

    {/* 飞雪 */}
    {Array.from({ length: 100 }).map((_, i) => (
      <div
        key={`snow-${i}`}
        className="absolute rounded-full bg-white animate-snow-fall"
        style={{
          left: `${Math.random() * 100}%`,
          top: '-10px',
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          opacity: Math.random() * 0.7 + 0.3,
          animationDuration: `${Math.random() * 5 + 3}s`,
          animationDelay: `${Math.random() * 2}s`
        }}
      />
    ))}

    {/* 凋零红花 (CSS模拟花瓣) */}
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={`petal-${i}`}
        className="absolute animate-withered-fall"
        style={{
          left: `${Math.random() * 100}%`,
          top: '-20px',
          animationDuration: `${Math.random() * 4 + 4}s`,
          animationDelay: `${Math.random() * 3}s`
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C12 2 15 5 15 10C15 15 10 18 10 18C10 18 5 15 5 10C5 5 8 2 10 2Z" fill="#8B0000" fillOpacity="0.8" />
        </svg>
      </div>
    ))}
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
   Main Component
-------------------------------------------------------------------------------- */
export default function FullScreenEffects({ type, onComplete }: FullScreenEffectProps) {
  useEffect(() => {
    // 6秒后自动结束特效 (稍微延长一点以展示完整效果)
    const timer = setTimeout(() => {
      onComplete()
    }, 6000)
    return () => clearTimeout(timer)
  }, [onComplete, type]) // Reset timer when type changes

  if (type === 'none') return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {type === 'sakura-breeze' && <SakuraBreeze />}
      {type === 'police-glitch' && <PoliceGlitch />}
      {type === 'city-dream' && <CityDream />}
      {type === 'gothic-fog' && <GothicFog />}
      {type === 'ancient-tragedy' && <AncientTragedy />}
      {type === 'star-paparazzi' && <StarPaparazzi />}
      {type === 'apocalypse-ash' && <ApocalypseAsh />}
    </div>
  )
}
