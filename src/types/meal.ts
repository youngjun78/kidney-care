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
  familyCode?: string;
  timestamp: string;
  imageUrl?: string;
  overallRisk: RiskLevel;
  summaryTitle: string;
  worstRiskNutrient: '칼륨' | '나트륨' | '인' | '단백질' | '없음';
  foods: FoodItem[];
  actionGuides: string[];
  friendlyMessage: string;
  clinicalSummary: string;
}

export interface UserSession {
  role: 'child' | 'parent';
  familyCode: string;
  userName?: string;
  email?: string;
}
