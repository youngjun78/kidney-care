'use client';

import React, { useState } from 'react';
import ParentView from '@/components/ParentView';
import ChildView from '@/components/ChildView';
import { MealAnalysisResult } from '@/types/meal';
import { Heart, Activity, Bell, Smartphone, UserCheck } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'parent' | 'child'>('parent');
  const [latestAnalysis, setLatestAnalysis] = useState<MealAnalysisResult | null>(null);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  const handleAnalysisComplete = (result: MealAnalysisResult) => {
    setLatestAnalysis(result);
    setHasNewAlert(true);
    // 분석 후 자녀 모드 뱃지 알림
  };

  const handleSwitchToChild = () => {
    setActiveTab('child');
    setHasNewAlert(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 글로벌 탑 네비게이션: 듀얼 UX 스위처 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-gray-900 block leading-none">
                안심콩팥케어
              </span>
              <span className="text-[10px] text-gray-600 font-semibold">프로젝트 안티그래비티</span>
            </div>
          </div>

          {/* 모드 전환 토글 탭 */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('parent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'parent'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>부모님 모드</span>
            </button>

            <button
              onClick={handleSwitchToChild}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'child'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>자녀 모드</span>
              {hasNewAlert && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
              {hasNewAlert && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 실시간 알림 띠 (자녀 모드에 새 분석이 도착했을 때) */}
      {hasNewAlert && activeTab === 'parent' && (
        <div 
          onClick={handleSwitchToChild}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 cursor-pointer transition shadow-inner font-semibold"
        >
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          <span>부모님의 새 식단 분석이 완료되었습니다. [자녀 모드 대시보드 보기]</span>
        </div>
      )}

      {/* 본문 콘텐츠 뷰 */}
      <section className="flex-1 w-full max-w-xl mx-auto">
        {activeTab === 'parent' ? (
          <ParentView onAnalysisComplete={handleAnalysisComplete} />
        ) : (
          <ChildView
            analysis={latestAnalysis}
            onUpdateAnalysis={(updated) => setLatestAnalysis(updated)}
            onSwitchToParent={() => setActiveTab('parent')}
          />
        )}
      </section>

      {/* 하단 의료기기 오인 방지 면책 조항 (ai.md 필수 사항) */}
      <footer className="w-full bg-slate-100 border-t border-slate-200 py-3 px-4 text-center text-[11px] text-gray-600 leading-tight">
        <p className="max-w-md mx-auto">
          ⚠️ <strong>안내</strong>: 본 서비스는 의료기기 또는 질병 치료·진단 도구가 아니며, 식단 선택을 돕기 위한 보조 가이드입니다. 정확한 영양 및 복약 관리는 반드시 신장내과 주치의 및 임상영양사와 상담하십시오.
        </p>
      </footer>
    </main>
  );
}
