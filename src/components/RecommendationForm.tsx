"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, HeartHandshake, Sparkles, AlertCircle } from "lucide-react";

/**
 * 일반 청년부원들이 접속하여 2027년 회장 후보를 추천하는 폼 컴포넌트입니다.
 * 왜 이름 입력란에 안내 문구와 자동 정제를 적용했는가:
 * '김하늘 자매', '김하늘 ' 등 표기가 달라지면 관리자 페이지에서 다른 사람으로 분류될 수 있으므로
 * 입력 단계에서 순수 이름만 적도록 유도하기 위함입니다.
 */
export default function RecommendationForm() {
  const [nomineeName, setNomineeName] = useState("");
  const [recommenderName, setRecommenderName] = useState("");
  const [reason, setReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedNominee, setSubmittedNominee] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedNominee = nomineeName.trim();
    const trimmedRecommender = recommenderName.trim();
    const trimmedReason = reason.trim();

    if (!trimmedNominee || !trimmedRecommender || !trimmedReason) {
      setErrorMsg("추천하시는 분, 본인 성함, 추천 이유를 모두 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomineeName: trimmedNominee,
          recommenderName: trimmedRecommender,
          reason: trimmedReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "추천서 제출 중 문제가 발생했습니다.");
      }

      // 제출 성공 시 감사 화면으로 전환
      setSubmittedNominee(trimmedNominee);
      setNomineeName("");
      setReason("");
      // 추천인 본인 이름은 추가 추천 시 편의를 위해 유지할 수도 있으나, 깔끔한 재작성을 위해 유지
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "서버와 통신하는 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 제출 완료 후 보여줄 감사 카드 화면
  if (submittedNominee) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-amber-200/80 rounded-3xl p-8 sm:p-10 shadow-xl text-center max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="font-letter text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
          마음 담긴 추천이 전달되었습니다
        </h2>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
          추천해주신 <strong className="text-amber-900">{submittedNominee}</strong> 님을 향한
          따뜻한 추천 이유와 기도가 소중히 기록되었습니다.
          <br />
          작성해주신 내용은 추후 따뜻한 편지 형태로 정리되어 전달됩니다.
        </p>

        <button
          type="button"
          onClick={() => setSubmittedNominee(null)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-800 text-white font-semibold text-sm hover:bg-amber-900 transition cursor-pointer shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          다른 지체 추가로 추천하기
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 backdrop-blur-sm border border-amber-200/80 rounded-3xl p-6 sm:p-10 shadow-xl max-w-xl mx-auto"
    >
      <div className="flex items-center gap-2.5 text-amber-900 mb-6 pb-4 border-b border-stone-100">
        <HeartHandshake className="w-5 h-5 text-amber-700 shrink-0" />
        <h2 className="font-letter text-lg sm:text-xl font-bold">
          2027년 청년부 회장 추천서 작성
        </h2>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* 1. 회장으로 추천하는 사람 */}
        <div>
          <label
            htmlFor="nomineeName"
            className="block text-sm font-bold text-stone-800 mb-1.5"
          >
            1. 회장으로 추천하는 사람{" "}
            <span className="text-amber-700 font-normal text-xs">
              (추천받을 후보자 성함)
            </span>
          </label>
          <input
            id="nomineeName"
            type="text"
            value={nomineeName}
            onChange={(e) => setNomineeName(e.target.value)}
            placeholder="예: 김하늘 (직분이나 호칭 없이 이름만 입력)"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700 text-stone-900 placeholder:text-stone-400 transition"
            required
          />
          <p className="text-xs text-stone-500 mt-1.5">
            * 후보자별로 편지가 자동 분류되오니 오타나 호칭(형제/자매 등) 없이 <strong>실명</strong>만 정확히 적어주세요.
          </p>
        </div>

        {/* 2. 추천한 사람 */}
        <div>
          <label
            htmlFor="recommenderName"
            className="block text-sm font-bold text-stone-800 mb-1.5"
          >
            2. 추천한 사람{" "}
            <span className="text-amber-700 font-normal text-xs">
              (작성자 본인 성함)
            </span>
          </label>
          <input
            id="recommenderName"
            type="text"
            value={recommenderName}
            onChange={(e) => setRecommenderName(e.target.value)}
            placeholder="예: 이은혜"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700 text-stone-900 placeholder:text-stone-400 transition"
            required
          />
        </div>

        {/* 3. 추천하는 이유 */}
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-bold text-stone-800 mb-1.5"
          >
            3. 추천하는 이유 및 응원의 마음
          </label>
          <textarea
            id="reason"
            rows={6}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="공동체 안에서 보았던 따뜻한 섬김, 리더십, 혹은 2027년 청년부를 함께 세워가길 소망하는 이유를 편지처럼 정성껏 적어주세요."
            className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700 text-stone-900 placeholder:text-stone-400 leading-relaxed resize-y transition"
            required
          />
          <div className="flex justify-between items-center mt-1.5 text-xs text-stone-500">
            <span>* 작성하신 내용은 추천받은 분께 따뜻한 편지 형태로 전달됩니다.</span>
            <span>{reason.length}자</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-bold text-base shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? "추천서 전달 중..." : "마음 담아 추천서 제출하기"}
        </button>
      </div>
    </form>
  );
}
