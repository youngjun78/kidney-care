import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 관리자 관제 대시보드 종합 지표 집계 API
export async function GET() {
  try {
    if (!supabase) {
      // 로컬/테스트 환경용 모의 데이터
      return NextResponse.json({
        stats: {
          totalFamilies: 12,
          totalMeals: 48,
          dangerMeals: 8,
          cautionMeals: 15,
          safeMeals: 25,
          todayMeals: 5,
        },
        riskDistribution: {
          danger: 8,
          caution: 15,
          safe: 25,
        },
        topRiskNutrients: [
          { nutrient: '칼륨(K)', count: 18 },
          { nutrient: '나트륨(Na)', count: 14 },
          { nutrient: '인(P)', count: 9 },
        ],
        recentMeals: [],
        families: [],
      });
    }

    // 1. 전체 가족 목록 및 카운트
    const { data: families, error: famErr } = await supabase
      .from('families')
      .select('id, family_code, child_email, child_name, created_at')
      .order('created_at', { ascending: false });

    if (famErr) throw famErr;

    // 2. 전체 식단 기록 목록
    const { data: meals, error: mealErr } = await supabase
      .from('meals')
      .select('id, family_code, image_url, overall_risk, summary_title, worst_risk_nutrient, foods, created_at')
      .order('created_at', { ascending: false });

    if (mealErr) throw mealErr;

    const allMeals = meals || [];
    const allFamilies = families || [];

    // 오늘 등록된 식단 계산 (KST 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dangerCount = 0;
    let cautionCount = 0;
    let safeCount = 0;
    let todayCount = 0;

    const nutrientMap: Record<string, number> = {};

    allMeals.forEach((m) => {
      if (m.overall_risk === 'danger') dangerCount++;
      else if (m.overall_risk === 'caution') cautionCount++;
      else if (m.overall_risk === 'safe') safeCount++;

      if (new Date(m.created_at) >= today) {
        todayCount++;
      }

      if (m.worst_risk_nutrient && m.worst_risk_nutrient !== '양호') {
        nutrientMap[m.worst_risk_nutrient] = (nutrientMap[m.worst_risk_nutrient] || 0) + 1;
      }
    });

    const topRiskNutrients = Object.entries(nutrientMap)
      .map(([nutrient, count]) => ({ nutrient, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 가족별 누적 식단 수 매핑
    const familyMealCountMap: Record<string, number> = {};
    allMeals.forEach((m) => {
      familyMealCountMap[m.family_code] = (familyMealCountMap[m.family_code] || 0) + 1;
    });

    const enrichedFamilies = allFamilies.map((f) => ({
      ...f,
      mealCount: familyMealCountMap[f.family_code] || 0,
    }));

    return NextResponse.json({
      stats: {
        totalFamilies: allFamilies.length,
        totalMeals: allMeals.length,
        dangerMeals: dangerCount,
        cautionMeals: cautionCount,
        safeMeals: safeCount,
        todayMeals: todayCount,
      },
      riskDistribution: {
        danger: dangerCount,
        caution: cautionCount,
        safe: safeCount,
      },
      topRiskNutrients,
      recentMeals: allMeals.slice(0, 10),
      families: enrichedFamilies,
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: err.message || '지표 조회 실패' }, { status: 500 });
  }
}
