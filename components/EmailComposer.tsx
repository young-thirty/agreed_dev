'use client';

import { useState, type FormEvent } from 'react';
import { post } from '@/lib/api-client';

/** Gmail 연동이 실제로 도는지 확인하는 테스트용 발송 폼이다. */
export function EmailComposer() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setResult(null);

    const res = await post<{ sent: boolean }>('/api/email/send', { to, subject, body });
    setSending(false);

    if (!res.ok) {
      setResult(res.error);
      return;
    }
    setResult('메일을 보냈습니다.');
    setTo('');
    setSubject('');
    setBody('');
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
      <h2 className="text-lg font-semibold">테스트 메일 보내기</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="받는 사람 이메일"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="text"
          required
          placeholder="제목"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          required
          placeholder="본문"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending}
          className="self-start rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {sending ? '보내는 중…' : '보내기'}
        </button>
      </form>

      {result !== null && <p className="text-sm text-ink-muted">{result}</p>}
    </section>
  );
}
