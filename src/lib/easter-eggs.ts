export type EasterEggEffect = 'confetti' | 'love' | 'shake' | 'glow' | 'rain' | 'fire' | 'shark-shadow' | 'wizard-shadow'
export type FullScreenEffectType =
  | 'sakura-breeze'    // 捡手机：樱花+光斑
  | 'police-glitch'    // w警：蓝红故障风+数字雨
  | 'city-dream'       // 玛利亚：城市光斑+羽毛
  | 'gothic-fog'       // 奇夏：迷雾+蝙蝠
  | 'ancient-tragedy'  // 旧梦：寒雪+残红
  | 'star-paparazzi'   // 夜规：闪光灯+钻石
  | 'apocalypse-ash'   // 野孩子：余烬+灰烬
  | 'none'

export interface EasterEggConfig {
  keywords: string[]
  effect: EasterEggEffect
  fullScreen?: FullScreenEffectType
  color?: string
  emoji?: string
}

// 小说彩蛋配置
export const EASTER_EGGS: EasterEggConfig[] = [
  {
    // 1. 《捡手机》 -> 樱花随风+阳光感
    keywords: ['捡手机'],
    effect: 'confetti',
    fullScreen: 'sakura-breeze',
    emoji: '🌸'
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
    // 5. 《旧梦遗抄》 -> 全屏寒雪残红
    keywords: ['旧梦遗抄', '旧梦'],
    effect: 'rain',
    fullScreen: 'ancient-tragedy',
    emoji: '❄️'
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
    keywords: ['魔法师', 'wizard', 'Wizard'],
    effect: 'wizard-shadow',
    fullScreen: 'none'
  }
]

export function getEasterEgg(content: string): EasterEggConfig | null {
  if (!content) return null
  const lowerContent = content.toLowerCase()

  return EASTER_EGGS.find(egg =>
    egg.keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))
  ) || null
}
