import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '개인정보처리방침 | 안심콩팥케어',
  description: '안심콩팥케어 서비스의 개인정보 수집 및 처리방침 안내입니다.',
};

export default function PrivacyPage() {
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
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950">개인정보처리방침</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">최종 개정일: 2026년 11월 11일</p>
            </div>
          </div>
        </div>

        {/* 본문 조항 */}
        <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">1. 개인정보의 수집 및 이용 목적</h2>
            <p>
              &apos;안심콩팥케어&apos;(이하 &apos;서비스&apos;)는 만성 신장 질환(CKD, 투석 등) 환자와 그 가족의 안전한 식이 관리를 보조하기 위해 다음의 목적으로 최소한의 개인정보를 수집 및 이용합니다:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Google OAuth 소셜 로그인을 통한 가족 계정 식별 및 연동</li>
              <li>업로드된 음식 사진의 AI 영양성분(칼륨, 나트륨, 인, 단백질) 분석 결과 제공</li>
              <li>환자와 보호자(자녀) 간 실시간 식단 정보 동기화 및 외래 진료용 요약 리포트 제공</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">2. 수집하는 개인정보 항목 및 수집 방법</h2>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div>
                <strong className="text-slate-900 block mb-0.5">① 보호자(자녀) 구글 로그인 시 (자동 수집)</strong>
                <span className="text-slate-600">
                  구글 계정 식별자(ID), 이름(닉네임), 이메일 주소, 프로필 이미지 URL<br />
                  <span className="text-emerald-700 font-bold">※ 비밀번호는 구글(Google) 공식 보안 인증 시스템을 통해 처리되며, 본 서비스에는 일절 전송되거나 저장되지 않습니다.</span>
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <strong className="text-slate-900 block mb-0.5">② 부모님 밥상 촬영 시</strong>
                <span className="text-slate-600">
                  사용자가 직접 촬영 또는 업로드한 식단 이미지, 생성된 가족 안심 코드, 기록 일시
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">3. 개인정보의 보유 및 이용 기간</h2>
            <p>
              서비스는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>회원 탈퇴 요청 시: 사용자 계정 및 연결된 식단 기록 즉시 파기</li>
              <li>비활성 계정: 마지막 접속일로부터 1년 경과 시 안전하게 분리 보관 또는 파기</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">4. 개인정보의 제3자 제공 및 위탁</h2>
            <p>
              서비스는 사용자의 동의 없이 개인정보를 외부에 제공하거나 판매하지 않습니다. 단, AI 식단 분석 및 서비스 호스팅을 위해 최소한의 기술적 처리를 위탁하고 있습니다:
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">수탁업체</th>
                    <th className="p-2.5">위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-2.5 font-bold">Google LLC (Gemini API)</td>
                    <td className="p-2.5">식단 사진의 영양성분 임상 AI 분석 (식별 정보 없이 사진 데이터만 일회성 전송)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Supabase Inc.</td>
                    <td className="p-2.5">보안 클라우드 데이터베이스 인프라 운영 및 암호화 보관</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">5. 이용자의 권리와 행사 방법</h2>
            <p>
              이용자(보호자 및 환자)는 언제든지 등록된 개인정보의 조회, 수정, 삭제(탈퇴)를 요청할 수 있습니다. 개인정보의 삭제를 원하시는 경우 운영자 이메일로 요청하시면 즉시 파기 조치됩니다.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">6. 개인정보 보호책임자 및 문의처</h2>
            <p className="text-slate-600">
              서비스 이용 중 발생하는 개인정보 보호 관련 민원 및 문의사항은 아래 연락처로 접수해 주시면 신속히 답변드리겠습니다.
            </p>
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs space-y-1">
              <div><strong>서비스명:</strong> 안심콩팥케어 (Kidney Care)</div>
              <div><strong>개인정보 보호책임자:</strong> 서비스 운영팀</div>
              <div><strong>문의 이메일:</strong> <a href="mailto:jun1042999@gmail.com" className="text-emerald-700 underline font-bold">jun1042999@gmail.com</a></div>
            </div>
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
