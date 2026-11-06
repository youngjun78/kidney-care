import { NextResponse } from 'next/server';
import { MealAnalysisResult } from '@/types/meal';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: '이미지 데이터가 없습니다.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
당신은 만성 신장 질환(CKD, 투석 환자) 전문 임상 영양 AI 자문관입니다.
제공된 한식 밥상/식단 사진을 정밀 분석하여 JSON 규격으로만 응답하세요.

[환자 및 질환 특성 배경]
1. 만성 신장 환자에게 칼륨, 나트륨, 인, 단백질 과다는 부정맥, 폐부종, 혈관석회화 등 생명과 직결된 치명적 위험을 초래합니다.
2. 따라서 보수적(Worst-Case) 평가 원칙을 적용합니다:
   - 찌개/탕/국류의 국물, 해조류(미역, 다시마, 김자반), 잡곡밥(흑미, 현미), 절임류(장아찌, 젓갈), 말린 과일/견과류는 고위험군(danger)으로 엄격 평가합니다.
   - 쌀밥, 기름기 적은 적정량 단백질, 끓는 물에 데쳐서 칼륨을 용출시킨 나물류 등은 안전(safe) 또는 주의(caution) 수준으로 평가합니다.

[분석 요구사항]
1. 한식 상차림 분할: 밥류, 국/찌개, 메인반찬, 밑반찬 등으로 분리
2. 개별 메뉴별 위험도(safe, caution, danger) 및 구체적인 대체 조리법 안내(예: "물에 2시간 담가 칼륨 뺀 후 조리", "국물은 드시지 마시고 건더기만")
3. 환자(부모님)가 바로 실천할 수 있는 2~3가지 행동 가이드
4. 자녀가 부모님께 카카오톡으로 전송할 다정하고 사랑이 담긴 안부 메시지 (예: "엄마 오늘 점심 맛있게 드셨어요? 김치찌개 국물은 콩팥에 무리가 갈 수 있으니 꼭 건더기 위주로 드셔주세요 사랑해요 ❤️")
5. 외래 진료 시 신장내과 주치의에게 보여줄 1줄 임상 식단 요약

반드시 다음 JSON 형식만을 반환하세요 (마크다운 백틱 없이 순수 JSON만 출력):
{
  "overallRisk": "safe" | "caution" | "danger",
  "summaryTitle": "식단에 대한 핵심 요약 (예: 칼륨과 나트륨 주의 식단입니다)",
  "worstRiskNutrient": "칼륨" | "나트륨" | "인" | "단백질" | "없음",
  "foods": [
    {
      "id": "랜덤문자열",
      "name": "메뉴명",
      "category": "국/찌개",
      "riskLevel": "danger",
      "riskReason": "원인 설명",
      "cookingAdvice": "조리/섭취 가이드",
      "nutrients": {
        "potassium": "high",
        "sodium": "high",
        "phosphorus": "medium",
        "protein": "medium"
      }
    }
  ],
  "actionGuides": [
    "실천 행동 가이드 1",
    "실천 행동 가이드 2"
  ],
  "friendlyMessage": "카톡 안부 메시지 전문",
  "clinicalSummary": "외래 진료용 요약"
}
`;

    // 최신 지원 모델: gemini-flash-latest 또는 gemini-3.8-flash
    const targetModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.0-flash'];
    let lastError = '';
    let parsedData: any = null;

    for (const model of targetModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const requestBody = {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            response_mime_type: 'application/json',
          },
        };

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanedText = rawText.replace(/```json\n?|```/g, '').trim();
            parsedData = JSON.parse(cleanedText);
            break; // 성공 시 루프 탈출
          }
        } else {
          lastError = await response.text();
          console.warn(`Model ${model} failed:`, lastError);
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`Model ${model} error:`, e);
      }
    }

    if (!parsedData) {
      throw new Error(`AI 분석 모델 호출 실패: ${lastError}`);
    }

    const result: MealAnalysisResult = {
      id: 'meal_' + Date.now(),
      timestamp: new Date().toISOString(),
      overallRisk: parsedData.overallRisk || 'caution',
      summaryTitle: parsedData.summaryTitle || '식단 분석 완료',
      worstRiskNutrient: parsedData.worstRiskNutrient || '칼륨',
      foods: (parsedData.foods || []).map((f: any, idx: number) => ({
        id: f.id || `f_${idx}_${Date.now()}`,
        name: f.name || '알 수 없는 메뉴',
        category: f.category || '기타',
        riskLevel: f.riskLevel || 'caution',
        riskReason: f.riskReason || '영양소 분석 주의',
        cookingAdvice: f.cookingAdvice || '천천히 꼭꼭 씹어 섭취하세요',
        nutrients: f.nutrients || { potassium: 'medium', sodium: 'medium', phosphorus: 'medium', protein: 'medium' },
      })),
      actionGuides: parsedData.actionGuides || ['적정량을 천천히 섭취하세요'],
      friendlyMessage: parsedData.friendlyMessage || '부모님 오늘도 건강하고 편안한 식사 되세요!',
      clinicalSummary: parsedData.clinicalSummary || '특이 소견 없음',
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || '식단 분석 중 문제가 발생했습니다.' },
      { status: 500 }
    );
  }
}
