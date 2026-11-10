import { NextResponse } from 'next/server';
import crypto from 'crypto';

// NextAuth 시크릿 키를 서명 비밀키로 활용 (서버만 아는 고유 키)
const SECRET = process.env.NEXTAUTH_SECRET || 'kidney-care-auth-secret-key-3040-5070-ckd';

// 1. 자녀가 부모님 초대 링크 생성 시: 위변조 불가능한 서명 토큰(HMAC-SHA256) 발급
export async function POST(req: Request) {
  try {
    const { familyCode } = await req.json();

    if (!familyCode) {
      return NextResponse.json({ error: '가족 코드가 필요합니다.' }, { status: 400 });
    }

    // 페이로드 구성: 가족코드 + 48시간 유효기간 + 무작위 난수
    const payload = {
      familyCode,
      exp: Date.now() + 48 * 60 * 60 * 1000, // 48시간 유효
      nonce: crypto.randomBytes(6).toString('hex'),
    };

    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');
    const token = `${payloadStr}.${signature}`;

    return NextResponse.json({ token });
  } catch (err: any) {
    console.error('Invite generation error:', err);
    return NextResponse.json({ error: err.message || '초대 토큰 생성 실패' }, { status: 500 });
  }
}

// 2. 부모님이 링크 탭 시: 디지털 서명 검증 및 즉시 자동 로그인 승인
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token')?.trim();

    if (!token || !token.includes('.')) {
      return NextResponse.json({ valid: false, error: '유효한 초대 링크가 아닙니다.' }, { status: 400 });
    }

    const [payloadStr, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');

    // 서명 위변조 검증
    if (signature !== expectedSignature) {
      return NextResponse.json({
        valid: false,
        error: '위변조되었거나 유효하지 않은 초대 링크입니다.',
      });
    }

    // 페이로드 해석 및 만료 검증
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));

    if (payload.exp && Date.now() > payload.exp) {
      return NextResponse.json({
        valid: false,
        error: '초대 링크의 유효시간(48시간)이 만료되었습니다. 자녀분께 새 링크를 요청해주세요.',
      });
    }

    if (!payload.familyCode) {
      return NextResponse.json({ valid: false, error: '가족 코드 정보가 없습니다.' });
    }

    return NextResponse.json({
      valid: true,
      familyCode: payload.familyCode,
      childName: '자녀',
    });
  } catch (err: any) {
    console.error('Token verify error:', err);
    return NextResponse.json({ valid: false, error: '초대장 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
