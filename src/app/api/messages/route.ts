import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionId } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    let query = supabase
      .from('messages')
      .select(`
        *,
        users!inner(session_id)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取消息错误:', error)
      return NextResponse.json(
        { error: '获取消息失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: data || [] })
  } catch (error) {
    console.error('获取消息异常:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, userType, userId } = await request.json()

    if (!content || !userType || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          content: content.trim(),
          user_id: userId,
          user_type: userType,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('发送消息错误:', error)
      return NextResponse.json(
        { error: '发送消息失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error('发送消息异常:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}