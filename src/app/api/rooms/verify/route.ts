import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { roomId, password } = await request.json()

    if (!roomId || !password) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const { data: room, error } = await supabase
      .from('rooms')
      .select('password_hash')
      .eq('id', roomId)
      .single()

    if (error || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex')

    if (hash === room.password_hash) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    console.error('Verify room exception:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
