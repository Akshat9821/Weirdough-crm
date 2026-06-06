import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST = 'Asia/Kolkata';

export function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatIST(date: string | Date, fmt = 'h:mm A') {
  return dayjs(date).tz(IST).format(fmt);
}

export function formatISTRelative(date: string | Date) {
  const d = dayjs(date).tz(IST);
  if (dayjs().diff(d, 'hour') < 1) return 'Just now';
  return d.format('h:mm A');
}

export function roleLabel(role: string | null | undefined) {
  if (!role) return '';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const AVATAR_COLORS = [
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#EAF3DE', text: '#3B6D11' },
  { bg: '#FBEAF0', text: '#993556' },
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#FAECE7', text: '#993C1D' },
];

export function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
