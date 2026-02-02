export interface Theme {
  id: string
  name: string
  avatar: string
  bubbleClass: string
  textClass: string
  borderClass: string
  arrowColor: string // CSS color value for the arrow border
}

export const OWNER_THEMES: Theme[] = [
  {
    id: 'sprigatito',
    name: '新叶喵',
    avatar: '/sprigatito.png', // Keep original path for compatibility or use /themes/sprigatito.png
    bubbleClass: 'bg-[#98e29d] border-emerald-200',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
    arrowColor: '#98e29d'
  },
  {
    id: 'bulbasaur',
    name: '妙蛙种子',
    avatar: '/themes/bulbasaur.png',
    bubbleClass: 'bg-[#4ad0b0] border-teal-200',
    textClass: 'text-teal-900',
    borderClass: 'border-teal-300',
    arrowColor: '#4ad0b0'
  },
  {
    id: 'rowlet',
    name: '木木枭',
    avatar: '/themes/rowlet.png',
    bubbleClass: 'bg-[#bfd0ca] border-stone-200',
    textClass: 'text-stone-800',
    borderClass: 'border-stone-300',
    arrowColor: '#bfd0ca'
  },
  {
    id: 'shaymin',
    name: '谢米',
    avatar: '/themes/shaymin.png',
    bubbleClass: 'bg-[#b8e986] border-lime-200',
    textClass: 'text-lime-900',
    borderClass: 'border-lime-300',
    arrowColor: '#b8e986'
  },
  {
    id: 'chiikawa',
    name: '吉伊卡哇',
    avatar: '/themes/chiikawa.png', // Using Pikachu as placeholder but styled as Chiikawa
    bubbleClass: 'bg-white border-pink-200',
    textClass: 'text-gray-800',
    borderClass: 'border-pink-300',
    arrowColor: '#ffffff'
  },
  {
    id: 'hachiware',
    name: '小八',
    avatar: '/themes/hachiware.png', // Using Piplup as placeholder
    bubbleClass: 'bg-[#daefff] border-blue-200',
    textClass: 'text-blue-900',
    borderClass: 'border-blue-300',
    arrowColor: '#daefff'
  },
  {
    id: 'usagi',
    name: '乌萨奇',
    avatar: '/themes/usagi.png', // Using Lopunny as placeholder
    bubbleClass: 'bg-[#fff5ba] border-yellow-200',
    textClass: 'text-yellow-900',
    borderClass: 'border-yellow-300',
    arrowColor: '#fff5ba'
  },
  {
    id: 'doraemon',
    name: '哆啦A梦',
    avatar: '/themes/doraemon.png', // Using Wooper as placeholder
    bubbleClass: 'bg-[#3caeff] border-blue-300',
    textClass: 'text-white',
    borderClass: 'border-blue-400',
    arrowColor: '#3caeff'
  },
  {
    id: 'backkom',
    name: '倒霉熊',
    avatar: '/themes/backkom.png', // Using Teddiursa as placeholder
    bubbleClass: 'bg-gray-100 border-gray-300',
    textClass: 'text-gray-900',
    borderClass: 'border-gray-400',
    arrowColor: '#f3f4f6'
  },
  {
    id: 'kirby',
    name: '星之卡比',
    avatar: '/themes/kirby.png', // Using Jigglypuff as placeholder
    bubbleClass: 'bg-[#ffcce5] border-pink-200',
    textClass: 'text-pink-900',
    borderClass: 'border-pink-300',
    arrowColor: '#ffcce5'
  }
]

export const DEFAULT_THEME_ID = 'sprigatito'
