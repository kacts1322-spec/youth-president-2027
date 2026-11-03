import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { NomineeGroup, Recommendation } from "@/types/recommendation";

/**
 * 왜 클라우드 DB(Supabase REST API)와 로컬 JSON 저장소를 함께 지원하는가:
 * Vercel과 같은 서버리스(Serverless) 배포 환경에서는 로컬 파일 시스템이 읽기 전용이거나
 * 일정 시간 후 초기화되므로, 배포 환경에서도 추천 데이터가 영구 보존되도록
 * 높은뜻 하늘교회 청년부 클라우드 DB(Supabase)에 실시간 저장합니다.
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://owxwzohjorpyqcsrpkrf.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_adJ6rM_5Tm56afk3p3iczA_kyJPTQsD";
const CLOUD_TAG = "PRESIDENT_2027_REC";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "recommendations.json");

/**
 * 왜 이름 정규화(Normalize) 함수를 거치는가:
 * 추천인이 '김하늘 ', '김 하늘'처럼 실수로 공백을 넣었을 때
 * 서로 다른 후보자로 분리되어 집계되는 리스크를 방지하기 위함입니다.
 */
export function normalizePersonName(rawName: string): string {
  return rawName.trim().replace(/\s+/g, "");
}

/**
 * 왜 후보자 이름 대신 HMAC-SHA256 기반 암호화 토큰을 생성하는가:
 * 만약 개별 편지 웹페이지 주소가 `/letters/김하늘` 형태라면, 누구나 주소창에 다른 청년의 이름을 입력해
 * 남의 추천 편지를 엿볼 수 있는 보안/프라이버시 문제가 발생합니다.
 * 서버만 알고 있는 비밀키(LETTER_TOKEN_SECRET)로 해싱한 22자리 난수형 토큰(예: `/letters/9fK2mP8xQ4vL7nR1wT5yZ3`)을
 * 부여하면, 이름을 알아도 URL을 절대 추측할 수 없으며 관리자가 공유해준 링크를 가진 본인만 열람할 수 있습니다.
 */
export function generateShareToken(nomineeName: string): string {
  const secret =
    process.env.LETTER_TOKEN_SECRET || "haneul_youth_2027_secret_salt_key_9981";
  const cleanName = normalizePersonName(nomineeName);
  return crypto
    .createHmac("sha256", secret)
    .update(`2027-letter:${cleanName}`)
    .digest("base64url")
    .slice(0, 22);
}

interface CloudRow {
  id: string;
  flagged_reason: string;
  note: string;
  created_at: string;
}

/**
 * 클라우드 DB(Supabase)에서 전체 추천 목록을 조회합니다.
 */
async function fetchFromCloud(): Promise<Recommendation[] | null> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/absence_flags?flagged_reason=eq.${CLOUD_TAG}&select=id,note,created_at&order=created_at.asc`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const rows: CloudRow[] = await res.json();

    const items: Recommendation[] = [];
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.note);
        items.push({
          id: row.id,
          nomineeName: normalizePersonName(parsed.nomineeName || ""),
          recommenderName: normalizePersonName(parsed.recommenderName || ""),
          reason: (parsed.reason || "").trim(),
          createdAt: parsed.createdAt || row.created_at,
        });
      } catch {
        // JSON 파싱 실패 행은 무시
      }
    }
    return items;
  } catch (error) {
    console.error("[Cloud DB Fetch Error]:", error);
    return null;
  }
}

/**
 * 로컬 백업 파일이 존재하는지 확인하고 없으면 생성합니다.
 */
async function ensureDataFileExists(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    } catch {
      // Vercel 서버리스 읽기 전용 환경에서는 파일 생성 실패를 무시하고 클라우드 DB를 사용합니다.
    }
  }
}

/**
 * 전체 추천 목록을 읽어옵니다 (클라우드 DB 우선, 오프라인 시 로컬 파일 폴백).
 */
export async function getAllRecommendations(): Promise<Recommendation[]> {
  const cloudItems = await fetchFromCloud();
  if (cloudItems !== null) {
    return cloudItems;
  }

  await ensureDataFileExists();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Recommendation[]) : [];
  } catch {
    return [];
  }
}

/**
 * 새로운 회장 추천서를 클라우드 DB에 저장합니다.
 */
export async function addRecommendation(input: {
  nomineeName: string;
  recommenderName: string;
  reason: string;
}): Promise<Recommendation> {
  const cleanNominee = normalizePersonName(input.nomineeName);
  const cleanRecommender = normalizePersonName(input.recommenderName);
  const cleanReason = input.reason.trim();

  if (!cleanNominee || !cleanRecommender || !cleanReason) {
    throw new Error("추천받는 분, 추천하시는 분, 추천 이유를 모두 입력해주세요.");
  }

  const createdAt = new Date().toISOString();
  const payloadNote = JSON.stringify({
    nomineeName: cleanNominee,
    recommenderName: cleanRecommender,
    reason: cleanReason,
    createdAt,
  });

  const url = `${SUPABASE_URL}/rest/v1/absence_flags`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      flagged_reason: CLOUD_TAG,
      note: payloadNote,
    }),
  });

  if (res.ok) {
    const inserted: CloudRow[] = await res.json();
    if (inserted && inserted[0]) {
      return {
        id: inserted[0].id,
        nomineeName: cleanNominee,
        recommenderName: cleanRecommender,
        reason: cleanReason,
        createdAt,
      };
    }
  }

  throw new Error("추천 데이터를 클라우드에 저장하는 중 오류가 발생했습니다.");
}

/**
 * 추천받은 사람별로 그룹화(Grouping)하여 반환합니다.
 */
export async function getGroupedRecommendations(): Promise<NomineeGroup[]> {
  const allItems = await getAllRecommendations();
  const groupMap = new Map<string, Recommendation[]>();

  for (const item of allItems) {
    const key = normalizePersonName(item.nomineeName);
    const existing = groupMap.get(key) || [];
    existing.push(item);
    groupMap.set(key, existing);
  }

  const groups: NomineeGroup[] = Array.from(groupMap.entries()).map(
    ([nomineeName, items]) => {
      const sortedItems = [...items].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const uniqueRecommenders = Array.from(
        new Set(sortedItems.map((i) => i.recommenderName))
      );

      return {
        nomineeName,
        shareToken: generateShareToken(nomineeName),
        totalCount: sortedItems.length,
        recommenders: uniqueRecommenders,
        items: sortedItems,
      };
    }
  );

  groups.sort((a, b) => {
    if (b.totalCount !== a.totalCount) {
      return b.totalCount - a.totalCount;
    }
    return a.nomineeName.localeCompare(b.nomineeName, "ko");
  });

  return groups;
}

/**
 * 암호화된 고유 공유 토큰(shareToken)으로만 특정 후보자의 추천 편지 데이터를 조회합니다.
 */
export async function getNomineeGroupByToken(
  token: string
): Promise<NomineeGroup | null> {
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  const groups = await getGroupedRecommendations();
  return groups.find((g) => g.shareToken === cleanToken) || null;
}

/**
 * 후보자 이름 일괄 수정(병합) 기능입니다.
 */
export async function renameOrMergeNominee(
  oldName: string,
  newName: string
): Promise<number> {
  const cleanOld = normalizePersonName(oldName);
  const cleanNew = normalizePersonName(newName);

  if (!cleanOld || !cleanNew) {
    throw new Error("변경할 이름을 정확히 입력해주세요.");
  }

  const allItems = await getAllRecommendations();
  const targets = allItems.filter(
    (item) => normalizePersonName(item.nomineeName) === cleanOld
  );

  for (const target of targets) {
    const updatedNote = JSON.stringify({
      nomineeName: cleanNew,
      recommenderName: target.recommenderName,
      reason: target.reason,
      createdAt: target.createdAt,
    });

    await fetch(`${SUPABASE_URL}/rest/v1/absence_flags?id=eq.${target.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note: updatedNote }),
    });
  }

  return targets.length;
}

/**
 * 특정 추천 항목 1건을 삭제합니다.
 */
export async function deleteRecommendationById(id: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/absence_flags?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.ok;
}

/**
 * 관리자 테스트 및 미리보기를 위한 예시(샘플) 추천 데이터를 생성합니다.
 */
export async function seedSampleRecommendations(): Promise<void> {
  const allItems = await getAllRecommendations();
  if (allItems.length > 0) {
    return;
  }

  const samples = [
    {
      nomineeName: "김하늘",
      recommenderName: "이은혜",
      reason:
        "언제나 따뜻한 미소로 새가족과 지체들의 이야기를 먼저 들어주시는 모습이 참 귀합니다. 2027년 높은뜻 하늘교회 청년부가 서로를 품어주는 따뜻한 공동체가 되는 데 가장 좋은 리더가 되어주실 것 같아 마음 담아 추천합니다.",
    },
    {
      nomineeName: "김하늘",
      recommenderName: "박찬양",
      reason:
        "보이지 않는 곳에서도 묵묵히 예배 준비와 섬김의 자리를 지키는 성실함에 늘 감동을 받습니다. 말보다 삶으로 신앙의 본을 보여주시는 하늘님이 내년 청년부를 이끌어주신다면 모두가 기쁜 마음으로 함께 동역할 수 있을 거예요!",
    },
    {
      nomineeName: "이소망",
      recommenderName: "최사랑",
      reason:
        "청년부 모임마다 밝은 에너지로 분위기를 살려주시고, 지친 청년들에게 먼저 다가와 안부를 물어봐 주시는 따뜻한 마음이 정말 감사합니다. 소망님의 섬김이 2027년 청년부에 큰 힘이 될 것 같습니다.",
    },
  ];

  for (const s of samples) {
    await addRecommendation(s);
  }
}
