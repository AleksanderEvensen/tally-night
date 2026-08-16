import {
  createCollection,
  localOnlyCollectionOptions,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";

import { DEFAULT_DRINK_PRESETS } from "#/lib/drink-presets";

export const userProfileId = "me";
export const settingsId = "settings";
export const serverIdentityId = "primary";

const userProfileSchema = z.object({
  id: z.literal(userProfileId),
  name: z.string().min(2),
  gender: z.enum(["male", "female"]),
  weightInKg: z.number().positive(),
});

const drinkSchema = z.object({
  id: z.string(),
  time: z.number(),
  type: z.enum(["beer", "wine", "spirit", "cocktail", "shot", "cider_or_seltzer"]),
  volumeMl: z.number().positive(),
  alcoholPercent: z.number().positive().max(100),
});

const waterEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  volumeMl: z.number().positive(),
});

const presetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["beer", "wine", "spirit", "cocktail", "shot", "cider_or_seltzer"]),
  volumeMl: z.number().positive(),
  alcoholPercent: z.number().positive().max(100),
  emoji: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
});

const appSettingsSchema = z.object({
  id: z.literal(settingsId),
  stomachStatus: z.enum(["empty", "moderate", "full"]),
  dataConsent: z.boolean(),
  ageConfirmed: z.boolean(),
});

const serverIdentitySchema = z.object({
  id: z.literal(serverIdentityId),
  userId: z.number().int().positive(),
});

const uiStateSchema = z.object({
  id: z.string(),
  value: z.boolean(),
});

export const userProfileCollection = createCollection(
  localStorageCollectionOptions({
    id: "user-profile",
    storageKey: "unlucky-bac:user-profile",
    schema: userProfileSchema,
    getKey: (item) => item.id,
  }),
);

export const drinksCollection = createCollection(
  localStorageCollectionOptions({
    id: "drinks",
    storageKey: "unlucky-bac:drinks",
    schema: drinkSchema,
    getKey: (item) => item.id,
  }),
);

export const waterEntriesCollection = createCollection(
  localStorageCollectionOptions({
    id: "water-entries",
    storageKey: "unlucky-bac:water-entries",
    schema: waterEntrySchema,
    getKey: (item) => item.id,
  }),
);

export const drinkPresetsCollection = createCollection(
  localStorageCollectionOptions({
    id: "drink-presets",
    storageKey: "unlucky-bac:drink-presets",
    schema: presetSchema,
    getKey: (item) => item.id,
  }),
);

export const appSettingsCollection = createCollection(
  localStorageCollectionOptions({
    id: "app-settings",
    storageKey: "unlucky-bac:app-settings",
    schema: appSettingsSchema,
    getKey: (item) => item.id,
  }),
);

export const serverIdentityCollection = createCollection(
  localStorageCollectionOptions({
    id: "server-identity",
    storageKey: "unlucky-bac:server-identity",
    schema: serverIdentitySchema,
    getKey: (item) => item.id,
  }),
);

export const uiStateCollection = createCollection(
  localOnlyCollectionOptions({
    id: "ui-state",
    schema: uiStateSchema,
    getKey: (item) => item.id,
    initialData: [{ id: "mobile-nav", value: false }],
  }),
);

export const defaultSettings = {
  id: settingsId,
  stomachStatus: "moderate" as const,
  dataConsent: false,
  ageConfirmed: false,
};

export const defaultPresetRows = DEFAULT_DRINK_PRESETS.map((preset) => ({ ...preset }));
