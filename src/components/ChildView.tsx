'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Edit3, 
  FileText, 
  Check, 
  Flame, 
  Calendar, 
  Sparkles,
  History,
  ChevronRight,
  ZoomIn,
  X,
  Loader2
} from 'lucide-react';
import { MealAnalysisResult, FoodItem, RiskLevel } from '@/types/meal';

interface ChildViewProps {
  analysis: MealAnalysisResult | null;
  loadingMeal?: boolean;
  isHistoricalView?: boolean;
  onResetToLatest?: () => void;
  onUpdateAnalysis: (updated: MealAnalysisResult) => void;
  onSwitchToParent: () => void;
  onOpenHistory?: () => void;
}

export default function ChildView({ 
  analysis, 
  loadingMeal = false,
  isHistoricalView = false,
  onResetToLatest,
  onUpdateAnalysis, 
  onSwitchToParent,
  onOpenHistory
}: ChildViewProps) {
  const [copied, setCopied] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRisk, setEditRisk] = useState<RiskLevel>('caution');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false); // 전체 사진 모달
  const [selectedFoodForDetail, setSelectedFoodForDetail] = useState<FoodItem | null>(null); // 반찬 세부 분석 모달

  // 모달 오픈 시 부모창 배경 스크롤 고정
  React.useEffect(() => {
    const isModalOpen = showPdfModal || showFullImageModal || !!selectedFoodForDetail;
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showPdfModal, showFullImageModal, selectedFoodForDetail]);

  if (!analysis) {
    if (loadingMeal) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <h2 className="text-lg font-black text-gray-950 mb-1.5">
            부모님 최근 식단을 동기화하고 있습니다
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed break-keep font-medium">
            최근 촬영된 식탁 사진과 신장 영양 분석 결과를 안전하게 불러오는 중입니다...
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">아직 기록된 식단이 없습니다</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed break-keep">
          부모님 모드에서 식탁 사진을 촬영하시면 실시간 칼륨/나트륨/인 위험도와 카톡 안부 메시지가 이곳에 나타납니다.
        </p>
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onSwitchToParent}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition whitespace-nowrap"
          >
            부모님 모드로 가서 식단 촬영해보기
          </button>
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="w-full py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <History className="w-4 h-4 text-blue-600" />
              <span>과거 식단 전체 목록 조회</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 위험도 배지 렌더러
  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm flex-shrink-0 whitespace-nowrap">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            <span>위험 (섭취주의)</span>
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm flex-shrink-0 whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>주의 (양 조절)</span>
          </span>
        );
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm flex-shrink-0 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>안전</span>
          </span>
        );
    }
  };

  // 원클릭 카톡 복사
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(analysis.friendlyMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 1초 보정 UI 저장
  const handleSaveCorrection = (foodId: string) => {
    const updatedFoods = analysis.foods.map((food) => {
      if (food.id === foodId) {
        return {
          ...food,
          name: editName.trim() || food.name,
          riskLevel: editRisk,
        };
      }
      return food;
    });

    let newOverall: RiskLevel = 'safe';
    if (updatedFoods.some((f) => f.riskLevel === 'danger')) {
      newOverall = 'danger';
    } else if (updatedFoods.some((f) => f.riskLevel === 'caution')) {
      newOverall = 'caution';
    }

    onUpdateAnalysis({
      ...analysis,
      overallRisk: newOverall,
      foods: updatedFoods,
    });

    setEditingFoodId(null);
  };

  const startEdit = (food: FoodItem) => {
    setEditingFoodId(food.id);
    setEditName(food.name);
    setEditRisk(food.riskLevel);
  };

  return (
    <div className="w-full space-y-3 pb-6">
      {/* 1. 원본 전체 사진 확대 모달 */}
      {showFullImageModal && analysis.imageUrl && (
        <div 
          onClick={() => setShowFullImageModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in"
        >
          {/* 상단 닫기 바 */}
          <div className="w-full flex items-center justify-between text-white py-2 z-10">
            <span className="text-xs font-medium text-gray-300">
              {new Date(analysis.timestamp).toLocaleString()} 식단 사진
            </span>
            <button
              onClick={() => setShowFullImageModal(false)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition flex items-center justify-center"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 중앙 전체 사진 뷰 (원본 비율 유지 - 사진 클릭해도 닫힘) */}
          <div className="flex-1 flex items-center justify-center w-full max-h-[82vh] overflow-hidden cursor-pointer">
            <img
              src={analysis.imageUrl}
              alt="전체 식단 사진"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* 하단 닫기 안내 문구 */}
          <div className="text-center py-2 text-gray-400 text-xs">
            화면 아무 곳이나 누르면 닫힙니다
          </div>
        </div>
      )}

      {/* 식단 모아보기 빠른 바로가기 바 */}
      {onOpenHistory && (
        <div 
          onClick={onOpenHistory}
          className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-2xl border border-gray-200/90 shadow-sm hover:border-blue-400 cursor-pointer transition group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block leading-tight">부모님 식단 기록 모아보기</span>
              <span className="text-[11px] text-gray-500 font-medium">이전 식단 사진과 분석 결과를 확인하세요</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition flex-shrink-0" />
        </div>
      )}

      {/* 최상단: 실시간 모니터링 배너 또는 과거 기록 뷰 배너 */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md">
        <div className="flex items-center justify-between text-xs text-blue-200 mb-2.5">
          <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-md font-medium whitespace-nowrap text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
            {new Date(analysis.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}{' '}
            {new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 식단 분석
          </span>
          {isHistoricalView ? (
            <button
              onClick={onResetToLatest}
              className="bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full font-black text-xs whitespace-nowrap active:scale-95 transition shadow-xs"
            >
              최신 식단으로 복귀
            </button>
          ) : (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold text-xs whitespace-nowrap">
              부모님 댁 연동됨
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <h2 className="text-lg sm:text-xl font-black leading-snug tracking-tight break-keep truncate">
              {analysis.summaryTitle}
            </h2>
            <p className="text-xs text-blue-200">
              주의 영양소: <strong className="text-amber-300 font-black text-sm">{analysis.worstRiskNutrient}</strong>
            </p>
          </div>
          <div className="flex-shrink-0">
            {getRiskBadge(analysis.overallRisk)}
          </div>
        </div>
      </div>

      {/* 촬영된 사진 (클릭 시 전체 화면 확대) */}
      {analysis.imageUrl && (
        <div 
          onClick={() => setShowFullImageModal(true)}
          className="relative bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden cursor-pointer group hover:border-blue-400 transition"
        >
          <div className="relative aspect-[16/10] w-full bg-gray-100">
            <img
              src={analysis.imageUrl}
              alt="식단 사진"
              className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
            />
            {/* 상단 안내 배지 */}
            <div className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0" />
              <span>부모님이 촬영하신 식탁 사진</span>
            </div>

            {/* 우측 하단 전체화면 확대 힌트 버튼 */}
            <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md group-hover:bg-blue-600 transition">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>터치해서 전체 사진 보기</span>
            </div>
          </div>
        </div>
      )}

      {/* 1개 통합 테이블(단일 카드형 요약 리스트) 구조: 모바일 화면 최적화 */}
      <div className="w-full bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        {/* 테이블 헤더 영역 */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-black text-gray-950 text-base sm:text-lg whitespace-nowrap">
              식탁 반찬별 신호등 요약
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 whitespace-nowrap">
              {analysis.foods.length}개
            </span>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md whitespace-nowrap">
            반찬 터치 시 상세 분석
          </span>
        </div>

        {/* 단일 통합 테이블 본문: 요약 리스트 (탭 시 세부 모달 열림) */}
        <div className="divide-y divide-gray-100 w-full">
          {analysis.foods.map((food) => (
            <div key={food.id} className="transition">
              {editingFoodId === food.id ? (
                <div className="p-4 bg-blue-50/80 space-y-3 border-l-4 border-blue-500">
                  <div className="text-sm font-black text-blue-950">
                    <span>메뉴명 및 위험도 간편 수정</span>
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-base font-bold px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl focus:outline-none"
                    placeholder="올바른 메뉴명 입력"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRisk('safe')}
                      className={`flex-1 py-2.5 text-sm font-black rounded-xl border transition whitespace-nowrap active:scale-95 ${
                        editRisk === 'safe'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      안전
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRisk('caution')}
                      className={`flex-1 py-2.5 text-sm font-black rounded-xl border transition whitespace-nowrap active:scale-95 ${
                        editRisk === 'caution'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      주의
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRisk('danger')}
                      className={`flex-1 py-2.5 text-sm font-black rounded-xl border transition whitespace-nowrap active:scale-95 ${
                        editRisk === 'danger'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      위험
                    </button>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingFoodId(null)}
                      className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg whitespace-nowrap"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleSaveCorrection(food.id)}
                      className="px-4 py-2 text-xs bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 shadow-xs whitespace-nowrap active:scale-95"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setSelectedFoodForDetail(food)}
                  className="p-4 hover:bg-blue-50/40 active:bg-blue-50/60 cursor-pointer flex items-center justify-between gap-3 w-full group"
                >
                  {/* 좌측: 카테고리 + 메뉴명 + 한줄 핵심 요약 */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex-shrink-0 whitespace-nowrap">
                        {food.category}
                      </span>
                      <span className="font-black text-gray-950 text-base sm:text-lg leading-tight truncate group-hover:text-blue-700 transition">
                        {food.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(food);
                        }}
                        className="text-gray-400 hover:text-blue-600 p-1 rounded-md transition flex-shrink-0 active:bg-gray-100"
                        title="직접 수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 요약된 한 줄 미리보기 문구 */}
                    <p className="text-xs sm:text-sm text-gray-500 truncate font-medium">
                      {food.riskReason}
                    </p>
                  </div>

                  {/* 우측: 신호등 뱃지 + 상세보기 화살표 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {getRiskBadge(food.riskLevel)}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 반찬 상세 분석 팝업 모달 */}
      {selectedFoodForDetail && (
        <div 
          onClick={() => setSelectedFoodForDetail(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95"
          >
            {/* 상단 타이틀 바 */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex-shrink-0">
                  {selectedFoodForDetail.category}
                </span>
                <h3 className="font-black text-gray-950 text-lg sm:text-xl truncate">
                  {selectedFoodForDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFoodForDetail(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 위험도 등급 */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-gray-200/80">
              <span className="text-sm font-bold text-gray-600">신장 영향 등급</span>
              <div>{getRiskBadge(selectedFoodForDetail.riskLevel)}</div>
            </div>

            {/* 영양 주의 분석 사유 */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-500 block">임상 영양 주의 사유</span>
              <p className="text-sm sm:text-base text-gray-800 leading-relaxed break-keep font-medium bg-slate-50/70 p-3.5 rounded-2xl border border-gray-100">
                {selectedFoodForDetail.riskReason}
              </p>
            </div>

            {/* 💡 섭취 & 조리 가이드 */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-700 block">💡 섭취 및 대체 팁</span>
              <div className="text-sm sm:text-base text-emerald-950 font-medium bg-emerald-50 border border-emerald-200/90 p-3.5 rounded-2xl leading-relaxed break-keep">
                {selectedFoodForDetail.cookingAdvice}
              </div>
            </div>

            {/* 하단 닫기 및 수정 버튼 */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  const foodToEdit = selectedFoodForDetail;
                  setSelectedFoodForDetail(null);
                  startEdit(foodToEdit);
                }}
                className="flex-1 py-3 px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition whitespace-nowrap active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>이 반찬 정보 수정</span>
              </button>
              <button
                onClick={() => setSelectedFoodForDetail(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-black text-xs sm:text-sm transition whitespace-nowrap active:scale-95"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부모님을 위한 다정한 식사 가이드 */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
        <h4 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-1.5">
          <Flame className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>부모님 건강을 위한 안심 식사 가이드</span>
        </h4>
        <ul className="space-y-2.5">
          {analysis.actionGuides.map((guide, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-amber-950 font-medium leading-relaxed break-keep">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-200 text-amber-900 text-xs sm:text-sm flex items-center justify-center font-black flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{guide}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 다정한 원클릭 카톡 안부 메시지 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center font-black text-xs text-black shadow-xs flex-shrink-0">
              talk
            </div>
            <span className="text-base sm:text-lg font-black text-gray-950 whitespace-nowrap">부모님께 보낼 안부 카톡</span>
          </div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100 text-sm sm:text-base text-gray-800 leading-relaxed break-keep font-medium">
          "{analysis.friendlyMessage}"
        </div>

        <div>
          <button
            onClick={handleCopyMessage}
            className={`w-full py-3.5 sm:py-4 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition whitespace-nowrap active:scale-[0.98] ${
              copied
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#FEE500] hover:bg-[#FADA0A] text-black shadow-xs'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 stroke-[3]" />
                <span className="whitespace-nowrap">복사 완료! 카톡에 붙여넣기하세요</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 stroke-[2.5]" />
                <span className="whitespace-nowrap">카톡 메시지 원클릭 복사하기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 하단 보조 액션 버튼들 (100% 꽉 찬 모바일 최적화 그리드) */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={() => setShowPdfModal(true)}
          className="w-full py-3 sm:py-3.5 px-2 rounded-xl border border-gray-300 bg-white hover:bg-slate-50 text-gray-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition whitespace-nowrap shadow-xs active:scale-[0.98]"
        >
          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="whitespace-nowrap">외래 진료용 요약</span>
        </button>

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="w-full py-3 sm:py-3.5 px-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition whitespace-nowrap shadow-xs active:scale-[0.98]"
          >
            <History className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="whitespace-nowrap">식단 전체 기록</span>
          </button>
        )}
      </div>

      {/* 진료용 리포트 모달 */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600">대학병원 / 신장내과 외래 제출용</span>
                <h3 className="text-lg font-extrabold text-gray-900">식단 영양 위험도 요약서</h3>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-medium">기록 일시</span>
                <span className="font-bold text-gray-900">{new Date(analysis.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-medium">종합 식단 등급</span>
                <span className="font-black text-rose-600 uppercase">{analysis.overallRisk}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500 font-medium">주요 모니터링 영양소</span>
                <span className="font-bold text-amber-700">{analysis.worstRiskNutrient} 주의</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium block mb-1">임상 식단 요약 코멘트</span>
                <p className="bg-white p-2.5 rounded-xl border border-gray-200 font-medium text-gray-900 leading-relaxed">
                  {analysis.clinicalSummary}
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium block mb-1">인식된 세부 메뉴군</span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.foods.map((f) => (
                    <span key={f.id} className="bg-white px-2 py-0.5 rounded-md border text-xs font-semibold text-gray-800">
                      {f.name} ({f.riskLevel})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm whitespace-nowrap"
              >
                인쇄 / PDF 저장
              </button>
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs sm:text-sm whitespace-nowrap"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
