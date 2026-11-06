import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 1. 자녀 로그인 시 가족 코드 생성 및 DB 등록
export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: '이메일 정보가 필요합니다.' }, { status: 400 });
    }

    if (!supabase) {
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      return NextResponse.json({ familyCode: mockCode, isMock: true });
    }

    const { data: existing } = await supabase
      .from('families')
      .select('family_code')
      .eq('child_email', email)
      .maybeSingle();

    if (existing?.family_code) {
      return NextResponse.json({ familyCode: existing.family_code });
    }

    let newCode = '';
    let isUnique = false;
    while (!isUnique) {
      newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: duplicate } = await supabase
        .from('families')
        .select('family_code')
        .eq('family_code', newCode)
        .maybeSingle();
      if (!duplicate) {
        isUnique = true;
      }
    }

    const { error: insertErr } = await supabase
      .from('families')
      .insert({
        family_code: newCode,
        child_email: email,
        child_name: name || '보호자',
      });

    if (insertErr) {
      throw insertErr;
    }

    return NextResponse.json({ familyCode: newCode });
  } catch (error: any) {
    console.error('Family code error:', error);
    return NextResponse.json({ error: error.message || '가족 코드 생성 실패' }, { status: 500 });
  }
}

// 2. 부모님 모드: 코드 유효성 검증
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ valid: false, error: '코드를 입력해주세요.' }, { status: 400 });
    }

    if (!supabase) {
      // Supabase 미연결 시 로컬 기본 가족코드 허용
      return NextResponse.json({ valid: true, childName: '보호자', isMock: true });
    }

    const { data: family, error } = await supabase
      .from('families')
      .select('family_code, child_name')
      .eq('family_code', code)
      .maybeSingle();

    if (error || !family) {
      return NextResponse.json({
        valid: false,
        error: '등록되지 않은 가족 안심 번호입니다. 자녀분이 알려준 번호를 다시 확인해 주세요.',
      });
    }

    return NextResponse.json({
      valid: true,
      familyCode: family.family_code,
      childName: family.child_name || '보호자',
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json({ valid: false, error: '코드 확인 중 오류 발생' }, { status: 500 });
  }
}
