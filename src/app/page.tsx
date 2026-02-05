'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MessageCircle, Copy, Check, ArrowRight, Lock, X } from 'lucide-react'
import ClickSparkles from '@/components/ClickSparkles'
import FluidCursorTrail from '@/components/FluidCursorTrail'

export default function Lobby() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [password, setPassword] = useState('')
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null)
  const [guestLink, setGuestLink] = useState('')
  const [ownerLink, setOwnerLink] = useState('')
  const [copiedGuest, setCopiedGuest] = useState(false)
  const [copiedOwner, setCopiedOwner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Wizard Auth State
  const [showWizardAuth, setShowWizardAuth] = useState(false)
  const [wizardInput, setWizardInput] = useState('')
  const [wizardError, setWizardError] = useState(false)

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      if (!data.roomId) {
        throw new Error('Server returned no Room ID')
      }

      setCreatedRoomId(data.roomId)
      const origin = window.location.origin
      setGuestLink(`${origin}/room/${data.roomId}`)
      setOwnerLink(`${origin}/room/${data.roomId}?auth=owner`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (text: string, isOwner: boolean) => {
    navigator.clipboard.writeText(text)
    if (isOwner) {
      setCopiedOwner(true)
      setTimeout(() => setCopiedOwner(false), 2000)
    } else {
      setCopiedGuest(true)
      setTimeout(() => setCopiedGuest(false), 2000)
    }
  }

  const handleWizardEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (wizardInput.trim() === '是重要的') {
      router.push('/room/public')
    } else {
      setWizardError(true)
      setTimeout(() => setWizardError(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ClickSparkles />
      <FluidCursorTrail />

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 rotate-3 hover:rotate-6 transition-transform">
            <MessageCircle className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Chatroom
          </h1>
          <p className="text-gray-500 mt-2">Create a private space or enter the Wizard's Room</p>
        </div>

        {!isCreating && !createdRoomId && (
          <div className="space-y-4">
            <button
              onClick={() => setShowWizardAuth(true)}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <span className="text-xl">🧙‍♂️</span>
              </div>
              Enter Wizard's Room
              <ArrowRight size={18} className="text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Plus size={20} className="text-purple-600" />
              Create Private Room
            </button>
          </div>
        )}

        {isCreating && !createdRoomId && (
          <form onSubmit={handleCreateRoom} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800">Set Room Password</h2>
              <p className="text-sm text-gray-500 mt-1">Protect your room from uninvited guests</p>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        )}

        {createdRoomId && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center mb-3">
                <Check size={24} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Room Created!</h2>
              <p className="text-sm text-gray-500 mt-1">Share these links to invite others</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Guest Link (No Password)</label>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
                  <code className="flex-1 text-sm text-gray-600 truncate">
                    {guestLink}
                  </code>
                  <button
                    onClick={() => handleCopyLink(guestLink, false)}
                    className={`p-2 rounded-lg transition-colors ${copiedGuest ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-500'
                      }`}
                    title="Copy Guest Link"
                  >
                    {copiedGuest ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-purple-600 ml-1 mb-1 block">Owner Link (Requires Password)</label>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center gap-3">
                  <code className="flex-1 text-sm text-purple-700 truncate">
                    {ownerLink}
                  </code>
                  <button
                    onClick={() => handleCopyLink(ownerLink, true)}
                    className={`p-2 rounded-lg transition-colors ${copiedOwner ? 'bg-green-100 text-green-600' : 'hover:bg-purple-200 text-purple-600'
                      }`}
                    title="Copy Owner Link"
                  >
                    {copiedOwner ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push(ownerLink)}
                className="py-3 bg-purple-100 text-purple-700 font-semibold rounded-xl hover:bg-purple-200 transition-colors"
              >
                Enter as Owner
              </button>
              <button
                onClick={() => router.push(guestLink)}
                className="py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Enter as Guest
              </button>
            </div>
          </div>
        )}
        {showWizardAuth && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowWizardAuth(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>

              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto flex items-center justify-center mb-6">
                  <span className="text-3xl">🧙‍♂️</span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">Wizard's Riddle</h3>
                <p className="text-gray-500 text-sm mb-6">只有解开谜题的人才能进入</p>

                <form onSubmit={handleWizardEntry} className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-lg font-medium text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span>只有一件事</span>
                    <input
                      type="text"
                      value={wizardInput}
                      onChange={(e) => {
                        setWizardInput(e.target.value)
                        setWizardError(false)
                      }}
                      className={`w-24 bg-transparent border-b-2 focus:outline-none text-center transition-colors ${wizardError ? 'border-red-500 text-red-600' : 'border-purple-300 focus:border-purple-500'
                        }`}
                      placeholder="____"
                      maxLength={4}
                      autoFocus
                    />
                  </div>

                  {wizardError && (
                    <p className="text-red-500 text-sm animate-pulse">
                      不对哦，再想想...
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-4"
                  >
                    Confirm
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
