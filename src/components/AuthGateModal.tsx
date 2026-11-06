'use client';

import React, { useState } from 'react';
import { ShieldCheck, Users, Smartphone, KeyRound, ArrowRight, Heart } from 'lucide-react';

interface AuthGateModalProps {
  onChildLogin: (email: string, name: string) => void;
  onParentConnect: (code: string) => void;
}

export default function AuthGateModal({ onChildLogin, onParentConnect }: AuthGateModalProps) {
  const [tab, setTab] = useState<'select' | 'parent' | 'child'>('select');
  const [parentCode, setParentCode] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childName, setChildName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = parentCode.trim().toUpperCase();
    if (cleanCode.length < 4) {
      setErrorMessage('자녀분께 받은 안심 코드(4~6자리)를 입력해주세요.');
      return;
    }
    setErrorMessage('');
    onParentConnect(cleanCode);
  };

  const handleChildGoogleMock = () => {
    // 실제 OAuth 연동 전 프로토타입 구글 로그인 시뮬레이션
    const defaultEmail = childEmail || 'user@gmail.com';
    const defaultName = childName || '자녀 보호자';
    onChildLogin(defaultEmail, defaultName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        {/* 서비스 타이틀 */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-md">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">안심콩팥케어</h2>
          <p className="text-xs sm:text-sm text-gray-500 break-keep">
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
                    간편 코드
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  복잡한 로그인 없이 자녀가 준 <strong>안심 번호</strong>로 바로 시작
                </p>
              </div>
            </button>

            {/* 자녀로 시작 버튼 */}
            <button
              onClick={() => {
                setTab('child');
                setErrorMessage('');
              }}
              className="w-full p-4 rounded-2xl border-2 border-blue-600 hover:bg-blue-50/50 transition flex items-center gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-900 text-base">자녀(보호자)로 시작하기</span>
                  <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                    관리자
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  부모님 식단 실시간 모니터링 및 가족 코드 발급
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
                자녀분이 알려준 <strong>안심 번호</strong>를 입력하시면 즉시 연동됩니다. (한 번만 입력하면 다음부터 안 물어봐요)
              </p>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-700">안심 코드 (예: 748291 또는 CARE)</label>
              <input
                type="text"
                autoFocus
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value.toUpperCase())}
                placeholder="코드 입력"
                className="w-full text-center text-2xl font-black tracking-widest py-3 px-4 rounded-xl border-2 border-gray-300 focus:border-emerald-500 focus:outline-none uppercase"
                maxLength={8}
              />
              {errorMessage && <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-1.5"
            >
              <span>연동하고 식사 사진 찍으러 가기</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setTab('select')}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 font-semibold"
            >
              ← 이전으로
            </button>
          </form>
        )}

        {/* 2. 자녀 모드: Google 로그인 화면 */}
        {tab === 'child' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                보호자 계정 로그인
              </span>
              <p className="text-xs text-blue-800 leading-relaxed">
                보호자 계정으로 로그인하시면 고유한 <strong>가족 안심 번호</strong>가 생성되어 부모님과 안전하게 연결됩니다.
              </p>
            </div>

            {/* 실제 소셜 로그인 버튼 형상 */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleChildGoogleMock}
                className="w-full py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-sm transition flex items-center justify-center gap-3 bg-white"
              >
                {/* Google Icon */}
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
                <span>Google 계정으로 계속하기</span>
              </button>

              <button
                type="button"
                onClick={handleChildGoogleMock}
                className="w-full py-3 px-4 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-3"
              >
                {/* Apple Icon */}
                <svg className="w-4 h-4 fill-white" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.96-12.02-14.64-6.09-9.5-10.84-20.2-14.25-32.09-3.41-11.89-5.12-23.23-5.12-34.02 0-14.2 3.46-26.04 10.37-35.53 6.92-9.48 15.67-14.32 26.27-14.52 4.9 0 10.32 1.34 16.27 4.02 5.95 2.68 9.77 4.09 11.46 4.24 1.83-.15 5.8-1.63 11.91-4.44 6.11-2.82 11.43-4.13 15.96-3.93 11.84.62 21.2 5.21 28.08 13.78-10.5 6.35-15.65 15.11-15.45 26.27.2 8.86 3.52 16.32 9.97 22.38 6.45 6.06 14.16 9.49 23.13 10.28-2.12 6.55-4.66 13.25-7.61 20.1zM119.22 31.84c0-7.39 2.64-14.12 7.92-20.2 5.28-6.08 11.75-9.84 19.41-11.28.6 3.82.68 7.37.24 10.65-.68 5.17-2.69 10.24-6.03 15.21-3.34 4.97-7.46 8.56-12.36 10.77-1.16.51-2.43.83-3.81.96-.06-2.04-.37-4.07-.93-6.11h-.44z" />
                </svg>
                <span>Apple 계정으로 계속하기</span>
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
