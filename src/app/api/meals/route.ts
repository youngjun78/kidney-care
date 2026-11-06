import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MealAnalysisResult } from '@/types/meal';

// 가족 코드별 식단 기록 저장
export async function POST(req: Request) {
  try {
    const meal: MealAnalysisResult = await req.json();

    if (!meal.familyCode) {
      return NextResponse.json({ error: '가족 코드가 누락되었습니다.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ success: true, isMock: true });
    }

    const { data, error } = await supabase.from('meals').insert({
      family_code: meal.familyCode,
      image_url: meal.imageUrl || null,
      overall_risk: meal.overallRisk,
      summary_title: meal.summaryTitle,
      worst_risk_nutrient: meal.worstRiskNutrient,
      foods: meal.foods,
      action_guides: meal.actionGuides,
      friendly_message: meal.friendlyMessage,
      clinical_summary: meal.clinicalSummary,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Save meal error:', err);
    return NextResponse.json({ error: err.message || '식단 저장 실패' }, { status: 500 });
  }
}

// 가족 코드별 최신 식단 기록 조회 (자녀 화면 동기화용)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const familyCode = searchParams.get('familyCode');

    if (!familyCode) {
      return NextResponse.json({ error: '가족 코드가 필요합니다.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ meal: null, isMock: true });
    }

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('family_code', familyCode)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ meal: null });
    }

    const mealResult: MealAnalysisResult = {
      id: data.id,
      familyCode: data.family_code,
      timestamp: data.created_at,
      imageUrl: data.image_url,
      overallRisk: data.overall_risk,
      summaryTitle: data.summary_title,
      worstRiskNutrient: data.worst_risk_nutrient,
      foods: data.foods,
      actionGuides: data.action_guides,
      friendlyMessage: data.friendly_message,
      clinicalSummary: data.clinical_summary,
    };

    return NextResponse.json({ meal: mealResult });
  } catch (err: any) {
    console.error('Fetch meal error:', err);
    return NextResponse.json({ error: err.message || '식단 조회 실패' }, { status: 500 });
  }
}
