/**
 * Blood Alcohol Content (BAC) estimation using numerical integration of
 * a one-compartment pharmacokinetic model.
 *
 * - Absorption: first-order exponential, rate depends on stomach contents,
 *   drink concentration, and water dilution
 * - Elimination: zero-order (constant rate), only active when BAC > 0
 * - Bioavailability: ~80% (first-pass metabolism in stomach/liver)
 * - Distribution: Widmark volume of distribution (body weight × r)
 *
 * References:
 *   Widmark (1932) — distribution ratio & elimination model
 *   Wagner & Patel (1972) — one-compartment oral absorption kinetics
 *   Sedman et al. (1976) — concentration-dependent absorption rates
 *   Roine et al. (1993) — effect of dilution on peak BAC (~10–18%)
 *   Norberg et al. (2003) — absorption rate variation with food
 *   Jones (2010) — comprehensive review of alcohol pharmacokinetics
 */

const ETHANOL_DENSITY = 0.789; // g/ml

/** Widmark distribution ratio by gender */
const DISTRIBUTION_RATIO = {
  male: 0.68,
  female: 0.55,
} as const;

/**
 * Average zero-order elimination rate in ‰ per hour.
 * Real range 0.10–0.25; 0.15 is the forensic standard.
 */
const ELIMINATION_RATE = 0.15;

/**
 * Bioavailability factor — fraction of ingested alcohol that reaches
 * systemic circulation after first-pass metabolism in the stomach
 * lining and liver. Typically 0.75–0.90.
 */
const BIOAVAILABILITY = 0.8;

/**
 * Base absorption rate constants (k_a) in h⁻¹, varying by stomach contents.
 * Empty stomach: rapid absorption, peaks in ~15–30 min.
 * Full stomach: food delays gastric emptying, peaks in ~60–90 min.
 *
 * Ref: Norberg et al. (2003), Jones (2010)
 */
const ABSORPTION_RATES = {
  empty: 4.0,
  moderate: 2.0,
  full: 0.8,
} as const;

/**
 * Approximate resting stomach volume in ml, used to calculate dilution
 * effects when water is consumed near alcoholic drinks.
 * Ref: Geliebter (1988) — fasting stomach volume ~300–400ml
 */
const RESTING_STOMACH_VOLUME_ML = 400;

/**
 * Window (in hours) around a drink during which water intake is
 * considered to dilute stomach contents and slow absorption.
 * Water consumed more than 30 min before or after has largely
 * passed through or been absorbed.
 */
const WATER_WINDOW_HOURS = 0.5;

/** Time step for numerical integration in hours (1 minute) */
const STEP_HOURS = 1 / 60;

export type StomachStatus = keyof typeof ABSORPTION_RATES;

export const DRINK_TYPES = [
  'beer',
  'wine',
  'spirit',
  'cocktail',
  'shot',
  'cider_or_seltzer',
] as const;

export type DrinkType = (typeof DRINK_TYPES)[number];

/** Canonical emoji for each drink type. */
export const DRINK_TYPE_EMOJI: Record<DrinkType, string> = {
  beer: '🍺',
  wine: '🍷',
  spirit: '🥃',
  cocktail: '🍸',
  shot: '🥃',
  cider_or_seltzer: '🍏',
};

/** Human-readable label for each drink type. */
export const DRINK_TYPE_LABEL: Record<DrinkType, string> = {
  beer: 'Beer',
  wine: 'Wine',
  spirit: 'Spirit',
  cocktail: 'Cocktail',
  shot: 'Shot',
  cider_or_seltzer: 'Cider / Seltzer',
};

export interface Drink {
  time: Date;
  type: DrinkType;
  volumeMl: number;
  alcoholPercent: number;
}

export interface WaterEntry {
  time: Date;
  volumeMl: number;
}

export interface UserInfo {
  name: string;
  gender: 'male' | 'female';
  weightInKg: number;
}

function alcoholGrams(volumeMl: number, alcoholPercent: number): number {
  return volumeMl * (alcoholPercent / 100) * ETHANOL_DENSITY;
}

/**
 * Concentration-dependent absorption modifier.
 *
 * Alcohol absorption peaks at ~20% ABV. Lower concentrations absorb
 * slower (dilute solution, less concentration gradient). Higher
 * concentrations (>30%) trigger pyloric spasm, delaying gastric
 * emptying and slowing absorption.
 *
 * Modelled as a Gaussian centered at 22% ABV with range 0.75–1.0.
 *
 * Ref: Sedman et al. (1976) — absorption at 4%, 12%, 24%, 48%, 96% ABV
 */
function concentrationModifier(alcoholPercent: number): number {
  const deviation = alcoholPercent - 22;
  return 0.75 + 0.25 * Math.exp(-(deviation * deviation) / 450);
}

/**
 * Water dilution factor for a drink.
 *
 * Water consumed within ±30 min of a drink dilutes stomach contents,
 * reducing the effective alcohol concentration and slowing absorption.
 * Factor ranges from 1.0 (no water) down to ~0.85 (large water intake).
 *
 * Conservative model based on Roine et al. (1993): diluting spirits
 * from 40% to 15% ABV reduced peak BAC by ~18%. Pure water alongside
 * a drink has a smaller effect since it doesn't change the drink itself,
 * only the overall stomach concentration.
 *
 * dilution = stomachVolume / (stomachVolume + nearbyWaterVolume)
 * clamped to [0.85, 1.0] — water alone can't reduce absorption by
 * more than ~15%.
 */
function waterDilutionFactor(drink: Drink, waterEntries: WaterEntry[]): number {
  const drinkMs = drink.time.getTime();
  const windowMs = WATER_WINDOW_HOURS * 3_600_000;

  let nearbyWaterMl = 0;
  for (const w of waterEntries) {
    const wMs = w.time.getTime();
    if (Math.abs(wMs - drinkMs) <= windowMs) {
      nearbyWaterMl += w.volumeMl;
    }
  }

  if (nearbyWaterMl === 0) return 1.0;

  const dilution = RESTING_STOMACH_VOLUME_ML / (RESTING_STOMACH_VOLUME_ML + nearbyWaterMl);
  return Math.max(0.85, dilution);
}

/**
 * Compute the effective absorption rate constant for a single drink,
 * accounting for global stomach status, drink concentration, and water dilution.
 */
function effectiveKa(
  drink: Drink,
  stomachStatus: StomachStatus,
  waterEntries: WaterEntry[]
): number {
  const baseKa = ABSORPTION_RATES[stomachStatus];
  const concMod = concentrationModifier(drink.alcoholPercent);
  const waterMod = waterDilutionFactor(drink, waterEntries);
  return baseKa * concMod * waterMod;
}

/**
 * Estimate BAC in promille (‰) at a given timestamp using numerical
 * integration (Euler method, 1-minute steps).
 *
 * At each step:
 *   1. Sum instantaneous absorption rate from all prior drinks, each
 *      with its own k_a derived from stomach status, concentration,
 *      and nearby water intake:
 *      rate_in = Σ (grams_i × F × k_a_i × e^(−k_a_i × Δt_i)) / Vd
 *   2. Subtract zero-order elimination (only when BAC > 0):
 *      rate_out = β
 *   3. Update: BAC += (rate_in − rate_out) × dt, clamped to ≥ 0
 */
export function estimateBAC(
  drinks: Drink[],
  userInfo: UserInfo,
  timestamp: Date,
  stomachStatus: StomachStatus = 'moderate',
  waterEntries: WaterEntry[] = []
): number {
  const { gender, weightInKg } = userInfo;
  const Vd = weightInKg * DISTRIBUTION_RATIO[gender];

  const relevant = drinks
    .filter((d) => d.time <= timestamp)
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  if (relevant.length === 0) return 0;

  // Pre-compute k_a for each drink (avoids recalculating every step)
  const drinkKa = relevant.map((d) => effectiveKa(d, stomachStatus, waterEntries));

  const startMs = relevant[0].time.getTime();
  const endMs = timestamp.getTime();
  const stepMs = STEP_HOURS * 3_600_000;

  let bac = 0;

  for (let tMs = startMs; tMs <= endMs; tMs += stepMs) {
    let absorptionRate = 0;
    for (let i = 0; i < relevant.length; i++) {
      const drink = relevant[i];
      const drinkMs = drink.time.getTime();
      if (drinkMs > tMs) break;

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
