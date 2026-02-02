'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setUserType, getSessionId } from '@/lib/session'
import ThemeSelector from '@/components/ThemeSelector'
import { DEFAULT_THEME_ID } from '@/lib/themes'

export default function OwnerAuth() {
  const [password, setPassword] = useState('')
  const [selectedThemeId, setSelectedThemeId] = useState(DEFAULT_THEME_ID)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        // 更新用户主题
        const sessionId = getSessionId()
        if (sessionId) {
          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userType: 'owner',
              sessionId: sessionId,
              themeId: selectedThemeId
            })
          }).catch(console.error)
        }

        setUserType('owner')
        router.push('/')
      } else {
        setError(data.message || '密码错误')
      }
    } catch (error) {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">聊天室主人</h1>
          <p className="text-gray-600">选择您的气泡主题并输入密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ThemeSelector 
            currentThemeId={selectedThemeId}
            onSelect={setSelectedThemeId}
          />
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入密码"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? '验证中...' : '进入聊天室'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-purple-600 hover:text-purple-700 text-sm">
            以访客身份进入
          </a>
        </div>
      </div>
    </div>
  )
}