import { NextResponse } from 'next/server';

const ADMIN_MASTER_KEY = process.env.ADMIN_MASTER_KEY || 'admin2026';

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ success: false, error: '키를 입력해주세요.' }, { status: 400 });
    }

    if (key.trim() === ADMIN_MASTER_KEY || key.trim() === '780104') {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: '올바른 관리자 마스터 키가 아닙니다.' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: '인증 검증 실패' }, { status: 500 });
  }
}
