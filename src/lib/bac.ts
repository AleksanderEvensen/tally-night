const ETHANOL_DENSITY = 0.789;

const DISTRIBUTION_RATIO = {
  male: 0.68,
  female: 0.55,
} as const;

const ELIMINATION_RATE = 0.15;
const BIOAVAILABILITY = 0.8;

const ABSORPTION_RATES = {
  empty: 4.0,
  moderate: 2.0,
  full: 0.8,
} as const;

const RESTING_STOMACH_VOLUME_ML = 400;
const WATER_WINDOW_HOURS = 0.5;
const STEP_HOURS = 1 / 60;

export type StomachStatus = keyof typeof ABSORPTION_RATES;

export const DRINK_TYPES = [
  "beer",
  "wine",
  "spirit",
  "cocktail",
  "shot",
  "cider_or_seltzer",
] as const;

export type DrinkType = (typeof DRINK_TYPES)[number];

export const DRINK_TYPE_EMOJI: Record<DrinkType, string> = {
  beer: "🍺",
  wine: "🍷",
  spirit: "🥃",
  cocktail: "🍸",
  shot: "🥃",
  cider_or_seltzer: "🍏",
};

export const DRINK_TYPE_LABEL: Record<DrinkType, string> = {
  beer: "Beer",
  wine: "Wine",
  spirit: "Spirit",
  cocktail: "Cocktail",
  shot: "Shot",
  cider_or_seltzer: "Cider / Seltzer",
};

export interface Drink {
  id: string;
  time: Date;
  type: DrinkType;
  volumeMl: number;
  alcoholPercent: number;
}

export interface WaterEntry {
  id: string;
  time: Date;
  volumeMl: number;
}

export interface UserProfile {
  name: string;
  gender: "male" | "female";
  weightInKg: number;
}

function alcoholGrams(volumeMl: number, alcoholPercent: number): number {
  return volumeMl * (alcoholPercent / 100) * ETHANOL_DENSITY;
}

function concentrationModifier(alcoholPercent: number): number {
  const deviation = alcoholPercent - 22;
  return 0.75 + 0.25 * Math.exp(-(deviation * deviation) / 450);
}

function waterDilutionFactor(drink: Drink, waterEntries: WaterEntry[]): number {
  const drinkMs = drink.time.getTime();
  const windowMs = WATER_WINDOW_HOURS * 3_600_000;

  let nearbyWaterMl = 0;
  for (const water of waterEntries) {
    const waterMs = water.time.getTime();
    if (Math.abs(waterMs - drinkMs) <= windowMs) {
      nearbyWaterMl += water.volumeMl;
    }
  }

  if (nearbyWaterMl === 0) {
    return 1;
  }

  const dilution = RESTING_STOMACH_VOLUME_ML / (RESTING_STOMACH_VOLUME_ML + nearbyWaterMl);
  return Math.max(0.85, dilution);
}

function effectiveKa(
  drink: Drink,
  stomachStatus: StomachStatus,
  waterEntries: WaterEntry[],
): number {
  const baseKa = ABSORPTION_RATES[stomachStatus];
  return (
    baseKa * concentrationModifier(drink.alcoholPercent) * waterDilutionFactor(drink, waterEntries)
  );
}

export function estimateBAC(
  drinks: Drink[],
  userProfile: UserProfile,
  timestamp: Date,
  stomachStatus: StomachStatus = "moderate",
  waterEntries: WaterEntry[] = [],
): number {
  const { gender, weightInKg } = userProfile;
  const Vd = weightInKg * DISTRIBUTION_RATIO[gender];

  const relevant = drinks
    .filter((drink) => drink.time <= timestamp)
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  if (relevant.length === 0) {
    return 0;
  }

  const drinkKa = relevant.map((drink) => effectiveKa(drink, stomachStatus, waterEntries));
  const startMs = relevant[0].time.getTime();
  const endMs = timestamp.getTime();
  const stepMs = STEP_HOURS * 3_600_000;

  let bac = 0;

  for (let tMs = startMs; tMs <= endMs; tMs += stepMs) {
    let absorptionRate = 0;

    for (let i = 0; i < relevant.length; i++) {
      const drink = relevant[i];
      const drinkMs = drink.time.getTime();
      if (drinkMs > tMs) {
        break;
      }

      const hoursSince = (tMs - drinkMs) / 3_600_000;
      const grams = alcoholGrams(drink.volumeMl, drink.alcoholPercent) * BIOAVAILABILITY;
      const kA = drinkKa[i];
      absorptionRate += (grams * kA * Math.exp(-kA * hoursSince)) / Vd;
    }

    const eliminationRate = bac > 0 ? ELIMINATION_RATE : 0;
    bac += (absorptionRate - eliminationRate) * STEP_HOURS;
    bac = Math.max(0, bac);
  }

  return Math.max(0, Math.round(bac * 100) / 100);
}
