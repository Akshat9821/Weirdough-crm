import { avatarColor, initials } from '../../lib/format';

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const c = avatarColor(name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-medium"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.33,
        background: c.bg,
        color: c.text,
      }}
    >
      {initials(name)}
    </div>
  );
}
