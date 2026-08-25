'use client';

// 이메일 주소와 저장소를 등록하는 한 칸짜리 폼. 이름은 입력값을 그대로 쓴다.

import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/Button';

const INPUT_CLASS =
  'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:bg-surface focus:outline-3 focus:outline-accent-soft';

export function ChannelTextForm({
  channel,
  value,
  onChange,
  busy,
  gmail,
  onCancel,
  onSubmit,
}: {
  channel: 'GMAIL' | 'GITHUB';
  value: string;
  onChange: (next: string) => void;
  busy: boolean;
  gmail: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const isEmail = channel === 'GMAIL';
  const trimmed = value.trim();
  // 저장소는 owner/repo 형식이어야 서버가 받는다. 보내기 전에 여기서 막는다.
  const ready = isEmail ? trimmed.includes('@') : trimmed.split('/').length === 2;

  if (isEmail && gmail === null) {
    return (
      <p className="text-xs text-ink-faint">
        Gmail이 아직 연결되지 않았습니다.{' '}
        <Link href="/settings" className="text-accent hover:underline">
          설정
        </Link>
        에서 연결한 뒤 주소를 등록할 수 있습니다.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy) onSubmit();
      }}
      className="flex flex-col gap-2"
    >
      <input
        aria-label={isEmail ? '고객 이메일 주소' : '저장소 이름'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isEmail ? 'client@example.com' : 'owner/repo'}
        className={INPUT_CLASS}
      />
      <p className="text-xs text-ink-faint">
        {isEmail
          ? `${gmail} 계정으로 이 주소와 주고받은 메일을 읽습니다.`
          : '공개 저장소이거나 서버에 권한이 있는 저장소여야 읽습니다.'}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" type="submit" disabled={!ready || busy}>
          {busy ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" />
              등록하는 중…
            </>
          ) : (
            '등록'
          )}
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={onCancel} disabled={busy}>
          취소
        </Button>
      </div>
    </form>
  );
}
