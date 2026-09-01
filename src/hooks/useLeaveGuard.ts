"use client";

import { useCallback, useEffect } from "react";

const MESSAGE = "저장하지 않은 변경 사항이 있습니다. 이 화면을 나가시겠습니까?";

/**
 * 변경 사항이 있는 상태로 이탈하려 할 때 확인한다 (TODO-16).
 * App Router에는 내비게이션을 막는 공식 API가 없어 세 경로를 각각 막아야 한다
 * (CLAUDE.md 9장):
 *   1. 새로고침 · 탭 닫기 · 주소창 직접 이동 → beforeunload
 *   2. 페이지 내 버튼(취소 등) → 반환된 confirmLeave()를 호출부가 직접 사용
 *   3. 브라우저 뒤로가기 → popstate + history.forward()로 되돌리기
 *
 * ⚠️ popstate/beforeunload 리스너는 컴포넌트 안이 아니라 모듈 스코프에서 앱 생애주기 동안
 * 단 한 번만 등록한다. 이 모듈은 TodoForm이 아니라 `app/providers.tsx`에서 import해
 * 앱 시작과 함께 항상 로드되게 한다 — 실측으로 확인한 두 가지 문제 때문이다.
 *   1. TodoForm의 useEffect 안에서 리스너를 등록하면, Next.js App Router도 같은
 *      popstate를 듣다가 자신의 라우트 전환을 동기적으로 실행해 TodoForm을 그 자리에서
 *      언마운트시킨다. 그 cleanup(removeEventListener)이 "같은 이벤트 디스패치 도중"
 *      실행되어, 우리 핸들러 차례가 오기도 전에 리스너 자체가 제거된다(dispatch 중
 *      제거된 리스너는 호출되지 않는 DOM 표준 동작).
 *   2. TodoForm이 처음 마운트될 때(사용자가 /todos/new 등으로 이동한 뒤)에야 이 모듈이
 *      로드되면, 이미 훨씬 이전에 등록된 Next.js router의 popstate 캡처 핸들러보다
 *      등록 순서가 뒤처진다. 뒤에 등록된 우리 핸들러는 실행 기회조차 얻지 못한다
 *      (해당 핸들러가 stopImmediatePropagation을 부르는 것으로 보인다).
 *   앱 최상위에서 항상 먼저 로드되게 하면 두 문제가 모두 해소된다.
 */
let globalIsDirty = false;
let ignoreNextPop = false;

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (!globalIsDirty) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // popstate는 브라우저가 이미 URL을 이전 페이지로 바꾼 "뒤"에 발생한다.
  // 취소하려면 history.forward()로 원래 페이지로 되돌아가는데, forward() 자체도 새
  // popstate를 일으키므로 그 한 번은 가드 로직 없이 그냥 지나치도록 플래그로 무시한다.
  window.addEventListener(
    "popstate",
    (e) => {
      if (ignoreNextPop) {
        ignoreNextPop = false;
        return;
      }
      if (!globalIsDirty) return; // dirty가 아니면 이미 일어난 이동을 그대로 둔다
      if (!window.confirm(MESSAGE)) {
        // Next.js App Router도 같은 popstate를 듣고 새 라우트를 렌더링하려 한다.
        // 캡처 단계에서 먼저 받아 stopImmediatePropagation으로 그 처리 자체를 막아야
        // "취소"가 화면 전환 없이 실제로 제자리에 머무는 것으로 이어진다.
        e.stopImmediatePropagation();
        ignoreNextPop = true;
        window.history.forward();
      }
      // 확인(나가기)이면 이미 이동이 끝난 상태라 추가로 할 일이 없다.
    },
    true, // capture: Next.js router의 popstate 핸들러보다 먼저 실행되도록
  );
}

export function useLeaveGuard(isDirty: boolean) {
  useEffect(() => {
    globalIsDirty = isDirty;
    return () => {
      globalIsDirty = false;
    };
  }, [isDirty]);

  const confirmLeave = useCallback(() => {
    return !globalIsDirty || window.confirm(MESSAGE);
  }, []);

  return { confirmLeave };
}
