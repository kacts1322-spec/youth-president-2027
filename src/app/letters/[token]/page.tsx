import React from "react";
import Link from "next/link";
import { getNomineeGroupByToken } from "@/lib/storage";
import LetterView from "@/components/LetterView";
import { MailOpen, ArrowLeft, ShieldAlert } from "lucide-react";

interface IndividualLetterPageProps {
  params: Promise<{ token: string }>;
}

/**
 * 왜 force-dynamic을 설정하는가:
 * 새로운 추천이 추가될 때마다 캐시된 옛날 편지가 아니라
 * 실시간으로 반영된 최신 추천 편지를 보여주기 위함입니다.
 */
export const dynamic = "force-dynamic";

/**
 * 왜 검색엔진 및 로봇 색인 방지(noindex, nofollow)를 설정하는가:
 * 개인적인 추천 편지 링크가 포털이나 메신저 봇에 의해 외부에 노출되지 않도록 보호하기 위함입니다.
 */
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * 추천받은 사람 개개인을 위한 암호화된 개별 편지 웹페이지 (/letters/[token])
 * - 주소창에 후보자 실명을 입력해서는 절대 접근할 수 없으며,
 *   서버 시크릿 키로 생성된 22자리 암호화 토큰과 일치할 때만 편지가 열립니다.
 */
export default async function IndividualLetterPage({
  params,
}: IndividualLetterPageProps) {
  const resolvedParams = await params;
  const token = decodeURIComponent(resolvedParams.token);
  const group = await getNomineeGroupByToken(token);

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center max-w-md w-full shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-letter text-2xl font-bold text-stone-800 mb-2">
            유효하지 않은 편지 주소입니다
          </h1>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            개인정보 및 추천 내용 보호를 위해 후보자 이름으로는 직접 접속할 수 없으며,
            관리자가 발급한 <strong>고유 암호화 보안 링크</strong>를 통해서만 열람할 수 있습니다.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-800 text-white text-xs font-bold hover:bg-amber-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            메인 추천 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6">
      {/* 상단 안내 배너 (인쇄/PDF 저장 시 자동 숨김) */}
      <div className="no-print max-w-3xl mx-auto mb-4 flex items-center justify-between text-xs text-stone-500">
        <span className="inline-flex items-center gap-1.5 font-medium text-amber-900">
          <MailOpen className="w-4 h-4 text-amber-700" />
          높은뜻 하늘교회 청년부 · {group.nomineeName} 님을 위한 비공개 추천 편지
        </span>
        <Link href="/" className="hover:text-amber-800 underline">
          추천 페이지로 이동
        </Link>
      </div>

      {/* 편지 뷰어 및 PDF/이미지 출력 컴포넌트 */}
      <LetterView group={group} isAdminMode={false} />
    </div>
  );
}
