/**
 * 추천 데이터 및 후보자별 그룹화를 위한 타입 정의 파일입니다.
 * 왜 분리했는가: 프론트엔드(컴포넌트)와 백엔드(API/저장소)가 동일한 데이터 규격을 공유하여
 * 타입 불일치로 인한 런타임 버그를 예방하기 위함입니다.
 */

export interface Recommendation {
  /** 각 추천 항목의 고유 식별자 (UUID 형식) */
  id: string;
  /** 회장으로 추천받는 사람(후보자)의 이름 */
  nomineeName: string;
  /** 추천을 작성한 사람의 이름 */
  recommenderName: string;
  /** 추천하는 구체적인 이유 및 응원 메시지 */
  reason: string;
  /** 추천서 작성 일시 (ISO 문자열) */
  createdAt: string;
}

export interface NomineeGroup {
  /** 추천받은 사람(후보자) 이름 */
  nomineeName: string;
  /**
   * 왜 이름 대신 암호화된 고유 토큰(shareToken)을 사용하는가:
   * URL에 후보자 이름(/letters/김하늘)을 그대로 쓰면 타인이 주소창에 이름을 입력해
   * 다른 후보자의 추천 편지를 몰래 열람할 수 있는 프라이버시 리스크가 있기 때문입니다.
   * 서버 시크릿 키 기반 HMAC-SHA256 해시 토큰을 사용하여 링크를 전달받은 본인만 열람할 수 있게 보호합니다.
   */
  shareToken: string;
  /** 해당 후보자를 추천한 총 인원수 (추천 건수) */
  totalCount: number;
  /** 추천한 사람들의 이름 목록 (중복 제거) */
  recommenders: string[];
  /** 해당 후보자에게 작성된 개별 추천 상세 내역 배열 */
  items: Recommendation[];
}
