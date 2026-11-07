import { NextRequest, NextResponse } from "next/server";
import {
  deleteRecommendationById,
  getGroupedRecommendations,
  renameOrMergeNominee,
} from "@/lib/storage";

/**
 * 왜 서버 측에서 관리자 비밀번호를 검증하는가:
 * 클라이언트 코드에 비밀번호를 하드코딩하면 브라우저 개발자 도구로 노출될 수 있으므로,
 * 환경변수(process.env.ADMIN_PASSWORD)를 통해 서버에서만 안전하게 대조하기 위함입니다.
 */
function verifyAdminPassword(inputPassword?: string): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD || "2027haneul";
  return inputPassword === expectedPassword;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, password, oldName, newName, id } = body;

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: "관리자 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // 1. 로그인 검증 및 전체 데이터 조회
    if (action === "login") {
      const groups = await getGroupedRecommendations();
      return NextResponse.json({ authenticated: true, groups });
    }

    // 2. 후보자 이름 수정 / 오타 통합(병합)
    if (action === "rename") {
      if (!oldName || !newName) {
        return NextResponse.json(
          { error: "기존 이름과 변경할 이름을 모두 입력해주세요." },
          { status: 400 }
        );
      }
      const updatedCount = await renameOrMergeNominee(oldName, newName);
      const groups = await getGroupedRecommendations();
      return NextResponse.json({
        message: `${updatedCount}건의 추천 대상자 이름이 '${newName}'(으)로 통합/변경되었습니다.`,
        groups,
      });
    }

    // 3. 특정 추천 항목 삭제
    if (action === "delete") {
      if (!id) {
        return NextResponse.json(
          { error: "삭제할 추천 항목 ID가 필요합니다." },
          { status: 400 }
        );
      }
      await deleteRecommendationById(id);
      const groups = await getGroupedRecommendations();
      return NextResponse.json({
        message: "해당 추천 내역이 삭제되었습니다.",
        groups,
      });
    }

    return NextResponse.json(
      { error: "지원하지 않는 관리자 요청입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[POST /api/admin Error]:", error);
    return NextResponse.json(
      { error: "관리자 작업 처리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
