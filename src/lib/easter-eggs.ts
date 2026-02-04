export type EasterEggEffect = 'confetti' | 'love' | 'shake' | 'glow' | 'rain' | 'fire' | 'shark-shadow' | 'wizard-shadow'
export type FullScreenEffectType =
  | 'sakura-breeze'    // 捡手机：樱花+光斑
  | 'police-glitch'    // w警：蓝红故障风+数字雨
  | 'city-dream'       // 玛利亚：城市光斑+羽毛
  | 'gothic-fog'       // 奇夏：迷雾+蝙蝠
  | 'ancient-tragedy'  // 旧梦：寒雪+残红
  | 'ink-flow'         // 水墨禅意：黑白晕染
  | 'emoji-storm'      // 表情包雨：喷泉 + 互动
  | 'retro-arcade'     // 像素街机：CRT + Tetris
  | 'star-paparazzi'   // 夜规：闪光灯+钻石
  | 'apocalypse-ash'   // 野孩子：余烬+灰烬
  | 'birthday-starlight' // 生日：星光魔法 + 年龄彩蛋
  | 'zero-gravity'     // 零重力：物理引擎漂浮
  | 'none'

export interface EasterEggConfig {
  keywords: string[]
  effect: EasterEggEffect
  fullScreen?: FullScreenEffectType
  color?: string
  emoji?: string
  dateExclusive?: { month: number; day: number } // 可选：指定生效日期
}

// 小说彩蛋配置
export const EASTER_EGGS: EasterEggConfig[] = [
  {
    // 1. 《捡手机》 -> 零重力手机漂浮
    keywords: ['捡手机'],
    effect: 'glow',
    fullScreen: 'zero-gravity',
    emoji: '📱'
  },
  {
    // 2. 《只有一件事是重要的》 -> 赛博故障+警灯色调
    keywords: ['只有一件事是重要的', 'w警'],
    effect: 'glow',
    color: '#3b82f6',
    fullScreen: 'police-glitch',
    emoji: '🚨'
  },
  {
    // 3. 《亲爱的玛利亚》 -> 唯美城市光影+羽毛
    keywords: ['亲爱的玛利亚', '玛利亚'],
    effect: 'confetti',
    fullScreen: 'city-dream',
    emoji: '🪶'
  },
  {
    // 4. 《奇妙夏日》 -> 哥特迷雾
    keywords: ['奇妙夏日', '奇夏'],
    effect: 'rain',
    fullScreen: 'gothic-fog',
    // emoji: '🦇' // 用户要求文字上不要蝙蝠
  },
  {
    // 5. 《旧梦遗抄》 -> 水墨禅意
    keywords: ['旧梦遗抄', '旧梦'],
    effect: 'rain',
    fullScreen: 'ink-flow',
    emoji: '✒️'
  },
  {
    // 6. 《夜间规则》 -> 聚光灯
    keywords: ['夜间规则', '夜规'],
    effect: 'love',
    fullScreen: 'star-paparazzi',
    // emoji: '💎' // 移除钻石
  },
  {
    // 7. 《野孩子》 -> 末世灰烬余火
    keywords: ['野孩子'],
    effect: 'fire',
    fullScreen: 'apocalypse-ash',
    emoji: '🔥'
  },
  {
    // 8. Shark -> 掠食者之影 (鲨鱼鳍倒影)
    keywords: ['shark', 'Shark'],
    effect: 'shark-shadow',
    fullScreen: 'none'
  },
  {
    // 9. 魔法师 -> 魔法师剪影
    keywords: ['魔法师', '5376'],
    effect: 'wizard-shadow',
    fullScreen: 'none'
  },
  {
    // 10. 生日彩蛋 -> 3.25 全屏庆典
    keywords: ['3.25', '3月25', '0325', '生日快乐', 'Happy Birthday', 'happy birthday', '生快'],
    effect: 'glow',
    color: '#FFD700', // 金色
    fullScreen: 'birthday-starlight',
    emoji: '🌟',
    dateExclusive: { month: 2, day: 25 } // 仅在 3月25日生效 (月份从0开始)
  },
  {
    // 11. 1997 (复古街机 -> 掉书)
    keywords: ['1997', '一九九七', '九七', '实体', '出本'],
    effect: 'confetti',
    fullScreen: 'retro-arcade',
    emoji: '📚'
  }
]

export function getEasterEgg(content: string): EasterEggConfig | null {
  if (!content) return null

  // 0. 检查 Emoji Storm 触发条件 (单个 Emoji 重复 3 次以上)
  // 简化版正则，匹配非ASCII字符重复3次以上
  // 这是一个近似解法，因为 JS 的 Emoji 正则比较复杂，这里假设用户输入的非ASCII重复字符就是 Emoji
  const emojiStormRegex = /^([^\x00-\x7F])\1{2,}$/
  const match = content.match(emojiStormRegex)

  if (match) {
    return {
      keywords: [], // Dynamic trigger
      effect: 'confetti', // Base effect
      fullScreen: 'emoji-storm',
      emoji: match[1] // Capture the specific emoji
    }
  }

  const lowerContent = content.toLowerCase()
  const now = new Date()

  return EASTER_EGGS.find(egg => {
    // 1. 检查日期限制
    if (egg.dateExclusive) {
      if (now.getMonth() !== egg.dateExclusive.month || now.getDate() !== egg.dateExclusive.day) {
        return false
      }
    }

    // 2. 检查关键词
    return egg.keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))
  }) || null
}
