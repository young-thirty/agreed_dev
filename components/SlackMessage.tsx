import type { SlackMessage } from '@/core/slack/types';

// 채널 목록과 스레드 답글이 같은 모양으로 메시지를 그리므로 컴포넌트를 공유한다.

export function formatSlackTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SlackMessageItem({ message }: { message: SlackMessage }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{message.userName}</span>
        <span className="text-xs text-ink-muted">{formatSlackTime(message.sentAt)}</span>
      </div>

      {message.text !== '' && <p className="text-sm text-ink-muted">{message.text}</p>}

      {message.files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.files.map((file) =>
            file.isImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- 우리 서버가 인증해서 흘려주는 프록시 주소라 next/image 최적화 대상이 아니다
              <img
                key={file.id}
                src={file.url}
                alt={file.name}
                className="max-h-48 rounded-md border border-line object-contain"
              />
            ) : (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-line px-2 py-1 text-xs hover:bg-paper"
              >
                📎 {file.name}
              </a>
            ),
          )}
        </div>
      )}
    </div>
  );
}
