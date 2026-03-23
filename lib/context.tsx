import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { Drink, StomachStatus, UserInfo, WaterEntry } from './bac';
import {
  loadDrinks,
  loadStomachStatus,
  loadUserInfo,
  loadWaterEntries,
  saveDrinks,
  saveStomachStatus,
  saveUserInfo,
  saveWaterEntries,
} from './storage';

interface AppState {
  userInfo: UserInfo | null;
  drinks: Drink[];
  waterEntries: WaterEntry[];
  stomachStatus: StomachStatus;
  isLoading: boolean;
  setUserInfo: (info: UserInfo) => Promise<void>;
  addDrink: (drink: Drink) => Promise<void>;
  updateDrink: (index: number, drink: Drink) => Promise<void>;
  deleteDrink: (index: number) => Promise<void>;
  addWater: (entry: WaterEntry) => Promise<void>;
  deleteWater: (index: number) => Promise<void>;
  clearDrinks: () => Promise<void>;
  setStomachStatus: (status: StomachStatus) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [stomachStatus, setStomachStatusState] = useState<StomachStatus>('moderate');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [info, storedDrinks, storedWater, stomach] = await Promise.all([
        loadUserInfo(),
        loadDrinks(),
        loadWaterEntries(),
        loadStomachStatus(),
      ]);
      if (info) setUserInfoState(info);
      setDrinks(storedDrinks);
      setWaterEntries(storedWater);
      setStomachStatusState(stomach);
      setIsLoading(false);
    }
    load();
  }, []);

  const setUserInfo = useCallback(async (info: UserInfo) => {
    setUserInfoState(info);
    await saveUserInfo(info);
  }, []);

  const addDrink = useCallback(
    async (drink: Drink) => {
      const updated = [...drinks, drink];
      setDrinks(updated);
      await saveDrinks(updated);
    },
    [drinks]
  );

  const updateDrink = useCallback(
    async (index: number, drink: Drink) => {
      const updated = [...drinks];
      updated[index] = drink;
      setDrinks(updated);
      await saveDrinks(updated);
    },
    [drinks]
  );

  const deleteDrink = useCallback(
    async (index: number) => {
      const updated = drinks.filter((_, i) => i !== index);
      setDrinks(updated);
      await saveDrinks(updated);
    },
    [drinks]
  );

  const addWater = useCallback(
    async (entry: WaterEntry) => {
      const updated = [...waterEntries, entry];
      setWaterEntries(updated);
      await saveWaterEntries(updated);
    },
    [waterEntries]
  );

  const deleteWater = useCallback(
    async (index: number) => {
      const updated = waterEntries.filter((_, i) => i !== index);
      setWaterEntries(updated);
      await saveWaterEntries(updated);
    },
    [waterEntries]
  );

  const clearDrinks = useCallback(async () => {
    setDrinks([]);
    setWaterEntries([]);
    await Promise.all([saveDrinks([]), saveWaterEntries([])]);
  }, []);

  const setStomachStatus = useCallback(async (status: StomachStatus) => {
    setStomachStatusState(status);
    await saveStomachStatus(status);
  }, []);

  return (
    <AppContext.Provider
      value={{
        userInfo,
        drinks,
        waterEntries,
        stomachStatus,
        isLoading,
        setUserInfo,
        addDrink,
        updateDrink,
        deleteDrink,
        addWater,
        deleteWater,
        clearDrinks,
        setStomachStatus,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
