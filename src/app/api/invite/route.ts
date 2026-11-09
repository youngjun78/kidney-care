import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// 1. 자녀가 부모님 초대 링크 생성 시 1회용 보안 토큰 발급
export async function POST(req: Request) {
  try {
    const { familyCode } = await req.json();

    if (!familyCode) {
      return NextResponse.json({ error: '가족 코드가 필요합니다.' }, { status: 400 });
    }

    // 32자리 무작위 암호 토큰 생성 (추측/무차별 대입 불가능)
    const token = 'inv_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24시간 유효

    if (supabase) {
      // Supabase families 테이블의 invite_token 필드에 저장
      // (토큰, 만료일시, 사용여부)
      const { error } = await supabase
        .from('families')
        .update({
          invite_token: token,
          invite_expires_at: expiresAt,
          invite_used: false,
        })
        .eq('family_code', familyCode);

      if (error) {
        console.error('Invite token save error:', error);
      }
    }

    return NextResponse.json({ token, expiresAt });
  } catch (err: any) {
    console.error('Invite generation error:', err);
    return NextResponse.json({ error: err.message || '초대 토큰 생성 실패' }, { status: 500 });
  }
}

// 2. 부모님이 링크 탭 시 토큰 검증 및 즉시 1회용 소멸
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token')?.trim();

    if (!token) {
      return NextResponse.json({ valid: false, error: '유효한 초대 토큰이 아닙니다.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ valid: true, familyCode: 'FAMILY', isMock: true });
    }

    // 토큰으로 가족 조회
    const { data: family, error } = await supabase
      .from('families')
      .select('family_code, child_name, invite_expires_at, invite_used')
      .eq('invite_token', token)
      .maybeSingle();

    if (error || !family) {
      return NextResponse.json({
        valid: false,
        error: '유효하지 않거나 이미 만료된 초대 링크입니다.',
      });
    }

    // 만료 시간 검증
    if (family.invite_expires_at && new Date(family.invite_expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: '초대 링크의 유효시간(24시간)이 만료되었습니다. 자녀분께 새 초대장을 요청해주세요.',
      });
    }

    // 1회용 사용 처리: 이미 사용된 경우 차단
    if (family.invite_used) {
      return NextResponse.json({
        valid: false,
        error: '이미 사용된 1회용 초대 링크입니다. 자녀분께 새 링크를 요청해주세요.',
      });
    }

    // 1회 사용 즉시 소멸 처리 (used: true)
    await supabase
      .from('families')
      .update({ invite_used: true })
      .eq('invite_token', token);

    return NextResponse.json({
      valid: true,
      familyCode: family.family_code,
      childName: family.child_name || '자녀',
    });
  } catch (err: any) {
    console.error('Token verify error:', err);
    return NextResponse.json({ valid: false, error: '초대 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
