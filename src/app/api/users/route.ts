import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionId } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const { userType, sessionId: clientSessionId, themeId } = await request.json()
    // 优先使用客户端传来的 sessionId，因为服务端无法访问 localStorage
    const sessionId = clientSessionId

    if (!sessionId) {
      return NextResponse.json(
        { error: '无法获取会话ID' },
        { status: 400 }
      )
    }

    // 检查是否已存在用户
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, user_type, theme_id')
      .eq('session_id', sessionId)
      .single()

    if (existingUser) {
      // 如果请求中包含 themeId，则更新它
      const updates: any = {
        is_online: true,
        last_seen: new Date().toISOString(),
      }
      
      if (themeId && existingUser.user_type === 'owner') {
        updates.theme_id = themeId
      }

      // 更新在线状态和最后活跃时间
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id)
        .select()
        .single()

      if (error) {
        console.error('更新用户错误:', error)
        return NextResponse.json(
          { error: '更新用户信息失败' },
          { status: 500 }
        )
      }

      return NextResponse.json({ user: data })
    }

    // 创建新用户
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          session_id: sessionId,
          user_type: userType || 'guest',
          is_online: true,
          last_seen: new Date().toISOString(),
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('创建用户错误:', error)
      return NextResponse.json(
        { error: '创建用户失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('用户创建异常:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, user_type, is_online, last_seen')
      .eq('is_online', true)

    if (error) {
      console.error('获取在线用户错误:', error)
      return NextResponse.json(
        { error: '获取在线用户失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ users: data || [] })
  } catch (error) {
    console.error('获取在线用户异常:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}