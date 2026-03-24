import { format } from 'date-fns';

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatExpiry(expires: number): string {
  const now = Date.now();
  const diff = expires - now;
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
