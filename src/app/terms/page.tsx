import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '서비스 이용약관 | 안심콩팥케어',
  description: '안심콩팥케어 서비스 이용약관 안내입니다.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-8">
        
        {/* 상단 헤더 */}
        <div className="border-b border-slate-100 pb-5 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>메인으로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950">서비스 이용약관</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">최종 개정일: 2026년 11월 11일</p>
            </div>
          </div>
        </div>

        {/* 본문 내용 */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">제1조 (목적)</h2>
            <p>
              본 약관은 &apos;안심콩팥케어&apos;(이하 &apos;서비스&apos;)가 제공하는 만성 콩팥병(신부전, 투석 등) 환자 및 가족을 위한 AI 기반 식단 분석 및 안심 모니터링 서비스의 이용 조건과 절차에 관한 제반 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="space-y-2 bg-amber-50/70 border border-amber-200 p-4 rounded-2xl">
            <h2 className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-1.5">
              <span>⚠️ 제2조 (의료 행위 부인의 면책 조항)</span>
            </h2>
            <p className="text-amber-900 font-medium">
              1. 본 서비스에서 제공하는 AI 식단 분석, 칼륨·인·나트륨 등 영양소 추정치 및 조리 가이드는 <strong>의학적 진단, 처방, 또는 치료를 대신하는 의료 행위가 아니며, 식단 선택을 보조하는 참고 정보</strong>에 불과합니다.<br />
              2. 환자의 개별 임상 상태(잔여 신기능, 투석 주기, 혈청 전해질 검사 결과 등)에 따른 정확한 영양 섭취 기준은 <strong>반드시 담당 신장내과 주치의 및 병원 임상영양사와 직접 상담</strong>하셔야 합니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">제3조 (서비스의 제공 및 이용 한도)</h2>
            <p>
              1. 서비스는 가족 단위로 식단 사진을 업로드하고 분석 결과를 공유할 수 있는 기능을 무상 또는 유상 플랜으로 제공합니다.<br />
              2. 안정적인 시스템 운영 및 공정한 자원 배분을 위해 무료 사용자의 경우 1일 분석 횟수(예: 하루 3회)가 제한될 수 있습니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">제4조 (이용자의 의무)</h2>
            <p>
              이용자는 타인의 명의나 부정한 방법으로 계정을 생성해서는 안 되며, 서비스의 안정적 운영을 방해하거나 음란/위법한 사진을 업로드해서는 안 됩니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">제5조 (문의 및 분쟁 해결)</h2>
            <p>
              서비스 이용과 관련한 문의사항은 운영팀 이메일(<a href="mailto:youngjun78@gmail.com" className="text-emerald-700 underline font-bold">youngjun78@gmail.com</a>)로 문의해 주시기 바랍니다.
            </p>
          </section>
        </div>

        {/* 하단 푸터 */}
        <div className="pt-6 border-t border-slate-100 text-center">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            확인 및 홈으로 이동
          </Link>
        </div>

      </div>
    </div>
  );
}
