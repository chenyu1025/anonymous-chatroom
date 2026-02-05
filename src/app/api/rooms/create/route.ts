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

    if (!data) {
      console.error('Create room error: No data returned')
      return NextResponse.json({ error: 'Failed to create room (no data)' }, { status: 500 })
    }

    return NextResponse.json({ roomId: data.id })
  } catch (error: any) {
    console.error('Create room exception:', error)
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 })
  }
}
