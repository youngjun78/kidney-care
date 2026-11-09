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
  Filter,
  ZoomIn,
  X
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
  const [modalFullImage, setModalFullImage] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = `kidney_meals_history_${familyCode}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setMeals(parsed);
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    }

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm whitespace-nowrap">
            <ShieldAlert className="w-3 h-3 text-rose-600 flex-shrink-0" />
            <span>위험</span>
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
            <span>주의</span>
          </span>
        );
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm whitespace-nowrap">
            <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span>안전</span>
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
      {/* 사진 전체 화면 확대 팝업 */}
      {modalFullImage && (
        <div 
          onClick={() => setModalFullImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in"
        >
          <div className="w-full flex justify-end text-white py-1">
            <button
              onClick={() => setModalFullImage(null)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center max-h-[82vh] overflow-hidden">
            <img
              src={modalFullImage}
              alt="전체 확대 사진"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="text-center py-2 text-gray-400 text-xs">
            화면 아무 곳이나 누르면 닫힙니다
          </div>
        </div>
      )}

      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6">
        
        {/* 헤더 */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            {selectedDetailMeal ? (
              <button 
                onClick={() => setSelectedDetailMeal(null)}
                className="p-1 hover:bg-gray-200 rounded-lg transition text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <History className="w-4 h-4" />
              </div>
            )}
            <div>
              <h2 className="font-extrabold text-gray-900 text-sm sm:text-base">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* 사진 터치 시 확대 안내 */}
            {selectedDetailMeal.imageUrl && (
              <div 
                onClick={() => setModalFullImage(selectedDetailMeal.imageUrl || null)}
                className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-[16/10] bg-gray-100 cursor-pointer group"
              >
                <img
                  src={selectedDetailMeal.imageUrl}
                  alt="식단 사진"
                  className="w-full h-full object-cover group-hover:scale-102 transition"
                />
                <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>터치해서 전체 사진 보기</span>
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">{formatDate(selectedDetailMeal.timestamp)}</span>
                {getRiskBadge(selectedDetailMeal.overallRisk)}
              </div>
              <h3 className="font-extrabold text-gray-900 text-base leading-snug break-keep">
                {selectedDetailMeal.summaryTitle}
              </h3>
              <p className="text-xs text-rose-600 font-bold">
                주의 영양소: {selectedDetailMeal.worstRiskNutrient}
              </p>
            </div>

            {/* 반찬 리스트 */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">인식된 반찬 메뉴</h4>
              <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-2xl p-3.5">
                {selectedDetailMeal.foods.map((food) => (
                  <div key={food.id} className="py-2.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 whitespace-nowrap">
                          {food.category}
                        </span>
                        <span className="font-bold text-sm text-gray-900">{food.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 break-keep">{food.riskReason}</p>
                      <p className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded break-keep">
                        💡 {food.cookingAdvice}
                      </p>
                    </div>
                    <div className="flex-shrink-0 pt-0.5">{getRiskBadge(food.riskLevel)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 당시 전송된 카톡 안부 문구 */}
            <div className="bg-yellow-50 border border-yellow-200 p-3.5 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-yellow-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                당시 전송된 카톡 안부
              </span>
              <p className="text-xs text-gray-800 leading-relaxed font-medium break-keep">
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
            <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto bg-white">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 flex-shrink-0">
                <Filter className="w-3 h-3" /> 필터:
              </span>
              {(['all', 'danger', 'caution', 'safe'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition flex-shrink-0 whitespace-nowrap ${
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
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
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
                    className="p-3 rounded-2xl border border-gray-200/90 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition shadow-sm cursor-pointer flex items-center gap-3 group"
                  >
                    {/* 썸네일 */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                      {meal.imageUrl ? (
                        <img
                          src={meal.imageUrl}
                          alt="식단 썸네일"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          loading="lazy"
                        />
                      ) : (
                        <UtensilsCrossed className="w-5 h-5 text-gray-300" />
                      )}
                    </div>

                    {/* 정보 요약 */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(meal.timestamp)}
                        </span>
                        {getRiskBadge(meal.overallRisk)}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                        {meal.summaryTitle}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate">
                        메뉴: {meal.foods.map((f) => f.name).join(', ') || '분석 완료'}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition flex-shrink-0" />
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
