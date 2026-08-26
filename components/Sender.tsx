// 메시지를 보낸 사람. 한 티켓에 여러 명이 섞여도 누가 쓴 글인지 갈라 보이게 한다.

/** 아바타 색. 주소로 골라서 같은 사람은 화면 어디서나 같은 색을 갖는다. */
const AVATAR = [
  'bg-avatar-1 text-avatar-1-ink',
  'bg-avatar-2 text-avatar-2-ink',
  'bg-avatar-3 text-avatar-3-ink',
  'bg-avatar-4 text-avatar-4-ink',
] as const;

function colorOf(key: string): string {
  let sum = 0;
  for (const char of key) sum += char.charCodeAt(0);
  return AVATAR[sum % AVATAR.length];
}

/** 이름 첫 글자. 이름이 없으면 메일 주소의 첫 글자를 쓴다. */
function initialOf(name: string, email: string): string {
  const source = name.trim() !== '' ? name.trim() : email;
  return source.slice(0, 1).toUpperCase();
}

export function SenderAvatar({ name, email }: { name: string; email: string }) {
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${colorOf(email)}`}
    >
      {initialOf(name, email)}
    </span>
  );
}

/** 아바타 + 이름 + 주소. 이름과 주소가 같이 있어야 동명이인을 가른다. */
export function Sender({ name, email }: { name: string; email: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <SenderAvatar name={name} email={email} />
      <span className="min-w-0 truncate">
        {name !== '' && <span className="font-medium text-ink">{name}</span>}
        {email !== '' && <span className="ml-1.5 text-ink-faint">{email}</span>}
      </span>
    </span>
  );
}
