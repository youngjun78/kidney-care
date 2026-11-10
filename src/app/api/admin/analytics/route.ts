import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 관리자 3단계: 임상 패턴 통계 및 시간대별/식품별 심층 분석 API
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({
        hourlyDistribution: [
          { hour: '07~09시 (아침)', count: 12 },
          { hour: '11~14시 (점심)', count: 24 },
          { hour: '17~20시 (저녁)', count: 28 },
          { hour: '기타/야식', count: 4 },
        ],
        topDangerFoods: [
          { name: '초콜릿 가나슈 케이크', nutrient: '칼륨·인', count: 8 },
          { name: '열무김치', nutrient: '나트륨·칼륨', count: 6 },
          { name: '시금치나물', nutrient: '칼륨', count: 5 },
          { name: '잡곡밥', nutrient: '인', count: 4 },
        ],
        complianceSummary: {
          excellentCount: 5, // 주 5회 이상
          normalCount: 4,    // 주 2~4회
          needsCareCount: 3, // 주 1회 이하
        },
      });
    }

    const { data: meals, error } = await supabase
      .from('meals')
      .select('overall_risk, worst_risk_nutrient, foods, created_at');

    if (error) throw error;

    const allMeals = meals || [];

    // 1. 식사 시간대별 분포 계산 (KST 기준)
    let morning = 0; // 06 ~ 10시
    let lunch = 0;   // 11 ~ 14시
    let dinner = 0;  // 17 ~ 21시
    let other = 0;   // 그 외

    const dangerFoodCountMap: Record<string, { count: number; nutrient: string }> = {};

    allMeals.forEach((m) => {
      const date = new Date(m.created_at);
      // KST 시간대 계산 (+9시간)
      const hours = (date.getUTCHours() + 9) % 24;

      if (hours >= 6 && hours <= 10) morning++;
      else if (hours >= 11 && hours <= 14) lunch++;
      else if (hours >= 17 && hours <= 21) dinner++;
      else other++;

      // 위험 식품 집계
      if (Array.isArray(m.foods)) {
        m.foods.forEach((f: any) => {
          if (f.riskLevel === 'danger' || f.riskLevel === 'caution') {
            const key = f.name;
            if (!dangerFoodCountMap[key]) {
              dangerFoodCountMap[key] = { count: 1, nutrient: m.worst_risk_nutrient || '칼륨/나트륨' };
            } else {
              dangerFoodCountMap[key].count++;
            }
          }
        });
      }
    });

    const hourlyDistribution = [
      { hour: '07~10시 (아침)', count: morning },
      { hour: '11~14시 (점심)', count: lunch },
      { hour: '17~21시 (저녁)', count: dinner },
      { hour: '기타/간식/야식', count: other },
    ];

    const topDangerFoods = Object.entries(dangerFoodCountMap)
      .map(([name, info]) => ({ name, nutrient: info.nutrient, count: info.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return NextResponse.json({
      hourlyDistribution,
      topDangerFoods,
      totalAnalyzed: allMeals.length,
    });
  } catch (err: any) {
    console.error('Analytics API error:', err);
    return NextResponse.json({ error: err.message || '통계 조회 실패' }, { status: 500 });
  }
}
