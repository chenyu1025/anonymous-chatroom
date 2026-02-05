import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    // Simple hash
    const hash = crypto.createHash('sha256').update(password).digest('hex')

    const { data, error } = await supabase
      .from('rooms')
      .insert([{ password_hash: hash }])
      .select()
      .single()

    if (error) {
      console.error('Create room error:', error)
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    return NextResponse.json({ roomId: data.id })
  } catch (error) {
    console.error('Create room exception:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
