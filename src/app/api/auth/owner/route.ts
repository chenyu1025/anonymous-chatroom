import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const ownerPassword = process.env.OWNER_PASSWORD

    if (!ownerPassword) {
      return NextResponse.json(
        { success: false, message: '服务器配置错误' },
        { status: 500 }
      )
    }

    if (password === ownerPassword) {
      return NextResponse.json({ 
        success: true, 
        token: Buffer.from(password).toString('base64')
      })
    } else {
      return NextResponse.json(
        { success: false, message: '密码错误' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '请求格式错误' },
      { status: 400 }
    )
  }
}