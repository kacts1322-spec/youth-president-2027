import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "높은뜻 하늘교회 청년부 | 2027년 회장 추천",
  description:
    "2027년 높은뜻 하늘교회 청년부를 사랑과 섬김으로 이끌어갈 회장을 마음을 담아 추천해주세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 편지지의 따뜻한 명조/바탕 감성을 살리기 위해 Gowun Batang 및 Noto Sans KR 웹폰트 로드 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-amber-200 selection:text-amber-950">
        {children}
      </body>
    </html>
  );
}
