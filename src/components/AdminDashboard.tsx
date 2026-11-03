"use client";

import React, { useState, useEffect, useCallback } from "react";
import { NomineeGroup } from "@/types/recommendation";
import LetterView from "@/components/LetterView";
import {
  Lock,
  Users,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit3,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  FileText,
  ListFilter,
} from "lucide-react";
import Link from "next/link";

const ADMIN_SESSION_KEY = "youth_2027_admin_pw";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [groups, setGroups] = useState<NomineeGroup[]>([]);
  const [selectedNomineeName, setSelectedNomineeName] = useState<string | null>(
    null
  );
  // 상세 보기 모드: 'letter' (편지 이미지/PDF 출력 뷰) | 'table' (관리자 상세 목록 및 이름 통합 관리 뷰)
  const [viewMode, setViewMode] = useState<"letter" | "table">("letter");

  // 후보자 이름 수정/통합 모달 상태
  const [isRenaming, setIsRenaming] = useState(false);
  const [newNomineeNameInput, setNewNomineeNameInput] = useState("");
  const [copiedNominee, setCopiedNominee] = useState<string | null>(null);

  /**
   * 서버에 관리자 비밀번호로 데이터 조회를 요청합니다.
   */
  const fetchAdminData = useCallback(async (pw: string) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password: pw }),
      });

      const data = await res.json();
      if (!res.ok) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setIsAuthenticated(false);
        setAuthError(data.error || "비밀번호가 올바르지 않습니다.");
        return;
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, pw);
      setIsAuthenticated(true);
      const fetchedGroups: NomineeGroup[] = data.groups || [];
      setGroups(fetchedGroups);

      if (fetchedGroups.length > 0) {
        setSelectedNomineeName((prev) => {
          const stillExists = fetchedGroups.some((g) => g.nomineeName === prev);
          return stillExists ? prev : fetchedGroups[0].nomineeName;
        });
      } else {
        setSelectedNomineeName(null);
      }
    } catch {
      setAuthError("서버와 통신하는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 페이지 진입 시 세션에 저장된 비밀번호가 있으면 자동 로그인 시도
  useEffect(() => {
    const savedPw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (savedPw) {
      setPassword(savedPw);
      fetchAdminData(savedPw);
    }
  }, [fetchAdminData]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError("관리자 비밀번호를 입력해주세요.");
      return;
    }
    fetchAdminData(password.trim());
  };

  /**
   * 예시(샘플) 추천 데이터를 생성하여 편지 디자인 및 PDF 출력을 즉시 테스트할 수 있게 합니다.
   */
  const handleSeedSample = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed", password }),
      });
      const data = await res.json();
      if (res.ok && data.groups) {
        setGroups(data.groups);
        if (data.groups.length > 0) {
          setSelectedNomineeName(data.groups[0].nomineeName);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 오타 등으로 분리된 후보자 이름을 수정하거나 다른 후보자 이름으로 병합합니다.
   */
  const handleRenameNominee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNomineeName || !newNomineeNameInput.trim()) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename",
          password,
          oldName: selectedNomineeName,
          newName: newNomineeNameInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.groups) {
        setGroups(data.groups);
        setSelectedNomineeName(newNomineeNameInput.trim().replace(/\s+/g, ""));
        setIsRenaming(false);
        setNewNomineeNameInput("");
      } else {
        alert(data.error || "이름 변경에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 특정 추천 항목 1건을 삭제합니다.
   */
  const handleDeleteItem = async (id: string) => {
    if (!confirm("이 추천 내역을 정말 삭제하시겠습니까?")) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", password, id }),
      });
      const data = await res.json();
      if (res.ok && data.groups) {
        setGroups(data.groups);
        if (data.groups.length > 0) {
          const stillExists = data.groups.some(
            (g: NomineeGroup) => g.nomineeName === selectedNomineeName
          );
          if (!stillExists) {
            setSelectedNomineeName(data.groups[0].nomineeName);
          }
        } else {
          setSelectedNomineeName(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyIndividualUrl = async (group: NomineeGroup) => {
    const url = `${window.location.origin}/letters/${group.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedNominee(group.nomineeName);
    setTimeout(() => setCopiedNominee(null), 2000);
  };

  const selectedGroup =
    groups.find((g) => g.nomineeName === selectedNomineeName) || null;

  const totalRecommendationsCount = groups.reduce(
    (sum, g) => sum + g.totalCount,
    0
  );

  // 1. 로그인 전 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-amber-200/80 rounded-3xl p-8 sm:p-10 shadow-xl max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-letter text-2xl font-bold text-center text-stone-900 mb-2">
            관리자 페이지 접속
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 text-center mb-6">
            높은뜻 하늘교회 청년부 2027년 회장 추천 현황 및 편지 출력 관리
          </p>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="adminPw"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                관리자 비밀번호
              </label>
              <input
                id="adminPw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요 (기본값: 2027haneul)"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-700 text-sm"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-sm transition cursor-pointer"
            >
              {isLoading ? "확인 중..." : "관리자 대시보드 입장"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              추천 작성 메인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. 로그인 후 관리자 대시보드 화면
  return (
    <div className="min-h-screen pb-16">
      {/* 상단 관리자 네비게이션 바 (인쇄 시 숨김) */}
      <header className="no-print bg-white border-b border-stone-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              추천 폼 보기
            </Link>
            <div>
              <h1 className="font-letter text-lg sm:text-xl font-bold text-stone-900">
                2027 청년부 회장 추천 관리자 페이지
              </h1>
              <p className="text-xs text-stone-500">
                추천받은 사람별 집계 · 추천인 및 사유 확인 · 편지 PDF 및 개별 웹페이지 생성
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-xl text-xs text-amber-950">
              <Users className="w-4 h-4 text-amber-700" />
              <span>
                추천 후보자 <strong>{groups.length}명</strong>
              </span>
              <span className="text-amber-300">|</span>
              <Mail className="w-4 h-4 text-amber-700" />
              <span>
                총 추천 편지 <strong>{totalRecommendationsCount}건</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => fetchAdminData(password)}
              className="p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {groups.length === 0 ? (
          <div className="no-print bg-white border border-stone-200 rounded-3xl p-12 text-center max-w-xl mx-auto my-12 shadow-xs">
            <Mail className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h2 className="font-letter text-xl font-bold text-stone-800 mb-2">
              아직 접수된 회장 추천서가 없습니다
            </h2>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              청년들이 메인 페이지에서 추천서를 제출하면 이곳에 후보자별로 자동 분류되어 표시됩니다.
              <br />
              편지 출력 및 개별 웹페이지 기능을 미리 확인해보시려면 아래 버튼으로 예시 데이터를 생성해보세요!
            </p>
            <button
              type="button"
              onClick={handleSeedSample}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-semibold hover:bg-amber-900 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              예시 추천 데이터로 편지 미리보기 체험
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 좌측 사이드바: 추천받은 사람(후보자)별 목록 (인쇄 시 숨김) */}
            <aside className="no-print lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1 mb-2">
                <h2 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-800" />
                  추천받은 사람별 목록 ({groups.length}명)
                </h2>
                <span className="text-xs text-stone-500">추천 많은 순</span>
              </div>

              {groups.map((group) => {
                const isSelected = group.nomineeName === selectedNomineeName;
                const pagePath = `/letters/${group.shareToken}`;

                return (
                  <div
                    key={group.nomineeName}
                    onClick={() => {
                      setSelectedNomineeName(group.nomineeName);
                      setIsRenaming(false);
                    }}
                    className={`rounded-2xl p-4 border transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-50/90 border-amber-600 shadow-sm ring-2 ring-amber-600/20"
                        : "bg-white border-stone-200/90 hover:border-amber-300 hover:bg-stone-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-letter text-lg font-bold text-stone-900">
                          {group.nomineeName}
                        </span>
                        <span className="ml-1.5 text-xs text-stone-500">후보</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isSelected
                            ? "bg-amber-800 text-white"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        총 {group.totalCount}명 추천
                      </span>
                    </div>

                    {/* 추천인 누구인지 요약 표시 */}
                    <div className="text-xs text-stone-600 mb-3 leading-relaxed">
                      <span className="font-semibold text-stone-700">추천인: </span>
                      {group.recommenders.join(", ")}
                    </div>

                    {/* 후보자별 개별 웹페이지 바로가기 & 링크 복사 버튼 */}
                    <div
                      className="pt-2.5 border-t border-stone-200/60 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={pagePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        개별 편지 웹페이지 열기
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyIndividualUrl(group)}
                        className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-2.5 py-1 rounded-lg cursor-pointer"
                        title={`보안 토큰 링크: /letters/${group.shareToken}`}
                      >
                        {copiedNominee === group.nomineeName ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            보안링크 복사됨
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            보안링크 복사
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </aside>

            {/* 우측 메인 영역: 선택된 후보자의 편지 출력 뷰 및 상세 내역 */}
            <section className="lg:col-span-8">
              {selectedGroup && (
                <div>
                  {/* 상단 탭 전환 및 후보자 관리 헤더 (인쇄 시 숨김) */}
                  <div className="no-print bg-white border border-stone-200/90 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode("letter")}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          viewMode === "letter"
                            ? "bg-amber-800 text-white shadow-xs"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        편지 이미지 / PDF 출력 뷰
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          viewMode === "table"
                            ? "bg-amber-800 text-white shadow-xs"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                        추천인별 상세 관리 ({selectedGroup.totalCount}건)
                      </button>
                    </div>

                    {/* 이름 오타 수정 / 다른 후보자와 병합 버튼 */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRenaming((prev) => !prev);
                        setNewNomineeNameInput(selectedGroup.nomineeName);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-amber-900 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      후보자 이름 수정/통합
                    </button>
                  </div>

                  {/* 후보자 이름 수정/통합 입력 폼 */}
                  {isRenaming && (
                    <form
                      onSubmit={handleRenameNominee}
                      className="no-print mb-6 bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="text-xs text-amber-950">
                        <strong>&lsquo;{selectedGroup.nomineeName}&rsquo;</strong> 후보의 이름을
                        변경합니다. (이미 존재하는 후보자 이름으로 변경 시 두 후보의 편지가 하나로 합쳐집니다)
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newNomineeNameInput}
                          onChange={(e) => setNewNomineeNameInput(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-sm text-stone-900"
                          placeholder="변경할 이름 입력"
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-bold hover:bg-amber-900 cursor-pointer"
                        >
                          적용
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRenaming(false)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 text-xs cursor-pointer"
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 탭 1: 편지 이미지 및 PDF 출력 뷰 */}
                  {viewMode === "letter" ? (
                    <LetterView group={selectedGroup} isAdminMode={true} />
                  ) : (
                    /* 탭 2: 관리자용 추천인별 상세 테이블 뷰 */
                    <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                      <div className="mb-6 pb-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="font-letter text-xl font-bold text-stone-900">
                            {selectedGroup.nomineeName} 후보 추천 상세 내역
                          </h3>
                          <p className="text-xs text-stone-500 mt-1">
                            총 {selectedGroup.totalCount}건의 추천 · 추천인:{" "}
                            <strong className="text-stone-700">
                              {selectedGroup.recommenders.join(", ")}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedGroup.items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="p-5 rounded-2xl bg-stone-50/80 border border-stone-200/80 flex items-start justify-between gap-4"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2.5">
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                                  #{idx + 1}
                                </span>
                                <span className="font-bold text-sm text-stone-900">
                                  추천인: {item.recommenderName}
                                </span>
                                <span className="text-xs text-stone-400">
                                  {new Date(item.createdAt).toLocaleString("ko-KR")}
                                </span>
                              </div>
                              <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed pl-1">
                                {item.reason}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                              title="이 추천 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
