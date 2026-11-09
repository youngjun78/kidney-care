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
  ChevronRight
} from 'lucide-react';
import { MealAnalysisResult, FoodItem, RiskLevel } from '@/types/meal';

interface ChildViewProps {
  analysis: MealAnalysisResult | null;
  onUpdateAnalysis: (updated: MealAnalysisResult) => void;
  onSwitchToParent: () => void;
  onOpenHistory?: () => void;
}

export default function ChildView({ 
  analysis, 
  onUpdateAnalysis, 
  onSwitchToParent,
  onOpenHistory
}: ChildViewProps) {
  const [copied, setCopied] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRisk, setEditRisk] = useState<RiskLevel>('caution');
  const [showPdfModal, setShowPdfModal] = useState(false);

  if (!analysis) {
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
    <div className="w-full space-y-3 pb-24">
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

      {/* 최상단: 실시간 모니터링 배너 */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md">
        <div className="flex items-center justify-between text-xs text-blue-200 mb-2.5">
          <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md font-medium whitespace-nowrap text-[11px]">
            <Calendar className="w-3 h-3 text-blue-300 flex-shrink-0" />
            {new Date(analysis.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}{' '}
            {new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 식단 분석
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap">
            부모님 댁 연동됨
          </span>
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

      {/* 촬영된 원본 사진 및 실시간 AI 진단 */}
      {analysis.imageUrl && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="relative aspect-[16/10] w-full bg-gray-100">
            <img
              src={analysis.imageUrl}
              alt="식단 사진"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0" />
              <span>부모님이 촬영하신 식탁 사진</span>
            </div>
          </div>
        </div>
      )}

      {/* 1개 통합 테이블(단일 카드형 표) 구조: 모바일 화면 꽉 채우기 */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 테이블 헤더 영역: 좁은 화면에서도 줄바꿈 없이 딱 맞춤 */}
        <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-1.5">
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base whitespace-nowrap">
              식탁 반찬별 신호등 분석
            </h3>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800 whitespace-nowrap">
              총 {analysis.foods.length}개 반찬
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md whitespace-nowrap">
            1초 탭 수정 가능
          </span>
        </div>

        {/* 단일 통합 테이블 본문 */}
        <div className="divide-y divide-gray-100 w-full">
          {analysis.foods.map((food) => (
            <div key={food.id} className="p-3.5 hover:bg-slate-50/50 transition">
              {editingFoodId === food.id ? (
                <div className="bg-blue-50/80 p-3 rounded-xl space-y-2 border border-blue-200">
                  <div className="text-xs font-bold text-blue-900">
                    <span>메뉴명 및 위험도 간편 수정</span>
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm font-bold px-3 py-2 bg-white border border-blue-300 rounded-lg focus:outline-none"
                    placeholder="올바른 메뉴명 입력"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditRisk('safe')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${
                        editRisk === 'safe'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      안전
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRisk('caution')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${
                        editRisk === 'caution'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      주의
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRisk('danger')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap ${
                        editRisk === 'danger'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      위험
                    </button>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => setEditingFoodId(null)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md font-medium whitespace-nowrap"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleSaveCorrection(food.id)}
                      className="px-4 py-1.5 text-xs bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm whitespace-nowrap"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 w-full">
                  {/* 상단 1줄: [구분 + 메뉴명] 좌측, [신호등 뱃지] 우측 밀착 */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex-shrink-0 whitespace-nowrap">
                        {food.category}
                      </span>
                      <span className="font-extrabold text-gray-900 text-base sm:text-lg truncate">
                        {food.name}
                      </span>
                      <button
                        onClick={() => startEdit(food)}
                        className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition flex-shrink-0"
                        title="직접 수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-shrink-0">
                      {getRiskBadge(food.riskLevel)}
                    </div>
                  </div>

                  {/* 설명: 가로 전체 100% 꽉 채우기 */}
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-keep w-full">
                    {food.riskReason}
                  </p>

                  {/* 💡 조리 가이드 박스: 가로 100% 꽉 채워서 여백 낭비 제거 */}
                  <div className="w-full text-xs sm:text-sm text-emerald-950 font-semibold bg-emerald-50 border border-emerald-200/90 p-2.5 sm:p-3 rounded-xl leading-relaxed break-keep">
                    💡 {food.cookingAdvice}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 부모님 즉시 실천 행동 수칙 */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-sm">
        <h4 className="text-sm sm:text-base font-extrabold text-amber-950 flex items-center gap-1.5">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
          <span>부모님 즉시 실천 행동 수칙</span>
        </h4>
        <ul className="space-y-2">
          {analysis.actionGuides.map((guide, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed break-keep">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-200 text-amber-900 text-[10px] sm:text-xs flex items-center justify-center font-black flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{guide}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 다정한 원클릭 카톡 안부 메시지 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-yellow-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FEE500] flex items-center justify-center font-black text-xs text-black shadow-sm flex-shrink-0">
              talk
            </div>
            <span className="text-sm sm:text-base font-extrabold text-gray-900 whitespace-nowrap">다정한 카톡 안부 메시지</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">AI 다정 어조</span>
        </div>

        <div className="bg-yellow-50/80 p-3.5 rounded-xl border border-yellow-100 text-xs sm:text-sm text-gray-800 leading-relaxed break-keep font-medium">
          "{analysis.friendlyMessage}"
        </div>

        <div>
          <button
            onClick={handleCopyMessage}
            className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
              copied
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#FEE500] hover:bg-[#FADA0A] text-black shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">복사 완료! 카톡에 붙여넣기하세요</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">카톡 메시지 원클릭 복사하기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 하단 보조 액션 버튼들 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={() => setShowPdfModal(true)}
          className="w-full py-3 px-4 rounded-xl border border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition whitespace-nowrap shadow-sm"
        >
          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="whitespace-nowrap">외래 진료용 요약 리포트</span>
        </button>

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="w-full py-3 px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition whitespace-nowrap shadow-sm"
          >
            <History className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="whitespace-nowrap">식단 전체 히스토리 목록</span>
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
