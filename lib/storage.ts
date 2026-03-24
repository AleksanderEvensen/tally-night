import { createMMKV } from 'react-native-mmkv';
import type { Drink, StomachStatus, UserInfo, WaterEntry } from './bac';

const KEYS = {
  USER_INFO: 'user_info',
  DRINKS: 'drinks',
  WATER: 'water',
  STOMACH_STATUS: 'stomach_status',
} as const;

interface StoredDrink {
  time: string;
  type: string;
  volumeMl: number;
  alcoholPercent: number;
}

interface StoredWater {
  time: string;
  volumeMl: number;
}

export const storage = createMMKV({
  id: 'unlucky-bac',
});

export function saveUserInfo(info: UserInfo): void {
  storage.set(KEYS.USER_INFO, JSON.stringify(info));
}

export function loadUserInfo(): UserInfo | null {
  const raw = storage.getString(KEYS.USER_INFO);
  if (!raw) return null;
  return JSON.parse(raw) as UserInfo;
}

export function saveDrinks(drinks: Drink[]): void {
  const stored: StoredDrink[] = drinks.map((d) => ({
    time: d.time.toISOString(),
    type: d.type,
    volumeMl: d.volumeMl,
    alcoholPercent: d.alcoholPercent,
  }));
  storage.set(KEYS.DRINKS, JSON.stringify(stored));
}

export function loadDrinks(): Drink[] {
  const raw = storage.getString(KEYS.DRINKS);
  if (!raw) return [];
  const stored = JSON.parse(raw) as StoredDrink[];
  return stored.map((d) => ({
    ...d,
    time: new Date(d.time),
  }));
}

export function saveWaterEntries(entries: WaterEntry[]): void {
  const stored: StoredWater[] = entries.map((w) => ({
    time: w.time.toISOString(),
    volumeMl: w.volumeMl,
  }));
  storage.set(KEYS.WATER, JSON.stringify(stored));
}

export function loadWaterEntries(): WaterEntry[] {
  const raw = storage.getString(KEYS.WATER);
  if (!raw) return [];
  const stored = JSON.parse(raw) as StoredWater[];
  return stored.map((w) => ({
    ...w,
    time: new Date(w.time),
  }));
}

export function saveStomachStatus(status: StomachStatus): void {
  storage.set(KEYS.STOMACH_STATUS, status);
}

export function loadStomachStatus(): StomachStatus {
  const raw = storage.getString(KEYS.STOMACH_STATUS);
  if (raw === 'empty' || raw === 'moderate' || raw === 'full') return raw;
  return 'moderate';
}
