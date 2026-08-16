import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { uuidv7 } from "uuidv7";

import {
  appSettingsCollection,
  defaultPresetRows,
  defaultSettings,
  drinkPresetsCollection,
  drinksCollection,
  serverIdentityCollection,
  serverIdentityId,
  settingsId,
  userProfileCollection,
  userProfileId,
  waterEntriesCollection,
} from "#/db-collections";
import type { Drink, StomachStatus, UserProfile, WaterEntry } from "#/lib/bac";
import type { DrinkPreset } from "#/lib/drink-presets";

function sortByTime<T extends { time: number }>(items: T[]) {
  return [...items].sort((a, b) => a.time - b.time);
}

export function useAppState() {
  const { data: userProfiles = [] } = useLiveQuery(userProfileCollection);
  const { data: drinkRows = [] } = useLiveQuery(drinksCollection);
  const { data: waterRows = [] } = useLiveQuery(waterEntriesCollection);
  const { data: presetRows = [] } = useLiveQuery(drinkPresetsCollection);
  const { data: settingsRows = [] } = useLiveQuery(appSettingsCollection);
  const { data: serverRows = [] } = useLiveQuery(serverIdentityCollection);

  const userProfile = (
    userProfiles[0]
      ? {
          name: userProfiles[0].name,
          gender: userProfiles[0].gender,
          weightInKg: userProfiles[0].weightInKg,
        }
      : null
  ) satisfies UserProfile | null;

  const drinks = useMemo<Drink[]>(
    () =>
      sortByTime(drinkRows).map((drink) => ({
        id: drink.id,
        time: new Date(drink.time),
        type: drink.type,
        volumeMl: drink.volumeMl,
        alcoholPercent: drink.alcoholPercent,
      })),
    [drinkRows],
  );

  const waterEntries = useMemo<WaterEntry[]>(
    () =>
      sortByTime(waterRows).map((entry) => ({
        id: entry.id,
        time: new Date(entry.time),
        volumeMl: entry.volumeMl,
      })),
    [waterRows],
  );

  const drinkPresets = useMemo<DrinkPreset[]>(
    () => [...presetRows].sort((a, b) => a.sortOrder - b.sortOrder),
    [presetRows],
  );

  const settings = settingsRows[0] ?? defaultSettings;
  const serverIdentity = serverRows[0] ?? null;

  const saveUserProfile = async (profile: UserProfile) => {
    if (userProfile) {
      userProfileCollection.update(userProfileId, (draft) => {
        draft.name = profile.name;
        draft.gender = profile.gender;
        draft.weightInKg = profile.weightInKg;
      });
      return;
    }

    userProfileCollection.insert({ id: userProfileId, ...profile });
  };

  const addDrink = async (drink: Omit<Drink, "id">) => {
    drinksCollection.insert({
      id: uuidv7(),
      time: drink.time.getTime(),
      type: drink.type,
      volumeMl: drink.volumeMl,
      alcoholPercent: drink.alcoholPercent,
    });
  };

  const updateDrink = async (drinkId: string, drink: Omit<Drink, "id">) => {
    drinksCollection.update(drinkId, (draft) => {
      draft.time = drink.time.getTime();
      draft.type = drink.type;
      draft.volumeMl = drink.volumeMl;
      draft.alcoholPercent = drink.alcoholPercent;
    });
  };

  const deleteDrink = async (drinkId: string) => {
    drinksCollection.delete(drinkId);
  };

  const addWaterEntry = async (volumeMl: number, time = new Date()) => {
    waterEntriesCollection.insert({
      id: uuidv7(),
      time: time.getTime(),
      volumeMl,
    });
  };

  const deleteWaterEntry = async (entryId: string) => {
    waterEntriesCollection.delete(entryId);
  };

  const clearSession = async () => {
    for (const drink of drinkRows) {
      drinksCollection.delete(drink.id);
    }

    for (const water of waterRows) {
      waterEntriesCollection.delete(water.id);
    }
  };

  const setStomachStatus = async (status: StomachStatus) => {
    if (settingsRows[0]) {
      appSettingsCollection.update(settingsId, (draft) => {
        draft.stomachStatus = status;
      });
      return;
    }

    appSettingsCollection.insert({ ...defaultSettings, stomachStatus: status });
  };

  const setDataConsent = async (value: boolean) => {
    if (settingsRows[0]) {
      appSettingsCollection.update(settingsId, (draft) => {
        draft.dataConsent = value;
      });
      return;
    }

    appSettingsCollection.insert({ ...defaultSettings, dataConsent: value });
  };

  const setAgeConfirmed = async (value: boolean) => {
    if (settingsRows[0]) {
      appSettingsCollection.update(settingsId, (draft) => {
        draft.ageConfirmed = value;
      });
      return;
    }

    appSettingsCollection.insert({ ...defaultSettings, ageConfirmed: value });
  };

  const setServerIdentity = async (userId: number) => {
    if (serverIdentity) {
      serverIdentityCollection.update(serverIdentityId, (draft) => {
        draft.userId = userId;
      });
      return;
    }

    serverIdentityCollection.insert({ id: serverIdentityId, userId });
  };

  const clearServerIdentity = async () => {
    if (serverIdentity) {
      serverIdentityCollection.delete(serverIdentityId);
    }
  };

  const savePreset = async (preset: Omit<DrinkPreset, "id" | "sortOrder"> & { id?: string }) => {
    const isEditing = Boolean(preset.id);
    const sortOrder =
      presetRows.find((item) => item.id === preset.id)?.sortOrder ?? presetRows.length;
    const nextRow = {
      id: preset.id ?? uuidv7(),
      name: preset.name,
      type: preset.type,
      volumeMl: preset.volumeMl,
      alcoholPercent: preset.alcoholPercent,
      emoji: preset.emoji,
      sortOrder,
    };

    if (isEditing) {
      drinkPresetsCollection.update(nextRow.id, (draft) => {
        draft.name = nextRow.name;
        draft.type = nextRow.type;
        draft.volumeMl = nextRow.volumeMl;
        draft.alcoholPercent = nextRow.alcoholPercent;
        draft.emoji = nextRow.emoji;
      });
      return nextRow.id;
    }

    drinkPresetsCollection.insert(nextRow);
    return nextRow.id;
  };

  const deletePreset = async (presetId: string) => {
    drinkPresetsCollection.delete(presetId);
  };

  const resetPresets = async () => {
    for (const preset of presetRows) {
      drinkPresetsCollection.delete(preset.id);
    }

    for (const preset of defaultPresetRows) {
      drinkPresetsCollection.insert(preset);
    }
  };

  return {
    userProfile,
    drinks,
    waterEntries,
    drinkPresets,
    serverIdentity,
    stomachStatus: settings.stomachStatus,
    dataConsent: settings.dataConsent,
    ageConfirmed: settings.ageConfirmed,
    saveUserProfile,
    addDrink,
    updateDrink,
    deleteDrink,
    addWaterEntry,
    deleteWaterEntry,
    clearSession,
    setStomachStatus,
    setDataConsent,
    setAgeConfirmed,
    setServerIdentity,
    clearServerIdentity,
    savePreset,
    deletePreset,
    resetPresets,
  };
}
