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
        users!inner(session_id, theme_id),
        reply_to:messages!reply_to_id(
          id,
          content,
          user_type,
          type,
          file_url,
          created_at,
          user_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      // 确保 before 是有效的时间戳格式
      const beforeDate = new Date(before)
      if (!isNaN(beforeDate.getTime())) {
        query = query.lt('created_at', beforeDate.toISOString())
      }
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
    const { id, content, userType, userId, type = 'text', fileUrl, replyToId } = await request.json()

    if ((!content && !fileUrl) || !userType || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 先尝试查找用户
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('session_id', userId)
      .single()

    // 如果用户不存在，尝试通过 ID 查找（兼容旧数据）
    if (!user) {
      const { data: userById } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()
      user = userById
    }

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在，请刷新页面重试' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          ...(id ? { id } : {}),
          content: content?.trim() || (type === 'image' ? '[图片]' : '[语音]'),
          user_id: user.id, // 使用正确的 UUID
          user_type: userType,
          type,
          file_url: fileUrl,
          reply_to_id: replyToId
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