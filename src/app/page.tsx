'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import ParentView from '@/components/ParentView';
import ChildView from '@/components/ChildView';
import AuthGateModal from '@/components/AuthGateModal';
import MealHistoryModal from '@/components/MealHistoryModal';
import { MealAnalysisResult, UserSession } from '@/types/meal';
import { Heart, Bell, Smartphone, UserCheck, Key, LogOut, History, MessageCircleQuestion } from 'lucide-react';

export default function Home() {
  const { data: authSession, status } = useSession();
  const [parentSession, setParentSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'parent' | 'child'>('child');
  const [latestAnalysis, setLatestAnalysis] = useState<MealAnalysisResult | null>(null);
  const [selectedHistoricalMealId, setSelectedHistoricalMealId] = useState<string | null>(null);
  const [loadingInitialMeal, setLoadingInitialMeal] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [childFamilyCode, setChildFamilyCode] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 모달 오픈 시 부모창 스크롤 방지
  useEffect(() => {
    const isModalOpen = showHistoryModal || showLogoutConfirm;
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showHistoryModal, showLogoutConfirm]);

  const [generatingInvite, setGeneratingInvite] = useState(false);

  // 1. 초기 복원 및 URL 1회용 초대 토큰 자동 로그인 처리
  useEffect(() => {
    setMounted(true);

    // URL 파라미터 확인 (?invite=xxx)
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');

    if (inviteToken) {
      // 1회용 보안 초대 토큰 검증 API 호출
      fetch(`/api/invite?token=${encodeURIComponent(inviteToken)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid && data.familyCode) {
            const parentUser: UserSession = {
              role: 'parent',
              familyCode: data.familyCode,
              userName: `${data.childName || '자녀'}네 부모님`,
            };
            // 스마트폰 브라우저에 영구 저장 (다음부터 코드 없이 자동 로그인)
            localStorage.setItem('kidney_parent_session', JSON.stringify(parentUser));
            setParentSession(parentUser);
            setActiveTab('parent');

            // 브라우저 주소창에서 invite 토큰 파라미터 깔끔하게 제거
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            alert(data.error || '유효하지 않거나 만료된 초대 링크입니다.');
          }
        })
        .catch((err) => {
          console.error('Invite auto login failed:', err);
        });
      return;
    }

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
          // 사용자가 히스토리에서 과거 특정 식단을 골라 보고 있는 상태라면 자동 폴링으로 덮어쓰지 않음
          if (selectedHistoricalMealId) {
            if (data.meal.id !== selectedHistoricalMealId && activeTab === 'child') {
              setHasNewAlert(true);
            }
            return;
          }

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
  }, [childFamilyCode, parentSession, activeTab, selectedHistoricalMealId]);

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

  // 로그아웃 실제 실행
  const performLogout = async () => {
    setShowLogoutConfirm(false);
    if (authSession) {
      await signOut({ redirect: false });
    }
    localStorage.removeItem('kidney_parent_session');
    localStorage.removeItem('kidney_child_family_code');
    localStorage.removeItem('kidney_latest_meal');
    setParentSession(null);
    setChildFamilyCode('');
    setLatestAnalysis(null);
  };

  // 로그아웃 버튼 클릭 시 모달 열기
  const handleLogout = () => {
    setShowLogoutConfirm(true);
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
          onSelectMeal={(meal) => {
            setSelectedHistoricalMealId(meal.id);
            setLatestAnalysis(meal);
            setActiveTab('child');
            setShowHistoryModal(false);
          }}
        />
      )}

      {/* 모바일 최적화 컨테이너: 스마트폰 기준 깔끔한 앱 쉘 레이아웃 */}
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen bg-slate-50/70 shadow-2xl relative">
        {/* 글로벌 탑 네비게이션: 안심 헬스케어 브랜드 시그니처 프리미엄 헤더 */}
        <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 border-b border-emerald-900/40 shadow-md w-full backdrop-blur-md">
          <div className="w-full px-3.5 h-16 flex items-center justify-between gap-1.5">
            {/* 좌측: 신장(콩팥) 메디컬 시그니처 심볼 & 브랜드 워드마크 */}
            <div className="flex items-center gap-2.5 min-w-0 flex-shrink-1">
              {/* 시그니처 콩팥 엠블럼: 에메랄드 림 글로우 + 입체적 듀얼 콩팥 비주얼 */}
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 flex-shrink-0 p-1.5 border border-emerald-300/30">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full drop-shadow-sm"
                >
                  {/* 왼쪽 신장(콩팥) */}
                  <path
                    d="M9.2 3.8C6.3 3.8 4.2 6.8 4.2 11.4C4.2 15.9 6.5 20.2 9.5 20.2C11.6 20.2 12.6 18.7 12.3 16.1C12 13.5 10.3 12.4 10.3 10.9C10.3 9.4 11.6 8.3 11.6 6.3C11.6 4.8 10.5 3.8 9.2 3.8Z"
                    fill="#34d399"
                  />
                  {/* 오른쪽 신장(콩팥) */}
                  <path
                    d="M14.8 3.8C17.7 3.8 19.8 6.8 19.8 11.4C19.8 15.9 17.5 20.2 14.5 20.2C12.4 20.2 11.4 18.7 11.7 16.1C12 13.5 13.7 12.4 13.7 10.9C13.7 9.4 12.4 8.3 12.4 6.3C12.4 4.8 13.5 3.8 14.8 3.8Z"
                    fill="#a7f3d0"
                  />
                  {/* 신장 중심 케어 펄스 포인트 */}
                  <circle cx="12" cy="11.2" r="1.5" fill="#ffffff" />
                  <path
                    d="M10 11.2H14"
                    stroke="#059669"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                  />
                </svg>
                {/* 실시간 케어 상태 미세 인디케이터 점 */}
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-xs animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-[15px] sm:text-base tracking-tight text-white block leading-tight whitespace-nowrap">
                    안심콩팥케어
                  </span>
                  <span className="text-[9px] font-black tracking-widest text-emerald-300 uppercase bg-emerald-950/80 border border-emerald-500/40 px-1 py-0.2 rounded">
                    CKD
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block flex-shrink-0" />
                  <span className="text-[10px] text-emerald-200/90 font-medium block leading-tight truncate">
                    {parentSession ? '부모님 안심 밥상' : (authSession?.user?.name ? `${authSession.user.name} 님 (자녀)` : '신장 식단 모니터링')}
                  </span>
                </div>
              </div>
            </div>

            {/* 우측 모드 전환 토글 탭 & 히스토리 버튼 & 로그아웃: 시그니처 다크 글래스모피즘 */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="flex items-center bg-white/10 backdrop-blur-md p-0.5 rounded-xl border border-white/10">
                <button
                  onClick={() => setActiveTab('parent')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap active:scale-95 ${
                    activeTab === 'parent'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                      : 'text-emerald-100/70 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>부모님</span>
                </button>

                <button
                  onClick={handleSwitchToChild}
                  className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap active:scale-95 ${
                    activeTab === 'child'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-black'
                      : 'text-emerald-100/70 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>자녀</span>
                  {hasNewAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                  )}
                  {hasNewAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900" />
                  )}
                </button>
              </div>

              {/* 히스토리 바로가기 아이콘 버튼 */}
              {isAuthorized && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="p-1.5 text-emerald-200/80 hover:text-white hover:bg-white/15 active:bg-white/20 rounded-xl transition"
                  title="식단 히스토리 목록 보기"
                >
                  <History className="w-4 h-4" />
                </button>
              )}

              {isAuthorized && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-white/10 active:bg-white/15 rounded-xl transition"
                  title="로그아웃"
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
                disabled={generatingInvite}
                onClick={async () => {
                  try {
                    setGeneratingInvite(true);
                    // 1회용 보안 토큰 발급
                    const res = await fetch('/api/invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ familyCode: childFamilyCode }),
                    });
                    const data = await res.json();
                    
                    const inviteUrl = data.token 
                      ? `${window.location.origin}?invite=${data.token}`
                      : `${window.location.origin}`;

                    const text = `[안심콩팥케어] 부모님! 식사하시기 전에 사진 1장만 찍어주세요 😊\n\n1. 평소 쓰시는 인터넷 브라우저(삼성인터넷/크롬)로 접속하시려면:\n👉 ${window.location.origin}\n(안심 번호 [ ${childFamilyCode} ]를 딱 1번만 입력하시면 다음부터는 번호 없이 바로 켜집니다!)\n\n2. 카카오톡으로 바로 열기:\n👉 ${inviteUrl}`;
                    
                    await navigator.clipboard.writeText(text);
                    alert('부모님 전용 다정한 안내 문구와 안심 번호가 복사되었습니다!\n카카오톡에 붙여넣어 부모님께 보내주세요.');
                  } catch (e) {
                    console.error(e);
                    alert('초대장 생성 중 오류가 발생했습니다.');
                  } finally {
                    setGeneratingInvite(false);
                  }
                }}
                className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs active:bg-blue-50 transition whitespace-nowrap flex-shrink-0 disabled:opacity-50"
              >
                {generatingInvite ? '초대장 생성 중...' : '카톡 초대장 복사'}
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

        {/* 모바일 화면 꽉 채우는 본문 콘텐츠 (하단 여백 슬림화) */}
        <section className="flex-1 w-full px-3.5 py-3 pb-3 space-y-3">
          {activeTab === 'parent' ? (
            <ParentView 
              familyCode={currentFamilyCode}
              onAnalysisComplete={handleAnalysisComplete} 
            />
          ) : (
            <ChildView
              analysis={latestAnalysis}
              loadingMeal={loadingInitialMeal}
              isHistoricalView={!!selectedHistoricalMealId}
              onResetToLatest={() => setSelectedHistoricalMealId(null)}
              onUpdateAnalysis={(updated) => setLatestAnalysis(updated)}
              onSwitchToParent={() => setActiveTab('parent')}
              onOpenHistory={() => setShowHistoryModal(true)}
            />
          )}
        </section>

        {/* 하단 면책 조항 & 환우 가족 피드백 창구 & 법적 고지 */}
        <footer className="w-full bg-slate-100 border-t border-slate-200 py-3.5 px-3.5 text-center text-[10px] text-gray-500 space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200/80 py-1.5 px-3 rounded-xl max-w-xs mx-auto">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-[11px]">환우 가족 의견 · 기능 제안</span>
            <a
              href="mailto:jun1042999@gmail.com?subject=[안심콩팥케어] 환우 가족 의견 및 문의"
              className="ml-auto underline font-black text-emerald-700 hover:text-emerald-900"
            >
              보내기 →
            </a>
          </div>

          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-semibold pt-0.5">
            <a href="/privacy" className="hover:text-slate-900 underline underline-offset-2">
              개인정보처리방침
            </a>
            <span>·</span>
            <a href="/terms" className="hover:text-slate-900 underline underline-offset-2">
              서비스 이용약관
            </a>
          </div>

          <p className="leading-normal">
            ⚠️ <strong>안내</strong>: 본 서비스는 의료기기나 진단 도구가 아니며, 신장 질환 식단 선택을 돕는 보조 가이드입니다. 정확한 영양 관리는 주치의와 상담하십시오.
          </p>
        </footer>
      </div>

      {/* 깔끔하고 컴팩트한 모바일 전용 로그아웃 확인 팝업 모달 */}
      {showLogoutConfirm && (
        <div 
          onClick={() => setShowLogoutConfirm(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
              <LogOut className="w-6 h-6 text-slate-700" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-gray-950 text-base">로그아웃 하시겠습니까?</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                로그아웃 후 첫 연결 화면으로 돌아갑니다.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs transition active:scale-95"
              >
                취소
              </button>
              <button
                onClick={performLogout}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition active:scale-95"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
