import React from "react";
import Link from "next/link";
import RecommendationForm from "@/components/RecommendationForm";
import { Sparkles, ShieldCheck } from "lucide-react";

/**
 * 메인 페이지 (/)
 * 일반 청년부원들이 접속하여 바로 2027년 회장 후보와 추천 사유를 기록할 수 있는 페이지입니다.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* 배경 은은한 그라데이션 장식 */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[380px] rounded-full bg-amber-200/35 blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6 pt-12 sm:pt-16 pb-16">
        {/* 상단 교회 및 행사 타이틀 */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300/60 text-amber-900 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            높은뜻 하늘교회 청년부
          </div>

          <h1 className="font-letter text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-4">
            2027년 청년부 회장 추천
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-lg mx-auto leading-relaxed">
            다가오는 2027년, 높은뜻 하늘교회 청년부를 사랑과 섬김으로 이끌어갈
            회장을 기도하는 마음으로 추천해주세요.
            <br />
            <span className="text-amber-900 font-medium">
              적어주신 추천 이유는 후보자에게 따뜻한 편지로 전달됩니다.
            </span>
          </p>
        </header>

        {/* 추천 입력 폼 */}
        <main>
          <RecommendationForm />
        </main>
      </div>

      {/* 하단 푸터 및 관리자 페이지 이동 링크 */}
      <footer className="relative z-10 border-t border-stone-200/70 bg-white/60 backdrop-blur-xs py-5 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <span>© 높은뜻 하늘교회 청년부 · 2027년 임원 선출 위원회</span>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-600 hover:text-amber-900 hover:bg-amber-50/80 border border-transparent hover:border-amber-200 transition font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            관리자 페이지 (집계 및 편지 출력)
          </Link>
        </div>
      </footer>
    </div>
  );
}
