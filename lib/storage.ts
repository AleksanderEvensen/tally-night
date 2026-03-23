import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function saveUserInfo(info: UserInfo): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_INFO, JSON.stringify(info));
}

export async function loadUserInfo(): Promise<UserInfo | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER_INFO);
  if (!raw) return null;
  return JSON.parse(raw) as UserInfo;
}

export async function saveDrinks(drinks: Drink[]): Promise<void> {
  const stored: StoredDrink[] = drinks.map((d) => ({
    time: d.time.toISOString(),
    type: d.type,
    volumeMl: d.volumeMl,
    alcoholPercent: d.alcoholPercent,
  }));
  await AsyncStorage.setItem(KEYS.DRINKS, JSON.stringify(stored));
}

export async function loadDrinks(): Promise<Drink[]> {
  const raw = await AsyncStorage.getItem(KEYS.DRINKS);
  if (!raw) return [];
  const stored = JSON.parse(raw) as StoredDrink[];
  return stored.map((d) => ({
    ...d,
    time: new Date(d.time),
  }));
}

export async function saveWaterEntries(entries: WaterEntry[]): Promise<void> {
  const stored: StoredWater[] = entries.map((w) => ({
    time: w.time.toISOString(),
    volumeMl: w.volumeMl,
  }));
  await AsyncStorage.setItem(KEYS.WATER, JSON.stringify(stored));
}

export async function loadWaterEntries(): Promise<WaterEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.WATER);
  if (!raw) return [];
  const stored = JSON.parse(raw) as StoredWater[];
  return stored.map((w) => ({
    ...w,
    time: new Date(w.time),
  }));
}

export async function saveStomachStatus(status: StomachStatus): Promise<void> {
  await AsyncStorage.setItem(KEYS.STOMACH_STATUS, status);
}

export async function loadStomachStatus(): Promise<StomachStatus> {
  const raw = await AsyncStorage.getItem(KEYS.STOMACH_STATUS);
  if (raw === 'empty' || raw === 'moderate' || raw === 'full') return raw;
  return 'moderate';
}
