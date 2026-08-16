import { useEffect } from "react";
import { useLiveQuery } from "@tanstack/react-db";

import {
  appSettingsCollection,
  defaultPresetRows,
  defaultSettings,
  drinkPresetsCollection,
} from "#/db-collections";

function isDuplicateCollectionInsert(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("already exists in the collection")
  );
}

export function AppBootstrap() {
  const { data: settings = [] } = useLiveQuery(appSettingsCollection);
  const { data: presets = [] } = useLiveQuery(drinkPresetsCollection);

  useEffect(() => {
    if (settings.length === 0) {
      try {
        appSettingsCollection.insert(defaultSettings);
      } catch (error) {
        if (!isDuplicateCollectionInsert(error)) {
          throw error;
        }
      }
    }
  }, [settings.length]);

  useEffect(() => {
    if (presets.length === 0) {
      for (const preset of defaultPresetRows) {
        try {
          drinkPresetsCollection.insert(preset);
        } catch (error) {
          if (!isDuplicateCollectionInsert(error)) {
            throw error;
          }
        }
      }
    }
  }, [presets.length]);

  return null;
}
