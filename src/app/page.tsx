'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import ParentView from '@/components/ParentView';
import ChildView from '@/components/ChildView';
import AuthGateModal from '@/components/AuthGateModal';
import { MealAnalysisResult, UserSession } from '@/types/meal';
import { Heart, Bell, Smartphone, UserCheck, Key, LogOut } from 'lucide-react';

export default function Home() {
  const { data: authSession, status } = useSession();
  const [parentSession, setParentSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'parent' | 'child'>('child');
  const [latestAnalysis, setLatestAnalysis] = useState<MealAnalysisResult | null>(null);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 부모님 세션 및 식단 데이터 복원
  useEffect(() => {
    setMounted(true);
    const savedParent = localStorage.getItem('kidney_parent_session');
    if (savedParent) {
      try {
        setParentSession(JSON.parse(savedParent));
        setActiveTab('parent');
      } catch (e) {
        console.error(e);
      }
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

  // 자녀 로그인(NextAuth) 성공 시 가족 코드 매핑
  const [childFamilyCode, setChildFamilyCode] = useState<string>('');

  useEffect(() => {
    if (authSession?.user?.email) {
      let code = localStorage.getItem('kidney_child_family_code');
      if (!code) {
        // 자녀 고유의 6자리 가족 코드 생성
        code = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem('kidney_child_family_code', code);
      }
      setChildFamilyCode(code);
      setActiveTab('child');
    }
  }, [authSession]);

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
      setParentSession(null);
    }
  };

  const handleAnalysisComplete = (result: MealAnalysisResult) => {
    const currentCode = parentSession?.familyCode || childFamilyCode || 'FAMILY';
    const enriched = {
      ...result,
      familyCode: currentCode,
    };
    setLatestAnalysis(enriched);
    localStorage.setItem('kidney_latest_meal', JSON.stringify(enriched));
    setHasNewAlert(true);
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

  // 자녀 구글 로그인도 안 되어 있고, 부모님 코드도 입력 안 된 경우 게이트 모달 표출
  const isAuthorized = !!authSession || !!parentSession;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {!isAuthorized && (
        <AuthGateModal onParentConnect={handleParentConnect} />
      )}

      {/* 글로벌 탑 네비게이션 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-gray-900 block leading-none">
                안심콩팥케어
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-400 font-semibold">
                  {parentSession ? '부모님 댁' : (authSession?.user?.name || '보호자')}
                </span>
                {(parentSession?.familyCode || childFamilyCode) && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-800 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                    <Key className="w-2.5 h-2.5" />
                    {parentSession?.familyCode || childFamilyCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 모드 전환 토글 탭 & 로그아웃 */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('parent')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'parent'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>부모님</span>
              </button>

              <button
                onClick={handleSwitchToChild}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'child'
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>자녀</span>
                {hasNewAlert && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
                {hasNewAlert && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>
            </div>

            {isAuthorized && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
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
        <div className="bg-blue-50 border-b border-blue-100 py-2.5 px-4">
          <div className="max-w-xl mx-auto flex items-center justify-between text-xs text-blue-900 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">🔑 우리 가족 안심 코드:</span>
              <span className="font-mono font-black text-sm text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 tracking-wider">
                {childFamilyCode}
              </span>
            </div>
            <button
              onClick={() => {
                const text = `[안심콩팥케어] 부모님, 식사 전 사진 1장만 찍어주세요! 가족 안심 번호는 [ ${childFamilyCode} ] 입니다.\n접속 주소: ${window.location.origin}`;
                navigator.clipboard.writeText(text);
                alert('부모님께 보낼 안내 문구와 안심 번호가 복사되었습니다! 카톡에 붙여넣어 주세요.');
              }}
              className="text-[11px] font-bold text-blue-600 hover:underline bg-white/80 px-2 py-1 rounded-md border border-blue-200"
            >
              카톡으로 부모님께 코드 보내기
            </button>
          </div>
        </div>
      )}

      {/* 실시간 알림 띠 */}
      {hasNewAlert && activeTab === 'parent' && (
        <div
          onClick={handleSwitchToChild}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 cursor-pointer transition shadow-inner font-semibold"
        >
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          <span>부모님의 새 식단 분석이 도착했습니다. [자녀 모드에서 신호등 보기]</span>
        </div>
      )}

      {/* 본문 콘텐츠 */}
      <section className="flex-1 w-full max-w-xl mx-auto">
        {activeTab === 'parent' ? (
          <ParentView onAnalysisComplete={handleAnalysisComplete} />
        ) : (
          <ChildView
            analysis={latestAnalysis}
            onUpdateAnalysis={(updated) => {
              setLatestAnalysis(updated);
              localStorage.setItem('kidney_latest_meal', JSON.stringify(updated));
            }}
            onSwitchToParent={() => setActiveTab('parent')}
          />
        )}
      </section>

      {/* 면책 조항 */}
      <footer className="w-full bg-slate-100 border-t border-slate-200 py-3 px-4 text-center text-[11px] text-gray-600 leading-tight">
        <p className="max-w-md mx-auto">
          ⚠️ <strong>안내</strong>: 본 서비스는 의료기기 또는 질병 치료·진단 도구가 아니며, 식단 선택을 돕기 위한 보조 가이드입니다. 정확한 영양 및 복약 관리는 반드시 신장내과 주치의 및 임상영양사와 상담하십시오.
        </p>
      </footer>
    </main>
  );
}
