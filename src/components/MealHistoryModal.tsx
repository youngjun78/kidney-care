'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  Loader2,
  UtensilsCrossed,
  Filter
} from 'lucide-react';
import { MealAnalysisResult, RiskLevel } from '@/types/meal';

interface MealHistoryModalProps {
  familyCode: string;
  onClose: () => void;
  onSelectMeal: (meal: MealAnalysisResult) => void;
}

export default function MealHistoryModal({ familyCode, onClose, onSelectMeal }: MealHistoryModalProps) {
  const [meals, setMeals] = useState<MealAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');
  const [selectedDetailMeal, setSelectedDetailMeal] = useState<MealAnalysisResult | null>(null);

  useEffect(() => {
    // 1. 캐시 즉시 복원 (모달 여는 순간 0초만에 목록 노출)
    const cacheKey = `kidney_meals_history_${familyCode}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setMeals(parsed);
        setLoading(false); // 캐시가 있으면 즉시 로딩 해제
      } catch (e) {
        console.error(e);
      }
    }

    // 2. 백그라운드에서 최신 데이터 가져와 자연스럽게 동기화
    async function loadHistory() {
      try {
        const res = await fetch(`/api/meals?familyCode=${familyCode}&all=true`);
        const data = await res.json();
        if (data.meals) {
          setMeals(data.meals);
          localStorage.setItem(cacheKey, JSON.stringify(data.meals));
        }
      } catch (err) {
        console.error('History load error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (familyCode) {
      loadHistory();
    }
  }, [familyCode]);

  const filteredMeals = meals.filter((meal) => {
    if (filterRisk === 'all') return true;
    return meal.overallRisk === filterRisk;
  });

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            위험
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            주의
          </span>
        );
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            안전
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
      return `${month}월 ${day}일(${weekDay}) ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6">
        
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            {selectedDetailMeal ? (
              <button 
                onClick={() => setSelectedDetailMeal(null)}
                className="p-1 hover:bg-gray-200 rounded-lg transition text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="font-extrabold text-gray-900 text-base">
                {selectedDetailMeal ? '식단 상세 기록' : '부모님 식단 기록 모아보기'}
              </h2>
              <span className="text-[11px] text-gray-500 font-medium">
                {selectedDetailMeal 
                  ? formatDate(selectedDetailMeal.timestamp)
                  : `누적 ${meals.length}개의 식단 기록`
                }
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm font-bold px-2 py-1 rounded-lg"
          >
            닫기
          </button>
        </div>

        {/* 상세 팝업 뷰 */}
        {selectedDetailMeal ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selectedDetailMeal.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-[16/10] bg-gray-100">
                <img
                  src={selectedDetailMeal.imageUrl}
                  alt="식단 사진"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{formatDate(selectedDetailMeal.timestamp)}</span>
                {getRiskBadge(selectedDetailMeal.overallRisk)}
              </div>
              <h3 className="font-bold text-gray-900 text-lg leading-snug">
                {selectedDetailMeal.summaryTitle}
              </h3>
              <p className="text-xs text-rose-600 font-semibold">
                주의 영양소: {selectedDetailMeal.worstRiskNutrient}
              </p>
            </div>

            {/* 반찬 리스트 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">인식된 반찬 메뉴</h4>
              <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-2xl p-3">
                {selectedDetailMeal.foods.map((food) => (
                  <div key={food.id} className="py-2.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {food.category}
                        </span>
                        <span className="font-bold text-sm text-gray-900">{food.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{food.riskReason}</p>
                      <p className="text-[11px] text-emerald-700 font-medium">💡 {food.cookingAdvice}</p>
                    </div>
                    <div>{getRiskBadge(food.riskLevel)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI 작성 안부 메시지 */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl space-y-1.5">
              <span className="text-xs font-bold text-yellow-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                당시 전송된 카톡 안부
              </span>
              <p className="text-xs text-gray-800 leading-relaxed font-medium">
                "{selectedDetailMeal.friendlyMessage}"
              </p>
            </div>

            <button
              onClick={() => {
                onSelectMeal(selectedDetailMeal);
                onClose();
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow"
            >
              대시보드 메인으로 이 식단 불러오기
            </button>
          </div>
        ) : (
          /* 리스트 뷰 */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 위험도 필터 탭 */}
            <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 overflow-x-auto bg-white">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 flex-shrink-0">
                <Filter className="w-3 h-3" /> 필터:
              </span>
              {(['all', 'danger', 'caution', 'safe'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition flex-shrink-0 ${
                    filterRisk === r
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r === 'all' && `전체 (${meals.length})`}
                  {r === 'danger' && `위험 (${meals.filter((m) => m.overallRisk === 'danger').length})`}
                  {r === 'caution' && `주의 (${meals.filter((m) => m.overallRisk === 'caution').length})`}
                  {r === 'safe' && `안전 (${meals.filter((m) => m.overallRisk === 'safe').length})`}
                </button>
              ))}
            </div>

            {/* 리스트 본문 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading && meals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">식단 기록을 불러오고 있습니다...</span>
                </div>
              ) : filteredMeals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2 text-center">
                  <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                  <span className="text-sm font-bold text-gray-600">해당하는 식단 기록이 없습니다</span>
                  <span className="text-xs text-gray-400">부모님 모드에서 사진을 촬영하면 이곳에 자동으로 쌓입니다.</span>
                </div>
              ) : (
                filteredMeals.map((meal) => (
                  <div
                    key={meal.id}
                    onClick={() => setSelectedDetailMeal(meal)}
                    className="p-3.5 rounded-2xl border border-gray-200/80 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition shadow-sm cursor-pointer flex items-center gap-3.5 group"
                  >
                    {/* 썸네일 */}
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                      {meal.imageUrl ? (
                        <img
                          src={meal.imageUrl}
                          alt="식단 썸네일"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          loading="lazy"
                        />
                      ) : (
                        <UtensilsCrossed className="w-6 h-6 text-gray-300" />
                      )}
                    </div>

                    {/* 정보 요약 */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(meal.timestamp)}
                        </span>
                        {getRiskBadge(meal.overallRisk)}
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 truncate">
                        {meal.summaryTitle}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        메뉴: {meal.foods.map((f) => f.name).join(', ') || '분석 완료'}
                      </p>
                    </div>

                    {/* 우측 화살표 */}
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
