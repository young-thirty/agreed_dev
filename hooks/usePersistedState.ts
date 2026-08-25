'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const PREFIX = 'agreed:';

/**
 * 선택 탭·워크스페이스처럼 유출돼도 무해한 화면 편의값만 localStorage에 저장한다.
 * 사용자·계약·대화·AI 결과·인증/연동 토큰에는 사용하지 않는다.
 *
 * 서버에는 localStorage가 없으므로 첫 렌더는 항상 initial 값으로 그린다.
 * 저장값은 마운트된 뒤에 불러와 덮어쓴다. 하이드레이션 불일치를 피하기 위한 순서다.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw !== null) {
      try {
        setValue(JSON.parse(raw) as T);
      } catch {
        // 저장된 값이 깨졌으면 초기값을 그대로 쓴다
      }
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    // 불러오기가 끝나기 전에 저장하면 초기값이 저장값을 덮어쓴다
    if (!loaded) return;
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }, [key, loaded, value]);

  return [value, setValue];
}

/**
 * 저장된 화면 선택값만 지우고 새로고침한다. 서버 데이터는 건드리지 않는다.
 */
export function useResetAll() {
  return useCallback(() => {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(PREFIX)) window.localStorage.removeItem(key);
    }
    window.location.reload();
  }, []);
}
