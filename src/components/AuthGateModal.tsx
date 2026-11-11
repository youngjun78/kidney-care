'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ShieldCheck, Users, Smartphone, KeyRound, ArrowRight, Heart, Loader2 } from 'lucide-react';

interface AuthGateModalProps {
  onParentConnect: (code: string) => void;
}

export default function AuthGateModal({ onParentConnect }: AuthGateModalProps) {
  const [tab, setTab] = useState<'select' | 'parent' | 'child'>('select');
  const [parentCode, setParentCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingKakao, setLoadingKakao] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = parentCode.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setErrorMessage('자녀분께 받은 안심 코드(6자리)를 입력해주세요.');
      return;
    }

    try {
      setValidatingCode(true);
      setErrorMessage('');

      // 서버 DB에 실제 존재하는 가족 코드인지 검증
      const res = await fetch(`/api/family?code=${cleanCode}`);
      const data = await res.json();

      if (!data.valid) {
        setErrorMessage(data.error || '등록되지 않은 가족 안심 번호입니다.');
        return;
      }

      // 검증 성공 -> 상위 핸들러로 전달
      onParentConnect(cleanCode);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('코드 확인 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoadingGoogle(true);
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      console.error(err);
      alert('구글 로그인 호출 중 오류가 발생했습니다.');
      setLoadingGoogle(false);
    }
  };

  const handleKakaoSignIn = async () => {
    try {
      setLoadingKakao(true);
      await signIn('kakao', { callbackUrl: '/' });
    } catch (err) {
      console.error(err);
      alert('카카오 로그인 호출 중 오류가 발생했습니다.');
      setLoadingKakao(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        {/* 서비스 타이틀 */}
        <div className="text-center space-y-2">
          {/* 헤더와 동일한 시그니처 신장(콩팥) 로고 엠블럼 */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-950/20 p-2.5 border border-emerald-300/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-sm"
            >
              <path
                d="M9.2 3.8C6.3 3.8 4.2 6.8 4.2 11.4C4.2 15.9 6.5 20.2 9.5 20.2C11.6 20.2 12.6 18.7 12.3 16.1C12 13.5 10.3 12.4 10.3 10.9C10.3 9.4 11.6 8.3 11.6 6.3C11.6 4.8 10.5 3.8 9.2 3.8Z"
                fill="#34d399"
              />
              <path
                d="M14.8 3.8C17.7 3.8 19.8 6.8 19.8 11.4C19.8 15.9 17.5 20.2 14.5 20.2C12.4 20.2 11.4 18.7 11.7 16.1C12 13.5 13.7 12.4 13.7 10.9C13.7 9.4 12.4 8.3 12.4 6.3C12.4 4.8 13.5 3.8 14.8 3.8Z"
                fill="#a7f3d0"
              />
              <circle cx="12" cy="11.2" r="1.5" fill="#ffffff" />
              <path
                d="M10 11.2H14"
                stroke="#059669"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-xs animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <h2 className="text-2xl font-black text-gray-950 tracking-tight">안심콩팥케어</h2>
            <span className="text-[10px] font-black tracking-widest text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
              CKD
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 break-keep font-medium">
            아무나 볼 수 없도록 가족만의 안전한 공간으로 보호 중입니다.
          </p>
        </div>

        {tab === 'select' && (
          <div className="space-y-4 pt-2">
            <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-wider">
              시작하실 모드를 선택해주세요
            </p>

            {/* 부모님으로 시작 버튼 */}
            <button
              onClick={() => {
                setTab('parent');
                setErrorMessage('');
              }}
              className="w-full p-4 rounded-2xl border-2 border-emerald-500 hover:bg-emerald-50/50 transition flex items-center gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-900 text-base">부모님으로 시작하기</span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    간편 번호
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  복잡한 로그인 없이 자녀가 알려준 <strong>안심 번호 6자리</strong>로 바로 시작
                </p>
              </div>
            </button>

            {/* 자녀로 시작 버튼 */}
            <button
              onClick={() => {
                setTab('child');
                setErrorMessage('');
              }}
              className="w-full p-4 rounded-2xl border-2 border-emerald-600 hover:bg-emerald-50/50 transition flex items-center gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-900 text-base">자녀(보호자)로 시작하기</span>
                  <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    카카오 1초 로그인
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  카카오 또는 구글 계정으로 로그인 후 부모님 식단 모니터링
                </p>
              </div>
            </button>
          </div>
        )}

        {/* 1. 부모님 모드: 안심 코드 입력 */}
        {tab === 'parent' && (
          <form onSubmit={handleParentSubmit} className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                가족 안심 코드 입력
              </span>
              <p className="text-xs text-emerald-900 leading-relaxed">
                자녀분이 알려준 <strong>안심 번호</strong>를 입력하시면 자녀분의 계정과 안전하게 연동됩니다. (한 번만 입력하면 다음부터 안 물어봐요)
              </p>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-700">가족 안심 번호</label>
              <input
                type="text"
                autoFocus
                disabled={validatingCode}
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value.toUpperCase())}
                placeholder="6자리 숫자 입력"
                className="w-full text-center text-2xl font-black tracking-widest py-3 px-4 rounded-xl border-2 border-emerald-400 focus:border-emerald-600 focus:outline-none uppercase disabled:bg-gray-100 shadow-xs"
                maxLength={8}
              />
              {errorMessage && (
                <p className="text-xs text-rose-600 font-bold pt-1 break-keep leading-tight">
                  ⚠️ {errorMessage}
                </p>
              )}
            </div>

            {/* 이 휴대폰을 부모님 전용 폰으로 안전하게 기억하기 체크박스 */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 cursor-pointer select-none text-left">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer accent-emerald-600"
              />
              <div className="flex-1">
                <span className="text-xs font-black text-emerald-950 block">
                  이 휴대폰을 부모님 폰으로 안전하게 기억하기
                </span>
                <span className="text-[11px] text-emerald-800 font-medium">
                  다음부터 번호 입력 없이 즉시 카메라가 열립니다
                </span>
              </div>
            </label>

            <button
              type="submit"
              disabled={validatingCode}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {validatingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>가족 확인 중...</span>
                </>
              ) : (
                <>
                  <span>확인하고 식사 사진 찍으러 가기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={validatingCode}
              onClick={() => setTab('select')}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 font-semibold"
            >
              ← 이전으로
            </button>
          </form>
        )}

        {/* 2. 자녀 모드: 소셜 로그인 (카카오 / 구글) */}
        {tab === 'child' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                보호자 간편 로그인
              </span>
              <p className="text-xs text-emerald-800 leading-relaxed">
                로그인하시면 부모님과 연결할 <strong>가족 고유 안심 번호</strong>가 자동으로 발급됩니다.
              </p>
            </div>

            <div className="space-y-2.5">
              {/* 카카오 1초 간편 로그인 (대한민국 최우선 배치) */}
              <button
                type="button"
                disabled={loadingKakao || loadingGoogle}
                onClick={handleKakaoSignIn}
                className="w-full py-3.5 px-4 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-extrabold text-sm shadow-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.98]"
              >
                {/* 카카오 심볼 SVG */}
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.477 2 10.772c0 2.768 1.874 5.187 4.697 6.483l-.974 3.568c-.085.312.23.57.494.402l4.248-2.808c.502.054 1.014.083 1.535.083 5.523 0 10-3.477 10-7.728S17.523 3 12 3z" />
                </svg>
                <span>{loadingKakao ? '카카오 로그인으로 이동 중...' : '카카오로 1초 만에 시작하기'}</span>
              </button>

              {/* 구글 로그인 */}
              <button
                type="button"
                disabled={loadingGoogle || loadingKakao}
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-sm transition flex items-center justify-center gap-3 bg-white disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loadingGoogle ? '구글 로그인 화면으로 이동 중...' : 'Google 계정으로 로그인'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setTab('select')}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 font-semibold"
            >
              ← 이전으로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
