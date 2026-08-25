import { apiUrl } from '@/lib/api-client';
import type { SlackMessage } from '@/types/integrations';

export function formatSlackTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = { message: SlackMessage; teamId: string };

function fileUrl(teamId: string, fileId: string): string {
  const query = new URLSearchParams({ teamId, fileId });
  return apiUrl(`/api/slack/file?${query}`);
}

export function SlackMessageItem({ message, teamId }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-ink">{message.userName}</span>
        <span className="text-xs text-ink-faint">{formatSlackTime(message.sentAt)}</span>
      </div>

      {message.text !== '' && <p className="text-xs text-ink-faint">{message.text}</p>}

      {message.files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.files.map((file) => {
            const url = fileUrl(teamId, file.fileId);
            return file.isImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- 인증된 FastAPI 파일 프록시다
              <img
                key={file.fileId}
                src={url}
                alt={file.name}
                className="max-h-40 rounded-md border border-line object-contain"
              />
            ) : (
              <a
                key={file.fileId}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-line px-2 py-1 text-xs text-ink-muted hover:bg-paper"
              >
                📎 {file.name}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
