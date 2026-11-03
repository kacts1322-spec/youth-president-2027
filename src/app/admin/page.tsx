import React from "react";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata = {
  title: "관리자 페이지 | 높은뜻 하늘교회 청년부 2027 회장 추천",
};

/**
 * 관리자 전용 페이지 (/admin)
 * 후보자별 추천 인원, 추천인 명단, 추천 사유를 집계하고
 * 편지 형태의 이미지/PDF 출력 및 개별 웹페이지 링크를 제공합니다.
 */
export default function AdminPage() {
  return <AdminDashboard />;
}
