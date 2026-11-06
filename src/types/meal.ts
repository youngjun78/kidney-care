export type RiskLevel = 'safe' | 'caution' | 'danger';

export interface FoodItem {
  id: string;
  name: string;
  category: '밥류' | '국/찌개' | '메인반찬' | '밑반찬' | '기타';
  riskLevel: RiskLevel;
  riskReason: string;
  cookingAdvice: string;
  nutrients: {
    potassium: 'low' | 'medium' | 'high'; // 칼륨
    sodium: 'low' | 'medium' | 'high';    // 나트륨
    phosphorus: 'low' | 'medium' | 'high';// 인
    protein: 'low' | 'medium' | 'high';   // 단백질
  };
}

export interface MealAnalysisResult {
  id: string;
  timestamp: string;
  imageUrl?: string;
  overallRisk: RiskLevel; // 전체 식단 위험도 (신호등)
  summaryTitle: string; // 한줄 요약 (예: "칼륨 주의 식단입니다")
  worstRiskNutrient: '칼륨' | '나트륨' | '인' | '단백질' | '없음';
  foods: FoodItem[];
  actionGuides: string[]; // 행동 가이드 (예: "국물 섭취 피하기", "채소 1~2젓가락 제한")
  friendlyMessage: string; // 카카오톡 안부 메시지 템플릿 (AI 작성)
  clinicalSummary: string; // 외래 진료용 요약 코멘트
}
