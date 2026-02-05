'use client'

import { useState, useEffect } from 'react'
import ChatRoom from '@/components/ChatRoom'
import { Lock, ArrowRight } from 'lucide-react'
import ClickSparkles from '@/components/ClickSparkles'
import FluidCursorTrail from '@/components/FluidCursorTrail'

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params
  const [isVerified, setIsVerified] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  // Public room bypass
  if (roomId === 'public') {
    return <ChatRoom />
  }

  // Check verification
  useEffect(() => {
    const verified = localStorage.getItem(`room_access_${roomId}`)
    if (verified === 'true') {
      setIsVerified(true)
    }
    setChecking(false)
  }, [roomId])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/rooms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      localStorage.setItem(`room_access_${roomId}`, 'true')
      setIsVerified(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (roomId === 'public' || isVerified) {
    return <ChatRoom roomId={roomId === 'public' ? null : roomId} />
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ClickSparkles />
      <FluidCursorTrail />
      
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Private Room</h1>
          <p className="text-gray-500 mt-2">Enter password to join</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-center text-lg tracking-widest"
              autoFocus
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg animate-in fade-in slide-in-from-top-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? 'Verifying...' : 'Enter Room'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </div>
    </div>
  )
}
