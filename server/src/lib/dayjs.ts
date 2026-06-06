import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export const IST = 'Asia/Kolkata';

export function nowIST() {
  return dayjs().tz(IST);
}

export function startOfTodayIST() {
  return nowIST().startOf('day');
}

export function endOfTodayIST() {
  return nowIST().endOf('day');
}

export function formatIST(date: Date | string, format = 'h:mm A') {
  return dayjs(date).tz(IST).format(format);
}

export function formatISTDateTime(date: Date | string) {
  return dayjs(date).tz(IST).format('D MMM YYYY, h:mm A');
}

export { dayjs };
