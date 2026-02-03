'use client'

import { OWNER_THEMES, Theme } from '@/lib/themes'
import Image from 'next/image'

interface ThemeSelectorProps {
  currentThemeId: string
  onSelect: (themeId: string) => void
}

export default function ThemeSelector({ currentThemeId, onSelect }: ThemeSelectorProps) {
  return (
    <div className="glass p-4 rounded-xl mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">选择气泡主题</h3>
      <div className="grid grid-cols-5 gap-3">
        {OWNER_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={`relative flex flex-col items-center p-2 rounded-lg transition-all ${currentThemeId === theme.id
              ? 'bg-purple-50 ring-2 ring-purple-500 ring-offset-2'
              : 'hover:bg-gray-50'
              }`}
          >
            <div className={`relative w-12 h-12 rounded-full overflow-hidden border-2 ${currentThemeId === theme.id ? 'border-purple-400' : 'border-gray-200'
              }`}>
              <Image
                src={theme.avatar}
                alt={theme.name}
                fill
                className="object-cover"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
