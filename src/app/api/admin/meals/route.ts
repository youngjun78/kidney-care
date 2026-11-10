import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 관리자: 식단 데이터 수정 (Human-in-the-loop 보정)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { mealId, summaryTitle, overallRisk, worstRiskNutrient, foods, friendlyMessage, clinicalSummary } = body;

    if (!mealId) {
      return NextResponse.json({ error: '식단 ID가 필요합니다.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ success: true, isMock: true });
    }

    const { data, error } = await supabase
      .from('meals')
      .update({
        summary_title: summaryTitle,
        overall_risk: overallRisk,
        worst_risk_nutrient: worstRiskNutrient,
        foods: foods,
        friendly_message: friendlyMessage,
        clinical_summary: clinicalSummary,
      })
      .eq('id', mealId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, meal: data });
  } catch (err: any) {
    console.error('Admin meal update error:', err);
    return NextResponse.json({ error: err.message || '식단 정보 수정 실패' }, { status: 500 });
  }
}

// 관리자: 식단 삭제 (테스트 데이터 정리 및 스팸/부적절 이미지 삭제)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mealId = searchParams.get('mealId');

    if (!mealId) {
      return NextResponse.json({ error: '삭제할 식단 ID가 필요합니다.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ success: true, isMock: true });
    }

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin meal delete error:', err);
    return NextResponse.json({ error: err.message || '식단 삭제 실패' }, { status: 500 });
  }
}
