"use client";

import React, { useState } from "react";
import { NomineeGroup } from "@/types/recommendation";
import {
  Printer,
  Download,
  Share2,
  Check,
  Sparkles,
  Heart,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

interface LetterViewProps {
  /** 추천받은 후보자의 그룹화된 추천 데이터 */
  group: NomineeGroup;
  /** 관리자 페이지 내부에서 열렸는지 여부 (개별 웹페이지 새창 열기 버튼 및 익명 토글 노출 제어) */
  isAdminMode?: boolean;
}

/**
 * 왜 Canvas 기반 이미지 생성 함수를 직접 구현했는가:
 * 외부 스크린샷 라이브러리가 최신 CSS(oklch 등)에서 오류를 일으키는 문제를 원천 차단하고,
 * 카카오톡 등으로 바로 전달할 수 있는 고해상도 '편지지 이미지(PNG)'를 언제나 깨짐 없이 생성하기 위함입니다.
 */
async function generateLetterImagePng(
  group: NomineeGroup,
  showRecommenderName: boolean
): Promise<string> {
  const scale = 2; // 레티나 고해상도 출력
  const width = 820;
  const paddingX = 64;
  const contentWidth = width - paddingX * 2;

  // 임시 캔버스로 줄바꿈 높이 계산
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d")!;

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    font: string
  ): string[] => {
    ctx.font = font;
    const paragraphs = text.split("\n");
    const lines: string[] = [];

    for (const para of paragraphs) {
      if (!para.trim()) {
        lines.push("");
        continue;
      }
      let currentLine = "";
      for (const char of para) {
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== "") {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
    }
    return lines;
  };

  const bodyFont = '18px "Gowun Batang", "Noto Serif KR", Georgia, serif';
  const itemBlocks = group.items.map((item, idx) => {
    const lines = wrapText(tempCtx, item.reason, contentWidth - 64, bodyFont);
    const senderText = showRecommenderName
      ? `From. ${item.recommenderName}`
      : `From. 동역자 ${idx + 1}`;
    // 상단 패딩(28) + 줄수 * 32 + 서명 영역(44) + 하단 패딩(24)
    const blockHeight = 28 + lines.length * 32 + 44 + 24;
    return { lines, senderText, blockHeight };
  });

  const totalItemsHeight = itemBlocks.reduce(
    (acc, cur) => acc + cur.blockHeight + 24,
    0
  );
  const headerHeight = 260;
  const footerHeight = 160;
  const totalHeight = headerHeight + totalItemsHeight + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // 1. 편지지 배경색 및 외곽 프레임
  ctx.fillStyle = "#fffdf9";
  ctx.fillRect(0, 0, width, totalHeight);

  // 바깥 장식 테두리
  ctx.strokeStyle = "#d6c5ad";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, totalHeight - 48);

  ctx.strokeStyle = "#ebe0cf";
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, width - 60, totalHeight - 60);

  // 2. 상단 인장(Wax Seal) 배지
  const centerX = width / 2;
  ctx.fillStyle = "#8c3b2b";
  ctx.beginPath();
  ctx.arc(centerX, 78, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#d4a373";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, 78, 23, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#fffdf9";
  ctx.font = 'bold 12px "Gowun Batang", serif';
  ctx.textAlign = "center";
  ctx.fillText("2027", centerX, 83);

  // 3. 상단 교회명 및 후보자 이름(단독 표기)
  ctx.fillStyle = "#8c6d46";
  ctx.font = '600 13px "Noto Sans KR", sans-serif';
  ctx.fillText("높은뜻 하늘교회 청년부 · 2027년 회장 추천 편지", centerX, 130);

  ctx.fillStyle = "#2c221e";
  ctx.font = 'bold 30px "Gowun Batang", serif';
  ctx.fillText(group.nomineeName, centerX, 174);

  ctx.fillStyle = "#5c4b3c";
  ctx.font = '15px "Gowun Batang", serif';
  const introText = `청년들이 2027년 청년부 회장 후보로 ${group.nomineeName} 님을 추천했습니다. 추천 사유를 전해드려요!`;
  ctx.fillText(introText, centerX, 212);

  // 구분선
  ctx.strokeStyle = "#e2d5c1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, 236);
  ctx.lineTo(width - paddingX, 236);
  ctx.stroke();

  // 4. 각 추천인 편지 블록 렌더링
  let currentY = headerHeight;
  ctx.textAlign = "left";

  itemBlocks.forEach((block, idx) => {
    // 카드 배경
    ctx.fillStyle = "#faf5ec";
    ctx.strokeStyle = "#e6dac6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(paddingX, currentY, contentWidth, block.blockHeight, 12);
    ctx.fill();
    ctx.stroke();

    // 번호 장식
    ctx.fillStyle = "#9c7a52";
    ctx.font = 'bold 13px "Gowun Batang", serif';
    ctx.fillText(
      `Letter ${String(idx + 1).padStart(2, "0")}`,
      paddingX + 28,
      currentY + 28
    );

    // 줄 노트 선 및 텍스트 출력
    ctx.font = bodyFont;
    ctx.fillStyle = "#332922";
    let lineY = currentY + 60;

    for (const line of block.lines) {
      // 밑줄 (줄노트 효과)
      ctx.strokeStyle = "rgba(210, 193, 170, 0.45)";
      ctx.beginPath();
      ctx.moveTo(paddingX + 28, lineY + 7);
      ctx.lineTo(width - paddingX - 28, lineY + 7);
      ctx.stroke();

      ctx.fillText(line, paddingX + 32, lineY);
      lineY += 32;
    }

    // 추천인 서명 (우측 정렬: 'From. 이름')
    ctx.textAlign = "right";
    ctx.fillStyle = "#6b4f35";
    ctx.font = 'bold 16px "Gowun Batang", serif';
    ctx.fillText(
      block.senderText,
      width - paddingX - 28,
      currentY + block.blockHeight - 22
    );
    ctx.textAlign = "left";

    currentY += block.blockHeight + 24;
  });

  // 5. 하단 말씀 및 맺음말
  ctx.textAlign = "center";
  ctx.fillStyle = "#6e5a49";
  ctx.font = '14px "Gowun Batang", serif';
  ctx.fillText(
    "“몸이 하나이요 성령이 하나이니 이와 같이 너희가 부르심의 한 소망 안에서 부르심을 입었느니라 (에베소서 4:4)”",
    centerX,
    currentY + 30
  );

  ctx.fillStyle = "#5c4b3c";
  ctx.font = '15px "Gowun Batang", serif';
  ctx.fillText(
    "부르심의 한 소망 안에서 소중한 우리 청년공동체를 함께 세워갈 수 있기를 바랍니다.",
    centerX,
    currentY + 58
  );

  ctx.fillStyle = "#4a3b2c";
  ctx.font = 'bold 16px "Gowun Batang", serif';
  ctx.fillText("높은뜻 하늘교회 청년부", centerX, currentY + 94);

  return canvas.toDataURL("image/png");
}

export default function LetterView({
  group,
  isAdminMode = false,
}: LetterViewProps) {
  // 기본값: 요청사항에 따라 추천한 사람의 이름을 함께 표시 (필요시 토글 가능)
  const [showRecommenderName, setShowRecommenderName] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingImg, setIsDownloadingImg] = useState(false);

  const individualPageUrl = `/letters/${group.shareToken}`;

  /**
   * 브라우저 인쇄 기능을 호출하여 고화질 PDF 또는 프린터로 출력합니다.
   */
  const handlePrintPdf = () => {
    window.print();
  };

  /**
   * 편지를 고해상도 PNG 이미지 파일로 다운로드합니다.
   */
  const handleDownloadImage = async () => {
    try {
      setIsDownloadingImg(true);
      const dataUrl = await generateLetterImagePng(group, showRecommenderName);
      const link = document.createElement("a");
      link.download = `2027_높은뜻하늘교회_회장추천편지_${group.nomineeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("편지 이미지 생성 중 오류:", error);
      alert("이미지 생성 중 오류가 발생했습니다. PDF 인쇄 기능을 이용해주세요.");
    } finally {
      setIsDownloadingImg(false);
    }
  };

  /**
   * 후보자별 개별 웹페이지 주소를 클립보드에 복사합니다.
   */
  const handleCopyShareLink = async () => {
    try {
      const fullUrl = `${window.location.origin}${individualPageUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert("링크 복사에 실패했습니다. 주소창의 URL을 직접 복사해주세요.");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 상단 액션 컨트롤 바 (인쇄/PDF 출력 시에는 .no-print 클래스에 의해 자동 숨김) */}
      <div className="no-print mb-6 bg-white/90 backdrop-blur-sm border border-amber-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>{group.nomineeName}</strong> 추천 편지 ({group.totalCount}통)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 추천인 실명 표시 여부 토글 버튼 */}
          <button
            type="button"
            onClick={() => setShowRecommenderName((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            title="편지에 추천한 사람의 이름을 표시할지 여부를 전환합니다"
          >
            {showRecommenderName ? (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-700" />
                추천인 실명 표시 중
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                익명으로 표시 중
              </>
            )}
          </button>

          {/* 개별 웹페이지 링크 복사 */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                개별 웹페이지 링크 복사됨!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                개별 웹페이지 링크 복사
              </>
            )}
          </button>

          {/* 관리자 모드일 때 개별 웹페이지 새 창에서 열기 버튼 */}
          {isAdminMode && (
            <a
              href={individualPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              개별 웹페이지 열기
            </a>
          )}

          {/* 편지 이미지(PNG) 저장 버튼 */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloadingImg}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-800 text-white hover:bg-stone-900 disabled:opacity-50 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloadingImg ? "이미지 생성 중..." : "편지 이미지(PNG) 저장"}
          </button>

          {/* PDF 출력 / 저장 버튼 */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-800 text-white hover:bg-amber-900 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            PDF 저장 / 인쇄
          </button>
        </div>
      </div>

      {/* 실제 편지지 영역 (화면 및 PDF 인쇄 대상) */}
      <article className="letter-paper relative rounded-3xl p-6 sm:p-12 md:p-16 border border-amber-200/70">
        {/* 편지지 안쪽 클래식 이중 테두리 장식 */}
        <div className="pointer-events-none absolute inset-3 sm:inset-5 border border-amber-900/15 rounded-2xl" />
        <div className="pointer-events-none absolute inset-4 sm:inset-6 border border-amber-900/10 rounded-xl" />

        <div className="relative z-10">
          {/* 상단 실링 왁스(인장) 아이콘 및 후보자 이름 */}
          <header className="text-center mb-10">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[#9e3f2e] to-[#6e2417] shadow-md flex flex-col items-center justify-center border-2 border-amber-300/60 text-amber-50">
              <Heart className="w-4 h-4 fill-amber-100/90 text-amber-100 mb-0.5" />
              <span className="font-letter text-[11px] font-bold tracking-widest">
                2027
              </span>
            </div>

            <p className="text-xs sm:text-sm tracking-[0.2em] uppercase text-amber-900/70 font-semibold mb-2">
              높은뜻 하늘교회 청년부 · 2027년 회장 추천 편지
            </p>

            {/* 1. 수식어 없이 후보자 이름만 깔끔하게 표시 */}
            <h1 className="font-letter text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mt-2 mb-4 leading-snug">
              {group.nomineeName}
            </h1>

            {/* 2. 간결한 추천 안내 문구 (하단 추천인 목록 배지는 제거) */}
            <p className="font-letter text-sm sm:text-base text-stone-600 max-w-xl mx-auto leading-relaxed mt-3">
              청년들이 2027년 청년부 회장 후보로{" "}
              <strong className="text-stone-800">{group.nomineeName}</strong> 님을
              추천했습니다. 추천 사유를 전해드려요!
            </p>
          </header>

          <hr className="border-amber-900/15 mb-8" />

          {/* 추천 사유 편지 본문 리스트 */}
          <div className="space-y-6">
            {group.items.map((item, index) => (
              <section
                key={item.id}
                className="print-avoid-break bg-[#faf5ec]/85 border border-[#e5d9c5] rounded-2xl p-6 sm:p-8 shadow-2xs relative"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-letter text-xs font-bold tracking-wider text-amber-800/80 uppercase">
                    Letter {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* 줄 노트 스타일 추천 이유 본문 */}
                <div className="letter-lined-block font-letter text-base sm:text-[17px] text-stone-800 whitespace-pre-wrap leading-[32px] pt-1">
                  {item.reason}
                </div>

                {/* 3. 추천한 사람 서명 ('드림' 없이 'From. 이름'만 간결하게 표시) */}
                <div className="mt-5 pt-2 flex justify-end items-center">
                  <p className="font-letter text-sm sm:text-base font-bold text-amber-950 bg-amber-100/60 px-3.5 py-1 rounded-full border border-amber-200/60">
                    {showRecommenderName
                      ? `From. ${item.recommenderName}`
                      : `From. 동역자 ${index + 1}`}
                  </p>
                </div>
              </section>
            ))}
          </div>

          {/* 4. 편지 하단 에베소서 4:4 말씀 및 맺음말 */}
          <footer className="mt-12 pt-8 border-t border-amber-900/15 text-center font-letter">
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-4">
              &ldquo;몸이 하나이요 성령이 하나이니 이와 같이 너희가 부르심의 한 소망 안에서
              부르심을 입었느니라 (에베소서 4:4)&rdquo;
              <br />
              부르심의 한 소망 안에서 소중한 우리 청년공동체를 함께 세워갈 수 있기를 바랍니다.
            </p>
            <p className="text-base sm:text-lg font-bold text-stone-900 mt-4">
              높은뜻 하늘교회 청년부
            </p>
          </footer>
        </div>
      </article>

      {/* 하단 PDF 인쇄 안내 팁 */}
      <p className="no-print text-center text-xs text-stone-500 mt-4">
        💡 <strong>PDF 저장 안내:</strong> 상단의 <strong>[PDF 저장 / 인쇄]</strong> 버튼을 누른 뒤,
        프린터(대상)를 <strong>&lsquo;PDF로 저장(Save as PDF)&rsquo;</strong>으로 선택하시면 깔끔한 A4 편지 문서로 저장됩니다.
      </p>
    </div>
  );
}
