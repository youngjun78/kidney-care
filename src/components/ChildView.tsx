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
  History
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
        <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">아직 기록된 식단이 없습니다</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          부모님 모드에서 식탁 사진을 촬영하시면 실시간 칼륨/나트륨/인 위험도와 카톡 안부 메시지가 이곳에 나타납니다.
        </p>
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onSwitchToParent}
            className="w-full px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
          >
            부모님 모드로 가서 식단 촬영해보기
          </button>
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="w-full px-6 py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm transition flex items-center justify-center gap-2"
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            위험 (섭취주의)
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            주의 (양 조절)
          </span>
        );
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            안전
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
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-20">
      {/* 식단 모아보기 빠른 바로가기 바 */}
      {onOpenHistory && (
        <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-gray-700">이전 식단들이 궁금하신가요?</span>
          </div>
          <button
            onClick={onOpenHistory}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition"
          >
            식단 히스토리 전체보기 →
          </button>
        </div>
      )}

      {/* 최상단: 실시간 모니터링 배너 */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex items-center justify-between text-xs text-blue-200 mb-2">
          <span className="inline-flex items-center gap-1 bg-blue-800/60 px-2 py-0.5 rounded-md">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(analysis.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}{' '}
            {new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 식단 분석
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full font-semibold">부모님 댁 연동됨</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold leading-tight tracking-tight">
              {analysis.summaryTitle}
            </h2>
            <p className="text-xs text-blue-200 mt-1">
              최대 주의 영양소: <strong className="text-amber-300 font-bold">{analysis.worstRiskNutrient}</strong>
            </p>
          </div>
          <div className="flex-shrink-0">
            {getRiskBadge(analysis.overallRisk)}
          </div>
        </div>
      </div>

      {/* 촬영된 원본 사진 및 실시간 AI 진단 */}
      {analysis.imageUrl && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative aspect-[16/9] w-full bg-gray-100">
            <img
              src={analysis.imageUrl}
              alt="식단 사진"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>부모님이 촬영하신 식탁 사진</span>
            </div>
          </div>
        </div>
      )}

      {/* 실시간 한식 상차림 분할 & 1초 빠른 보정 UI */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
            <span>식탁 반찬별 신호등 분석</span>
            <span className="text-xs font-normal text-gray-500">({analysis.foods.length}개 메뉴)</span>
          </h3>
          <span className="text-xs text-blue-600 font-medium">1초 탭으로 수정 가능</span>
        </div>

        <div className="divide-y divide-gray-100">
          {analysis.foods.map((food) => (
            <div key={food.id} className="py-3 first:pt-1 last:pb-1">
              {editingFoodId === food.id ? (
                <div className="bg-blue-50/70 p-3 rounded-xl space-y-2 border border-blue-200">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span>메뉴명 / 위험도 보정</span>
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm font-semibold px-3 py-1.5 bg-white border border-blue-300 rounded-lg focus:outline-none"
                    placeholder="올바른 메뉴명 입력"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRisk('safe')}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg border transition ${
                        editRisk === 'safe'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      안전
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRisk('caution')}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg border transition ${
                        editRisk === 'caution'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      주의
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRisk('danger')}
                      className={`flex-1 py-1 text-xs font-bold rounded-lg border transition ${
                        editRisk === 'danger'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      위험
                    </button>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setEditingFoodId(null)}
                      className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-md"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleSaveCorrection(food.id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {food.category}
                      </span>
                      <span className="font-bold text-gray-900 text-sm">{food.name}</span>
                      <button
                        onClick={() => startEdit(food)}
                        className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition"
                        title="AI 인식 결과 직접 수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug">{food.riskReason}</p>
                    <p className="text-xs text-emerald-700 font-medium">💡 가이드: {food.cookingAdvice}</p>
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    {getRiskBadge(food.riskLevel)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 즉시 실천 행동 수칙 */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
        <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-600" />
          <span>부모님 즉시 실천 행동 수칙</span>
        </h4>
        <ul className="space-y-1.5 text-xs text-amber-900 font-medium">
          {analysis.actionGuides.map((guide, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{guide}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 다정한 원클릭 카톡 안부 메시지 */}
      <div className="bg-white rounded-2xl p-5 border border-yellow-200 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#FEE500] flex items-center justify-center font-bold text-xs text-black">
              talk
            </div>
            <span className="text-sm font-bold text-gray-900">다정한 카톡 안부 메시지</span>
          </div>
          <span className="text-[11px] text-gray-400">AI가 다정한 어조로 작성함</span>
        </div>

        <div className="bg-yellow-50/60 p-3.5 rounded-xl border border-yellow-100 text-xs sm:text-sm text-gray-800 leading-relaxed break-keep font-medium">
          "{analysis.friendlyMessage}"
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMessage}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#FEE500] hover:bg-[#FADA0A] text-black shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>복사 완료! 카톡에 붙여넣기하세요</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>카톡 메시지 원클릭 복사하기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 하단 보조 버튼들 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        <button
          onClick={() => setShowPdfModal(true)}
          className="py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>외래 진료용 요약 리포트</span>
        </button>

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="py-3 px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition"
          >
            <History className="w-4 h-4 text-blue-600" />
            <span>식단 전체 히스토리 목록</span>
          </button>
        )}
      </div>

      {/* 진료용 리포트 모달 */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
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

            <div className="space-y-3 text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">기록 일시</span>
                <span className="font-bold">{new Date(analysis.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">종합 식단 등급</span>
                <span className="font-bold text-rose-600 uppercase">{analysis.overallRisk}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">주요 모니터링 영양소</span>
                <span className="font-bold text-amber-700">{analysis.worstRiskNutrient} 주의</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">임상 식단 요약 코멘트</span>
                <p className="bg-white p-2.5 rounded-lg border border-gray-200 font-medium text-gray-800">
                  {analysis.clinicalSummary}
                </p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">인식된 세부 메뉴군</span>
                <div className="flex flex-wrap gap-1">
                  {analysis.foods.map((f) => (
                    <span key={f.id} className="bg-white px-2 py-0.5 rounded border text-[11px] font-semibold text-gray-700">
                      {f.name} ({f.riskLevel})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                인쇄 / PDF 저장
              </button>
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs"
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
