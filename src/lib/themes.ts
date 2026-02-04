export interface Theme {
  id: string
  name: string
  avatar: string
  bubbleClass: string
  textClass: string
  borderClass: string
  arrowColor: string // CSS color value for the arrow border
  backgroundGradient: string // CSS linear-gradient value
}

export const OWNER_THEMES: Theme[] = [
  {
    id: 'sprigatito',
    name: '新叶喵',
    avatar: '/themes/sprigatito.png',
    bubbleClass: 'bg-[#98e29d] border-emerald-200',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
    arrowColor: '#98e29d',
    backgroundGradient: 'linear-gradient(-45deg, #f0fdf4, #dcfce7, #bbf7d0, #f0fdf4)'
  },
  {
    id: 'bulbasaur',
    name: '妙蛙种子',
    avatar: '/themes/bulbasaur.png',
    bubbleClass: 'bg-[#4ad0b0] border-teal-200',
    textClass: 'text-teal-900',
    borderClass: 'border-teal-300',
    arrowColor: '#4ad0b0',
    backgroundGradient: 'linear-gradient(-45deg, #f0fdfa, #ccfbf1, #99f6e4, #f0fdfa)'
  },
  {
    id: 'rowlet',
    name: '木木枭',
    avatar: '/themes/rowlet.png',
    bubbleClass: 'bg-[#bfd0ca] border-stone-200',
    textClass: 'text-stone-800',
    borderClass: 'border-stone-300',
    arrowColor: '#bfd0ca',
    backgroundGradient: 'linear-gradient(-45deg, #fafaf9, #f5f5f4, #e7e5e4, #fafaf9)'
  },
  {
    id: 'shaymin',
    name: '谢米',
    avatar: '/themes/shaymin.png',
    bubbleClass: 'bg-[#b8e986] border-lime-200',
    textClass: 'text-lime-900',
    borderClass: 'border-lime-300',
    arrowColor: '#b8e986',
    backgroundGradient: 'linear-gradient(-45deg, #f7fee7, #ecfccb, #d9f99d, #f7fee7)'
  },
  {
    id: 'chiikawa',
    name: '吉伊卡哇',
    avatar: '/themes/chiikawa.png',
    bubbleClass: 'bg-white border-pink-200',
    textClass: 'text-gray-800',
    borderClass: 'border-pink-300',
    arrowColor: '#ffffff',
    backgroundGradient: 'linear-gradient(-45deg, #fff1f2, #ffe4e6, #fecdd3, #fff1f2)'
  },
  {
    id: 'hachiware',
    name: '小八',
    avatar: '/themes/hachiware.png',
    bubbleClass: 'bg-[#daefff] border-blue-200',
    textClass: 'text-blue-900',
    borderClass: 'border-blue-300',
    arrowColor: '#daefff',
    backgroundGradient: 'linear-gradient(-45deg, #eff6ff, #dbeafe, #bfdbfe, #eff6ff)'
  },
  {
    id: 'usagi',
    name: '乌萨奇',
    avatar: '/themes/usagi.png',
    bubbleClass: 'bg-[#fff5ba] border-yellow-200',
    textClass: 'text-yellow-900',
    borderClass: 'border-yellow-300',
    arrowColor: '#fff5ba',
    backgroundGradient: 'linear-gradient(-45deg, #fefce8, #fef9c3, #fef08a, #fefce8)'
  },
  {
    id: 'doraemon',
    name: '哆啦A梦',
    avatar: '/themes/doraemon.png',
    bubbleClass: 'bg-[#2ea0ee] border-blue-400', // 背景轻微加深一点，#2ea0ee 比原#3caeff深
    textClass: 'text-white font-medium drop-shadow-xs', // 细粗+超轻微阴影
    borderClass: 'border-blue-500',
    arrowColor: '#2ea0ee', // 箭头和背景同步
    backgroundGradient: 'linear-gradient(-45deg, #e6f9ff, #c5f0fd, #9ee2fb, #e6f9ff)' // 渐变也轻微加深一点
  },
  {
    id: 'backkom',
    name: '倒霉熊',
    avatar: '/themes/backkom.png',
    bubbleClass: 'bg-gray-100 border-gray-300',
    textClass: 'text-gray-900',
    borderClass: 'border-gray-400',
    arrowColor: '#f3f4f6',
    backgroundGradient: 'linear-gradient(-45deg, #f8fafc, #f1f5f9, #e2e8f0, #f8fafc)'
  },
  {
    id: 'kirby',
    name: '星之卡比',
    avatar: '/themes/kirby.png',
    bubbleClass: 'bg-[#ffcce5] border-pink-200',
    textClass: 'text-pink-900',
    borderClass: 'border-pink-300',
    arrowColor: '#ffcce5',
    backgroundGradient: 'linear-gradient(-45deg, #fff0f5, #fce7f3, #fbcfe8, #fff0f5)'
  }
]

export const DEFAULT_THEME_ID = 'sprigatito'
