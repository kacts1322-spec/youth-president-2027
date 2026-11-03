import { NextRequest, NextResponse } from "next/server";
import {
  addRecommendation,
  getNomineeGroupByToken,
} from "@/lib/storage";

/**
 * [GET] 추천 편지 데이터 단건 조회 API (개별 웹페이지 전용)
 * - 왜 전체 목록 조회를 막고 암호화 토큰(`token`) 파라미터만 허용하는가:
 *   일반 사용자가 API를 호출해 전체 후보자 명단이나 타인의 편지를 열람하는 것을 차단하고,
 *   암호화된 공유 토큰을 가진 경우에만 해당 후보자의 편지를 반환하기 위함입니다.
 *   (전체 목록 조회는 관리자 비밀번호 검증을 거치는 `/api/admin`에서만 수행됩니다.)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "유효한 편지 보안 토큰이 필요합니다." },
        { status: 400 }
      );
    }

    const group = await getNomineeGroupByToken(token);

    if (!group) {
      return NextResponse.json(
        { error: "해당 보안 링크에 일치하는 편지 내역을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    return NextResponse.json({ group });
  } catch (error) {
    console.error("[GET /api/recommendations Error]:", error);
    return NextResponse.json(
      { error: "데이터를 불러오는 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * [POST] 새로운 회장 추천서 등록 API
 * - 일반 청년이 메인 페이지에서 작성한 추천 내용을 검증 후 저장합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nomineeName, recommenderName, reason } = body;

    // 1. 필수 입력값 검증
    if (
      typeof nomineeName !== "string" ||
      typeof recommenderName !== "string" ||
      typeof reason !== "string" ||
      !nomineeName.trim() ||
      !recommenderName.trim() ||
      !reason.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "추천하시는 회장 후보자 성함, 본인 성함, 추천 이유를 모두 작성해주세요.",
        },
        { status: 400 }
      );
    }

    // 2. 너무 짧은 추천 사유 방지 (진심 어린 편지가 될 수 있도록 최소 안내)
    if (reason.trim().length < 5) {
      return NextResponse.json(
        {
          error:
            "추천 이유가 후보자에게 따뜻한 편지로 전달됩니다. 5자 이상 정성껏 작성해주시면 감사하겠습니다.",
        },
        { status: 400 }
      );
    }

    const created = await addRecommendation({
      nomineeName,
      recommenderName,
      reason,
    });

    return NextResponse.json(
      {
        message: "소중한 추천이 정상적으로 접수되었습니다.",
        recommendation: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/recommendations Error]:", error);
    const message =
      error instanceof Error
        ? error.message
        : "추천서 저장 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
