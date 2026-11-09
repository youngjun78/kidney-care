'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import ParentView from '@/components/ParentView';
import ChildView from '@/components/ChildView';
import AuthGateModal from '@/components/AuthGateModal';
import MealHistoryModal from '@/components/MealHistoryModal';
import { MealAnalysisResult, UserSession } from '@/types/meal';
import { Heart, Bell, Smartphone, UserCheck, Key, LogOut, History } from 'lucide-react';

export default function Home() {
  const { data: authSession, status } = useSession();
  const [parentSession, setParentSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'parent' | 'child'>('child');
  const [latestAnalysis, setLatestAnalysis] = useState<MealAnalysisResult | null>(null);
  const [loadingInitialMeal, setLoadingInitialMeal] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [childFamilyCode, setChildFamilyCode] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 1. 초기 복원
  useEffect(() => {
    setMounted(true);

    const savedParent = localStorage.getItem('kidney_parent_session');
    if (savedParent) {
      try {
        const parsedParent = JSON.parse(savedParent);
        setParentSession(parsedParent);
        setActiveTab('parent');
      } catch (e) {
        console.error(e);
      }
    }

    const cachedChildCode = localStorage.getItem('kidney_child_family_code');
    if (cachedChildCode) {
      setChildFamilyCode(cachedChildCode);
    }

    const savedMeal = localStorage.getItem('kidney_latest_meal');
    if (savedMeal) {
      try {
        setLatestAnalysis(JSON.parse(savedMeal));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 2. 자녀 로그인 시: 백그라운드에서 서버 DB 가족 코드 동기화
  useEffect(() => {
    async function syncFamilyCode() {
      if (authSession?.user?.email) {
        try {
          if (!latestAnalysis) {
            setLoadingInitialMeal(true);
          }
          const res = await fetch('/api/family', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: authSession.user.email,
              name: authSession.user.name,
            }),
          });
          const data = await res.json();
          if (data.familyCode) {
            setChildFamilyCode(data.familyCode);
            localStorage.setItem('kidney_child_family_code', data.familyCode);
            setActiveTab('child');
          }
        } catch (e) {
          console.error('Family code sync error:', e);
        }
      }
    }

    syncFamilyCode();
  }, [authSession]);

  // 3. 최신 식단 동기화
  useEffect(() => {
    const currentCode = childFamilyCode || parentSession?.familyCode;
    if (!currentCode) return;

    if (!latestAnalysis) {
      setLoadingInitialMeal(true);
    }

    const fetchLatestMeal = async () => {
      try {
        const res = await fetch(`/api/meals?familyCode=${currentCode}`);
        const data = await res.json();
        if (data.meal) {
          setLatestAnalysis((prev) => {
            if (!prev || prev.id !== data.meal.id) {
              localStorage.setItem('kidney_latest_meal', JSON.stringify(data.meal));
              if (prev && activeTab === 'child') {
                setHasNewAlert(true);
              }
              return data.meal;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Meal polling error:', err);
      } finally {
        setLoadingInitialMeal(false);
      }
    };

    fetchLatestMeal();
    const interval = setInterval(fetchLatestMeal, 4000);
    return () => clearInterval(interval);
  }, [childFamilyCode, parentSession, activeTab]);

  // 부모님 간편 코드 연결
  const handleParentConnect = (code: string) => {
    const newSession: UserSession = {
      role: 'parent',
      familyCode: code,
      userName: '부모님',
    };
    setParentSession(newSession);
    setActiveTab('parent');
    localStorage.setItem('kidney_parent_session', JSON.stringify(newSession));
  };

  // 로그아웃
  const handleLogout = async () => {
    if (confirm('로그아웃하고 메인 화면으로 돌아가시겠습니까?')) {
      if (authSession) {
        await signOut({ redirect: false });
      }
      localStorage.removeItem('kidney_parent_session');
      localStorage.removeItem('kidney_child_family_code');
      localStorage.removeItem('kidney_latest_meal');
      setParentSession(null);
      setChildFamilyCode('');
      setLatestAnalysis(null);
    }
  };

  // 부모님 사진 촬영 완료
  const handleAnalysisComplete = async (result: MealAnalysisResult) => {
    const currentCode = parentSession?.familyCode || childFamilyCode || 'FAMILY';
    const enriched = {
      ...result,
      familyCode: currentCode,
    };
    setLatestAnalysis(enriched);
    localStorage.setItem('kidney_latest_meal', JSON.stringify(enriched));
    setHasNewAlert(true);

    try {
      await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enriched),
      });
    } catch (err) {
      console.error('Save to DB failed:', err);
    }
  };

  const handleSwitchToChild = () => {
    setActiveTab('child');
    setHasNewAlert(false);
  };

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const isAuthorized = !!authSession || !!parentSession;
  const currentFamilyCode = childFamilyCode || parentSession?.familyCode || '';

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans overflow-x-hidden selection:bg-blue-100">
      {!isAuthorized && (
        <AuthGateModal onParentConnect={handleParentConnect} />
      )}

      {/* 식단 히스토리 전체 리스트 모달 */}
      {showHistoryModal && (
        <MealHistoryModal
          familyCode={currentFamilyCode}
          onClose={() => setShowHistoryModal(false)}
          onSelectMeal={(meal) => setLatestAnalysis(meal)}
        />
      )}

      {/* 모바일 최적화 컨테이너: 스마트폰 기준 깔끔한 앱 쉘 레이아웃 */}
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen bg-slate-50 shadow-2xl relative">
        {/* 글로벌 탑 네비게이션: 모바일 최적화 헤더 */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs w-full">
          <div className="w-full px-3.5 h-14 flex items-center justify-between gap-1">
            {/* 좌측 로고 및 상태 */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-sm tracking-tight text-gray-950 block leading-none whitespace-nowrap">
                  안심콩팥케어
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] text-gray-500 font-semibold truncate max-w-[80px]">
                    {parentSession ? '부모님 댁' : (authSession?.user?.name || '보호자')}
                  </span>
                  {currentFamilyCode && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap flex-shrink-0">
                      <Key className="w-2.5 h-2.5" />
                      {currentFamilyCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 우측 모드 전환 토글 탭 & 히스토리 버튼 & 로그아웃: 가로 1줄 고정 */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveTab('parent')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                    activeTab === 'parent'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>부모님</span>
                </button>

                <button
                  onClick={handleSwitchToChild}
                  className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                    activeTab === 'child'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>자녀</span>
                  {hasNewAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  )}
                  {hasNewAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                  )}
                </button>
              </div>

              {/* 히스토리 바로가기 아이콘 버튼 */}
              {isAuthorized && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-xl transition"
                  title="식단 히스토리 목록 보기"
                >
                  <History className="w-4 h-4" />
                </button>
              )}

              {isAuthorized && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition"
                  title="로그아웃 / 다른 계정 또는 코드로 변경"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 자녀 구글 로그인 상태일 때: 상단 부모님 초대용 안심 코드 배너 */}
        {authSession && activeTab === 'child' && childFamilyCode && (
          <div className="bg-blue-50/90 border-b border-blue-100 py-2.5 px-3.5 w-full">
            <div className="flex items-center justify-between text-xs text-blue-950 font-medium gap-2">
              <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
                <span className="font-black text-xs">안심코드:</span>
                <span className="font-mono font-black text-sm text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-xs tracking-wider">
                  {childFamilyCode}
                </span>
              </div>
              <button
                onClick={() => {
                  const text = `[안심콩팥케어] 부모님, 식사 전 사진 1장만 찍어주세요! 가족 안심 번호는 [ ${childFamilyCode} ] 입니다.\n접속 주소: ${window.location.origin}`;
                  navigator.clipboard.writeText(text);
                  alert('부모님께 보낼 안내 문구와 안심 번호가 복사되었습니다! 카톡에 붙여넣어 주세요.');
                }}
                className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs active:bg-blue-50 transition whitespace-nowrap flex-shrink-0"
              >
                카톡 공유
              </button>
            </div>
          </div>
        )}

        {/* 실시간 알림 띠 */}
        {hasNewAlert && activeTab === 'parent' && (
          <div
            onClick={handleSwitchToChild}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3.5 flex items-center justify-center gap-2 cursor-pointer transition shadow-inner font-bold"
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>부모님의 새 식단 분석 도착! [자녀 모드 확인]</span>
          </div>
        )}

        {/* 모바일 화면 꽉 채우는 본문 콘텐츠 */}
        <section className="flex-1 w-full px-3.5 py-3.5 pb-8 space-y-3">
          {activeTab === 'parent' ? (
            <ParentView onAnalysisComplete={handleAnalysisComplete} />
          ) : (
            <ChildView
              analysis={latestAnalysis}
              loadingMeal={loadingInitialMeal}
              onUpdateAnalysis={(updated) => setLatestAnalysis(updated)}
              onSwitchToParent={() => setActiveTab('parent')}
              onOpenHistory={() => setShowHistoryModal(true)}
            />
          )}
        </section>

        {/* 하단 면책 조항 */}
        <footer className="w-full bg-slate-100 border-t border-slate-200 py-3.5 px-4 text-center text-[11px] text-gray-500 leading-normal">
          <p>
            ⚠️ <strong>안내</strong>: 본 서비스는 의료기기나 진단 도구가 아니며, 신장 질환 식단 선택을 돕는 보조 가이드입니다. 정확한 영양 관리는 주치의와 상담하십시오.
          </p>
        </footer>
      </div>
    </main>
  );
}
