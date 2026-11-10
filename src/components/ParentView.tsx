'use client';

import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, Upload, CheckCircle2, HeartHandshake, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MealAnalysisResult } from '@/types/meal';

interface ParentViewProps {
  familyCode?: string;
  onAnalysisComplete: (result: MealAnalysisResult, imagePreview: string) => void;
}

export default function ParentView({ familyCode, onAnalysisComplete }: ParentViewProps) {
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
              familyCode: familyCode || undefined,
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
    <div className="flex flex-col items-center justify-between min-h-[75vh] py-2 max-w-sm mx-auto text-center w-full">
      {/* 상단 안내문구 */}
      <div className="w-full space-y-2 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 font-bold text-xs">
          <HeartHandshake className="w-4 h-4 text-emerald-600" />
          <span>부모님 안심 밥상 모드</span>
        </div>
        <h1 className="text-2xl font-black text-gray-950 leading-tight">
          식사하시기 전에<br />
          <span className="text-emerald-600 underline decoration-emerald-300">식탁 사진을 1장</span> 찍어주세요
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          복잡한 입력 없이 큰 버튼만 누르면 끝납니다.<br />
          자녀에게 식사 알림과 안심 분석이 바로 전송됩니다.
        </p>
      </div>

      {/* 중앙 액션 영역 */}
      <div className="w-full my-4 flex flex-col items-center justify-center">
        {loading ? (
          <div className="w-64 h-64 rounded-3xl bg-emerald-50/80 border-4 border-dashed border-emerald-300 flex flex-col items-center justify-center p-6 space-y-3 animate-pulse">
            <Loader2 className="w-14 h-14 text-emerald-600 animate-spin" />
            <p className="text-base font-black text-emerald-950 leading-relaxed break-keep">
              {statusMessage}
            </p>
            <span className="text-xs text-emerald-700 font-medium">초고속 경량 전송 중 (약 2~3초)</span>
          </div>
        ) : isSuccess ? (
          <div className="w-full rounded-3xl bg-white border border-emerald-300 shadow-md p-6 flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-gray-950">전송 및 분석 완료!</h3>
            <p className="text-sm text-gray-600 break-keep leading-snug">
              자녀 스마트폰으로 분석 결과가 안전하게 전달되었습니다.
            </p>
            {preview && (
              <img
                src={preview}
                alt="식사 사진"
                className="w-40 h-28 object-cover rounded-xl border border-gray-200 mt-1 shadow-xs"
              />
            )}
            <button
              onClick={() => {
                setIsSuccess(false);
                setPreview(null);
              }}
              className="mt-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-black text-sm shadow-xs hover:bg-emerald-700 active:scale-95 transition"
            >
              다음 끼니 다시 촬영하기
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-4">
            {/* 큰 촬영 메인 버튼 */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="group relative w-64 h-64 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center border-6 border-emerald-100"
            >
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30 transition">
                <Camera className="w-12 h-12 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">식사 사진 촬영</span>
              <span className="text-xs text-emerald-100 mt-1 font-semibold">터치하면 카메라가 켜집니다</span>
            </button>

            {/* 앨범 선택 버튼 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 text-sm font-bold py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 transition border border-gray-200 shadow-xs active:scale-95"
            >
              <Upload className="w-4 h-4 text-gray-500" />
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
