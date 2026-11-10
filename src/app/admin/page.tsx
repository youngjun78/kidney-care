'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  UtensilsCrossed, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck,
  Activity, 
  RefreshCw, 
  Lock, 
  LogOut,
  Calendar,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Download,
  Edit3,
  Trash2,
  X,
  Filter,
  Check,
  Sparkles
} from 'lucide-react';

interface AdminStats {
  totalFamilies: number;
  totalMeals: number;
  dangerMeals: number;
  cautionMeals: number;
  safeMeals: number;
  todayMeals: number;
}

interface FamilyItem {
  id: string;
  family_code: string;
  child_email: string;
  child_name: string;
  created_at: string;
  mealCount: number;
}

interface MealItem {
  id: string;
  family_code: string;
  image_url?: string;
  overall_risk: 'danger' | 'caution' | 'safe';
  summary_title: string;
  worst_risk_nutrient: string;
  created_at: string;
  foods: any[];
  friendly_message?: string;
  clinical_summary?: string;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [adminKey, setAdminKey] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [riskDist, setRiskDist] = useState<{ danger: number; caution: number; safe: number }>({ danger: 0, caution: 0, safe: 0 });
  const [topNutrients, setTopNutrients] = useState<{ nutrient: string; count: number }[]>([]);
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [recentMeals, setRecentMeals] = useState<MealItem[]>([]);
  
  // 탭 및 필터 상태
  const [activeTab, setActiveTab] = useState<'overview' | 'families' | 'meals'>('overview');
  const [searchFamily, setSearchFamily] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'danger' | 'caution' | 'safe'>('all');
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // 관리자 보정/상세 모달 상태
  const [editingMeal, setEditingMeal] = useState<MealItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRisk, setEditRisk] = useState<'danger' | 'caution' | 'safe'>('caution');
  const [editNutrient, setEditNutrient] = useState('');
  const [editAdvice, setEditAdvice] = useState('');
  const [savingMeal, setSavingMeal] = useState(false);

  // 가족 상세 팝업 상태
  const [selectedFamilyDetail, setSelectedFamilyDetail] = useState<FamilyItem | null>(null);

  // 관리자 인증 세션 확인
  useEffect(() => {
    const savedAdminKey = sessionStorage.getItem('kidney_admin_auth');
    if (savedAdminKey) {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setRiskDist(data.riskDistribution);
        setTopNutrients(data.topRiskNutrients || []);
        setFamilies(data.families || []);
        setRecentMeals(data.recentMeals || []);
      }
    } catch (err) {
      console.error('Fetch admin stats failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminData();
    }
  }, [isAdminAuthenticated]);

  // 관리자 로그인
  const handleAdminKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('kidney_admin_auth', 'authenticated');
        setIsAdminAuthenticated(true);
      } else {
        setAuthError(data.error || '올바른 관리자 마스터 키를 입력해주세요.');
      }
    } catch {
      setAuthError('인증 확인 중 오류가 발생했습니다.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('kidney_admin_auth');
    setIsAdminAuthenticated(false);
  };

  // 식단 수정 모달 오픈
  const openEditModal = (meal: MealItem) => {
    setEditingMeal(meal);
    setEditTitle(meal.summary_title);
    setEditRisk(meal.overall_risk);
    setEditNutrient(meal.worst_risk_nutrient);
    setEditAdvice(meal.clinical_summary || '');
  };

  // 식단 수정 저장
  const handleSaveMealCorrection = async () => {
    if (!editingMeal) return;
    try {
      setSavingMeal(true);
      const res = await fetch('/api/admin/meals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealId: editingMeal.id,
          summaryTitle: editTitle,
          overallRisk: editRisk,
          worstRiskNutrient: editNutrient,
          foods: editingMeal.foods,
          friendlyMessage: editingMeal.friendly_message,
          clinicalSummary: editAdvice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('식단 분석 정보가 성공적으로 보정되었습니다.');
        setEditingMeal(null);
        fetchAdminData();
      } else {
        alert(data.error || '수정 실패');
      }
    } catch (err) {
      console.error(err);
      alert('식단 수정 중 오류가 발생했습니다.');
    } finally {
      setSavingMeal(false);
    }
  };

  // 식단 삭제
  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('정말 이 식단 기록을 삭제하시겠습니까? (복구할 수 없습니다)')) return;
    try {
      const res = await fetch(`/api/admin/meals?mealId=${mealId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert('식단이 삭제되었습니다.');
        if (editingMeal?.id === mealId) setEditingMeal(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류 발생');
    }
  };

  // 엑셀/CSV 내보내기 기능
  const exportToCSV = (targetMeals: MealItem[]) => {
    if (targetMeals.length === 0) {
      alert('내보낼 식단 데이터가 없습니다.');
      return;
    }

    const headers = ['식단ID', '가족코드', '기록일시', '식단명', '위험등급', '주의영양소', '반찬목록'];
    const rows = targetMeals.map(m => [
      m.id,
      m.family_code,
      new Date(m.created_at).toLocaleString(),
      `"${(m.summary_title || '').replace(/"/g, '""')}"`,
      m.overall_risk,
      m.worst_risk_nutrient,
      `"${(m.foods?.map((f: any) => f.name).join(', ') || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `신장케어_식단기록_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 로그인 전 게이트
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">안심콩팥케어 백오피스</h1>
            <p className="text-xs text-slate-400">
              운영팀 및 임상 연구원 전용 종합 관제 센터입니다.
            </p>
          </div>

          <form onSubmit={handleAdminKeySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">관리자 보안 인증 키</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="마스터 키 입력"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-center text-lg"
              />
              {authError && (
                <p className="text-xs text-rose-400 font-bold">{authError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-sm shadow-lg transition active:scale-95"
            >
              관제 콘솔 로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 필터링 적용된 식단 목록
  const filteredMeals = recentMeals.filter((m) => {
    if (selectedRiskFilter !== 'all' && m.overall_risk !== selectedRiskFilter) return false;
    if (selectedFamilyFilter !== 'all' && m.family_code !== selectedFamilyFilter) return false;
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const filteredFamilies = families.filter((f) => 
    f.family_code.toLowerCase().includes(searchFamily.toLowerCase()) ||
    (f.child_email && f.child_email.toLowerCase().includes(searchFamily.toLowerCase())) ||
    (f.child_name && f.child_name.toLowerCase().includes(searchFamily.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 관리자 상단 글로벌 헤더 */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-slate-950 font-black shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight text-white leading-none">
                안심콩팥케어 Admin
              </span>
              <span className="text-[10px] bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                v2.0 Operations
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              신장 질환 실시간 식단 관제 & 휴먼 인더루프 센터
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(recentMeals)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-800/60 text-xs font-bold text-emerald-300 border border-emerald-700/60 transition shadow-xs"
            title="전체 식단 CSV 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span>식단 데이터 CSV 추출</span>
          </button>
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition"
          >
            <span>앱 바로가기</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleAdminLogout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="관리자 로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 서브 탭 네비게이션 */}
      <nav className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-8 flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 종합 관제 대시보드
        </button>
        <button
          onClick={() => setActiveTab('families')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'families'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          👥 등록 가족 관리 ({families.length})
        </button>
        <button
          onClick={() => setActiveTab('meals')}
          className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'meals'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🥗 식단 피드 & AI 보정 검수 ({recentMeals.length})
        </button>
      </nav>

      {/* 본문 콘텐츠 */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* 1. 종합 관제 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* KPI 메트릭 카드 4종 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>총 등록 가족 수</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {stats?.totalFamilies || 0}
                  <span className="text-xs text-slate-500 font-normal ml-1">가구</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">연동 완료 가족 100%</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>오늘 업로드 식단</span>
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400">
                  {stats?.todayMeals || 0}
                  <span className="text-xs text-slate-500 font-normal ml-1">끼니</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">누적 {stats?.totalMeals || 0}끼니</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>위험(섭취주의) 감지</span>
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-500">
                  {stats?.dangerMeals || 0}
                  <span className="text-xs text-slate-500 font-normal ml-1">건</span>
                </div>
                <span className="text-[11px] text-rose-400 font-medium">즉시 식이 조절 권고 식단</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                  <span>주의(양 조절) 식단</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {stats?.cautionMeals || 0}
                  <span className="text-xs text-slate-500 font-normal ml-1">건</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">안전 식단 {stats?.safeMeals || 0}건</span>
              </div>
            </div>

            {/* 중간 2열: 위험도 분포 비주얼 바 & 주요 주의 영양소 순위 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>환자 식단 신호등 분포 비율</span>
                  </h3>
                  <span className="text-xs text-slate-400">전체 {stats?.totalMeals || 0}건 기준</span>
                </div>

                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${stats?.totalMeals ? (riskDist.danger / stats.totalMeals) * 100 : 0}%` }}
                    className="bg-rose-500 transition-all"
                    title={`위험: ${riskDist.danger}건`}
                  />
                  <div 
                    style={{ width: `${stats?.totalMeals ? (riskDist.caution / stats.totalMeals) * 100 : 0}%` }}
                    className="bg-amber-500 transition-all"
                    title={`주의: ${riskDist.caution}건`}
                  />
                  <div 
                    style={{ width: `${stats?.totalMeals ? (riskDist.safe / stats.totalMeals) * 100 : 0}%` }}
                    className="bg-emerald-500 transition-all"
                    title={`안전: ${riskDist.safe}건`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-rose-950/40 border border-rose-900/40 p-2.5 rounded-xl">
                    <span className="text-[11px] text-rose-300 font-bold block">위험</span>
                    <strong className="text-base text-rose-400">{riskDist.danger}건</strong>
                    <span className="text-[10px] text-slate-400 block">
                      {stats?.totalMeals ? Math.round((riskDist.danger / stats.totalMeals) * 100) : 0}%
                    </span>
                  </div>
                  <div className="bg-amber-950/40 border border-amber-900/40 p-2.5 rounded-xl">
                    <span className="text-[11px] text-amber-300 font-bold block">주의</span>
                    <strong className="text-base text-amber-400">{riskDist.caution}건</strong>
                    <span className="text-[10px] text-slate-400 block">
                      {stats?.totalMeals ? Math.round((riskDist.caution / stats.totalMeals) * 100) : 0}%
                    </span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-900/40 p-2.5 rounded-xl">
                    <span className="text-[11px] text-emerald-300 font-bold block">안전</span>
                    <strong className="text-base text-emerald-400">{riskDist.safe}건</strong>
                    <span className="text-[10px] text-slate-400 block">
                      {stats?.totalMeals ? Math.round((riskDist.safe / stats.totalMeals) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>주요 모니터링 위험 영양소 빈도</span>
                </h3>

                <div className="space-y-3">
                  {topNutrients.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">집계된 데이터가 없습니다.</div>
                  ) : (
                    topNutrients.map((item, idx) => (
                      <div key={item.nutrient} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300">
                            {idx + 1}. {item.nutrient}
                          </span>
                          <span className="text-slate-400 font-medium">{item.count}회 검출</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${stats?.totalMeals ? (item.count / stats.totalMeals) * 100 : 10}%` }}
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 최근 등록된 실시간 식단 5건 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  실시간 식단 분석 피드 (최신 5건)
                </h3>
                <button
                  onClick={() => setActiveTab('meals')}
                  className="text-xs text-emerald-400 hover:underline font-bold"
                >
                  전체 식단 피드 보기 →
                </button>
              </div>

              <div className="divide-y divide-slate-800">
                {recentMeals.slice(0, 5).map((meal) => (
                  <div key={meal.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {meal.image_url ? (
                        <img
                          src={meal.image_url}
                          alt="식단"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <UtensilsCrossed className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">
                            {meal.family_code}
                          </span>
                          <h4 className="font-bold text-sm text-white truncate">{meal.summary_title}</h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          주의 영양소: <strong className="text-amber-400">{meal.worst_risk_nutrient}</strong> ·{' '}
                          {new Date(meal.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        meal.overall_risk === 'danger'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : meal.overall_risk === 'caution'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {meal.overall_risk === 'danger' ? '위험' : meal.overall_risk === 'caution' ? '주의' : '안전'}
                      </span>
                      <button
                        onClick={() => openEditModal(meal)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="운영자 직접 보정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. 등록 가족 관리 탭 */}
        {activeTab === 'families' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchFamily}
                  onChange={(e) => setSearchFamily(e.target.value)}
                  placeholder="가족 코드, 자녀 이메일, 이름 검색"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-400">
                총 {filteredFamilies.length}가구 검색됨
              </span>
            </div>

            {/* 가족 테이블 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">가족 안심 코드</th>
                      <th className="py-3 px-4">자녀(보호자) 정보</th>
                      <th className="py-3 px-4">구글 이메일</th>
                      <th className="py-3 px-4">누적 식사 수</th>
                      <th className="py-3 px-4">등록 일시</th>
                      <th className="py-3 px-4 text-right">식단 조회</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredFamilies.map((fam) => (
                      <tr key={fam.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm">
                          {fam.family_code}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {fam.child_name || '보호자'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {fam.child_email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-blue-950 text-blue-300 border border-blue-800/60 font-bold px-2 py-0.5 rounded-full text-xs">
                            {fam.mealCount}끼니
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {new Date(fam.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedFamilyFilter(fam.family_code);
                              setActiveTab('meals');
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 rounded-lg text-xs font-bold transition"
                          >
                            식단 피드 확인 →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. 전체 식단 피드 & AI 보정 탭 */}
        {activeTab === 'meals' && (
          <div className="space-y-4 animate-in fade-in">
            {/* 상단 필터 & 툴바 바 */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> 등급 필터:
                </span>
                {(['all', 'danger', 'caution', 'safe'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRiskFilter(r)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedRiskFilter === r
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'all' ? '전체' : r === 'danger' ? '위험 🔴' : r === 'caution' ? '주의 🟡' : '안전 🟢'}
                  </button>
                ))}

                {selectedFamilyFilter !== 'all' && (
                  <div className="flex items-center gap-1 bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-xl text-xs font-bold">
                    <span>코드: {selectedFamilyFilter}</span>
                    <button onClick={() => setSelectedFamilyFilter('all')} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortOrder}
                  onChange={(e: any) => setSortOrder(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none"
                >
                  <option value="newest">최신순</option>
                  <option value="oldest">오래된순</option>
                </select>

                <button
                  onClick={() => exportToCSV(filteredMeals)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>필터링된 목록 CSV ({filteredMeals.length})</span>
                </button>
              </div>
            </div>

            {/* 식단 피드 그리드 */}
            {filteredMeals.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl py-16 text-center space-y-2">
                <UtensilsCrossed className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-slate-400 font-bold text-sm">해당 조건의 식단이 없습니다.</h4>
                <button
                  onClick={() => {
                    setSelectedRiskFilter('all');
                    setSelectedFamilyFilter('all');
                  }}
                  className="text-xs text-emerald-400 font-bold hover:underline"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMeals.map((meal) => (
                  <div key={meal.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition">
                    <div>
                      {meal.image_url ? (
                        <div className="aspect-[16/10] w-full bg-slate-950 overflow-hidden relative group">
                          <img
                            src={meal.image_url}
                            alt="식단 사진"
                            className="w-full h-full object-cover group-hover:scale-102 transition"
                          />
                          <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md ${
                            meal.overall_risk === 'danger'
                              ? 'bg-rose-600 text-white'
                              : meal.overall_risk === 'caution'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-emerald-500 text-slate-950'
                          }`}>
                            {meal.overall_risk === 'danger' ? '위험' : meal.overall_risk === 'caution' ? '주의' : '안전'}
                          </span>
                        </div>
                      ) : (
                        <div className="aspect-[16/10] w-full bg-slate-800 flex items-center justify-center text-slate-600">
                          <UtensilsCrossed className="w-10 h-10" />
                        </div>
                      )}

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono text-emerald-400 font-bold">코드: {meal.family_code}</span>
                          <span>{new Date(meal.created_at).toLocaleString()}</span>
                        </div>
                        <h4 className="font-black text-sm text-white line-clamp-1">{meal.summary_title}</h4>
                        <p className="text-xs text-rose-400 font-medium">
                          주의 영양소: {meal.worst_risk_nutrient}
                        </p>

                        <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-300">
                          <span className="text-slate-500 block mb-0.5">인식된 메뉴:</span>
                          <span className="line-clamp-2">{meal.foods?.map((f: any) => `${f.name}(${f.riskLevel})`).join(', ') || '분석 완료'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2 border-t border-slate-800/60 mt-2">
                      <button
                        onClick={() => openEditModal(meal)}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI 분석 직접 보정</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="p-2 bg-slate-800/60 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl transition"
                        title="식단 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 운영자 AI 분석 직접 보정(Human-in-the-loop) 팝업 모달 */}
      {editingMeal && (
        <div 
          onClick={() => setEditingMeal(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 text-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base sm:text-lg text-white">식단 AI 분석 운영자 직접 보정</h3>
              </div>
              <button 
                onClick={() => setEditingMeal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">식단 요약 제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">종합 위험 등급</label>
                <div className="flex gap-2">
                  {(['safe', 'caution', 'danger'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditRisk(r)}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs border transition ${
                        editRisk === r
                          ? r === 'danger'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : r === 'caution'
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {r === 'danger' ? '위험 (섭취주의)' : r === 'caution' ? '주의 (양 조절)' : '안전'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">주의 요망 영양소</label>
                <input
                  type="text"
                  value={editNutrient}
                  onChange={(e) => setEditNutrient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="예: 칼륨, 나트륨, 인"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">임상 요약 코멘트 / 조리 가이드</label>
                <textarea
                  rows={3}
                  value={editAdvice}
                  onChange={(e) => setEditAdvice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="전문 영양 가이드 입력"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                취소
              </button>
              <button
                type="button"
                disabled={savingMeal}
                onClick={handleSaveMealCorrection}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-50"
              >
                {savingMeal ? '저장 중...' : '보정 내용 저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
