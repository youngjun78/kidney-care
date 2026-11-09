'use client';

import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, CheckCircle2, HeartHandshake, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MealAnalysisResult } from '@/types/meal';

interface ParentViewProps {
  onAnalysisComplete: (result: MealAnalysisResult, imagePreview: string) => void;
}

export default function ParentView({ onAnalysisComplete }: ParentViewProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    try {
      setLoading(true);
      setIsSuccess(false);
      setStatusMessage('사진을 가볍게 압축하고 있습니다...');

      // 1. 고효율 경량 압축 (AI 인식에는 충분하면서 용량은 90% 이상 절감)
      // 최대 640px 해상도, 품질 0.6, 목표 용량 0.15MB(150KB) 이하
      const options = {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 640,
        initialQuality: 0.6,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };
      const compressedFile = await imageCompression(file, options);

      // 2. Base64 변환
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        setPreview(base64Data);

        setStatusMessage('AI 안심 영양사가 밥상을 살펴보고 있습니다...');

        // 3. 백엔드 API 호출
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: 'image/jpeg',
            }),
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || '분석에 실패했습니다.');
          }

          const data: MealAnalysisResult = await res.json();
          data.imageUrl = base64Data; // 가벼운 압축 이미지로 저장

          setIsSuccess(true);
          setStatusMessage('전송 완료! 자녀에게 안심 알림이 전달되었습니다.');
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

          // 상위 콜백
          onAnalysisComplete(data, base64Data);
        } catch (apiErr: any) {
          console.error(apiErr);
          alert(`분석 오류: ${apiErr.message}`);
          setStatusMessage('오류가 발생했습니다. 다시 촬영해 주세요.');
        } finally {
          setLoading(false);
        }
      };
    } catch (err: any) {
      console.error(err);
      alert('이미지 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[82vh] px-4 py-6 max-w-md mx-auto text-center">
      {/* 상단 안내문구 */}
      <div className="w-full space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm">
          <HeartHandshake className="w-4 h-4 text-emerald-600" />
          <span>부모님 안심 밥상 모드</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
          식사하시기 전에<br />
          <span className="text-emerald-600 underline decoration-emerald-300">식탁 사진을 1장</span> 찍어주세요
        </h1>
        <p className="text-base text-gray-600">
          복잡한 입력 없이 사진만 찍으면 끝나요.<br />
          자녀에게 식사 알림과 안심 분석이 바로 전송됩니다.
        </p>
      </div>

      {/* 중앙 액션 영역 */}
      <div className="w-full my-6 flex flex-col items-center justify-center">
        {loading ? (
          <div className="w-72 h-72 rounded-3xl bg-emerald-50/80 border-4 border-dashed border-emerald-300 flex flex-col items-center justify-center p-6 space-y-4 animate-pulse">
            <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
            <p className="text-lg font-bold text-emerald-900 leading-relaxed break-keep">
              {statusMessage}
            </p>
            <span className="text-xs text-emerald-600">초고속 경량 전송 중 (약 2~3초)</span>
          </div>
        ) : isSuccess ? (
          <div className="w-72 min-h-72 rounded-3xl bg-white border-2 border-emerald-400 shadow-xl p-6 flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">전송 및 분석 완료!</h3>
            <p className="text-base text-gray-600 break-keep leading-snug">
              자녀 스마트폰으로 분석 결과가 안전하게 전달되었습니다.
            </p>
            {preview && (
              <img
                src={preview}
                alt="식사 사진"
                className="w-44 h-32 object-cover rounded-xl border border-gray-200 mt-2 shadow-sm"
              />
            )}
            <button
              onClick={() => {
                setIsSuccess(false);
                setPreview(null);
              }}
              className="mt-3 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-base shadow hover:bg-emerald-700 transition"
            >
              다음 끼니 다시 촬영하기
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-4">
            {/* 큰 촬영 메인 버튼 */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="group relative w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center border-8 border-emerald-100"
            >
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-3 group-hover:bg-white/30 transition">
                <Camera className="w-14 h-14 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-wide">식사 사진 촬영</span>
              <span className="text-xs text-emerald-100 mt-1 font-medium">터치하면 카메라가 켜집니다</span>
            </button>

            {/* 앨범 선택 버튼 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 text-base font-semibold py-2 px-4 rounded-lg bg-gray-50 hover:bg-emerald-50 transition border border-gray-200"
            >
              <Upload className="w-5 h-5 text-gray-500" />
              <span>사진 앨범에서 선택하기</span>
            </button>
          </div>
        )}

        {/* 숨김 Input */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 하단 안심 가이드 팁 */}
      <div className="w-full bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-left flex items-start gap-3">
        <Sparkles className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">부모님을 위한 식사 전 약속</p>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            찌개와 국물 요리는 건더기 위주로 드시고, 채소는 끓는 물에 푹 데쳐 드시면 콩팥이 더욱 건강해집니다.
          </p>
        </div>
      </div>
    </div>
  );
}
