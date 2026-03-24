import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { Drink, StomachStatus, UserInfo, WaterEntry } from './bac';
import type { DrinkPreset } from './drink-presets';
import { DEFAULT_DRINK_PRESETS } from './drink-presets';
import {
  loadConvexUserId,
  loadDataConsent,
  loadDrinkPresets,
  loadDrinks,
  loadStomachStatus,
  loadUserInfo,
  loadWaterEntries,
  saveConvexUserId,
  saveDataConsent,
  saveDrinkPresets,
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
  drinkPresets: DrinkPreset[];
  isLoading: boolean;
  convexUserId: string | null;
  dataConsent: boolean;
  setUserInfo: (info: UserInfo) => Promise<void>;
  addDrink: (drink: Drink) => Promise<void>;
  updateDrink: (index: number, drink: Drink) => Promise<void>;
  deleteDrink: (index: number) => Promise<void>;
  addWater: (entry: WaterEntry) => Promise<void>;
  deleteWater: (index: number) => Promise<void>;
  clearDrinks: () => Promise<void>;
  setStomachStatus: (status: StomachStatus) => Promise<void>;
  setDrinkPresets: (presets: DrinkPreset[]) => Promise<void>;
  setConvexUserId: (id: string) => void;
  setDataConsent: (consent: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [stomachStatus, setStomachStatusState] = useState<StomachStatus>('moderate');
  const [drinkPresetsState, setDrinkPresetsState] = useState<DrinkPreset[]>(DEFAULT_DRINK_PRESETS);
  const [isLoading, setIsLoading] = useState(true);
  const [convexUserId, setConvexUserIdState] = useState<string | null>(null);
  const [dataConsent, setDataConsentState] = useState(false);

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
      const storedPresets = loadDrinkPresets();
      if (storedPresets) setDrinkPresetsState(storedPresets);
      setConvexUserIdState(loadConvexUserId());
      setDataConsentState(loadDataConsent());
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
      const updated = [...drinks, drink].sort((a, b) => a.time.getTime() - b.time.getTime());
      setDrinks(updated);
      await saveDrinks(updated);
    },
    [drinks]
  );

  const updateDrink = useCallback(
    async (index: number, drink: Drink) => {
      const updated = [...drinks];
      updated[index] = drink;
      updated.sort((a, b) => a.time.getTime() - b.time.getTime());
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
      const updated = [...waterEntries, entry].sort((a, b) => a.time.getTime() - b.time.getTime());
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

  const setDrinkPresets = useCallback(async (presets: DrinkPreset[]) => {
    setDrinkPresetsState(presets);
    await saveDrinkPresets(presets);
  }, []);

  const setConvexUserId = useCallback((id: string) => {
    setConvexUserIdState(id);
    saveConvexUserId(id);
  }, []);

  const setDataConsent = useCallback((consent: boolean) => {
    setDataConsentState(consent);
    saveDataConsent(consent);
  }, []);

  return (
    <AppContext.Provider
      value={{
        userInfo,
        drinks,
        waterEntries,
        stomachStatus,
        drinkPresets: drinkPresetsState,
        isLoading,
        convexUserId,
        dataConsent,
        setUserInfo,
        addDrink,
        updateDrink,
        deleteDrink,
        addWater,
        deleteWater,
        clearDrinks,
        setStomachStatus,
        setDrinkPresets,
        setConvexUserId,
        setDataConsent,
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
