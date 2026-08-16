import type { Drink } from "./bac";

export function mapDrinksToCounts(drinks: Drink[]): {
  beer: number;
  wine: number;
  spirits: number;
  cocktails: number;
  shots: number;
  ciders_seltzers: number;
} {
  const counts = {
    beer: 0,
    wine: 0,
    spirits: 0,
    cocktails: 0,
    shots: 0,
    ciders_seltzers: 0,
  };

  for (const drink of drinks) {
    switch (drink.type) {
      case "beer":
        counts.beer++;
        break;
      case "wine":
        counts.wine++;
        break;
      case "spirit":
        counts.spirits++;
        break;
      case "cocktail":
        counts.cocktails++;
        break;
      case "shot":
        counts.shots++;
        break;
      case "cider_or_seltzer":
        counts.ciders_seltzers++;
        break;
    }
  }

  return counts;
}

export function getBacColor(bac: number): string {
  if (bac === 0) {
    return "var(--color-emerald-500, oklch(0.7 0.18 151))";
  }

  if (bac < 0.3) {
    return "var(--color-lime-500, oklch(0.79 0.2 135))";
  }

  if (bac < 0.5) {
    return "var(--color-amber-500, oklch(0.79 0.16 80))";
  }

  if (bac < 0.8) {
    return "var(--color-orange-500, oklch(0.71 0.19 45))";
  }

  return "var(--color-red-500, oklch(0.64 0.24 25))";
}

export function getBacStatus(bac: number): string {
  if (bac === 0) {
    return "Sober";
  }

  if (bac < 0.3) {
    return "Minimal";
  }

  if (bac < 0.5) {
    return "Light";
  }

  if (bac < 0.8) {
    return "Moderate";
  }

  return "Elevated";
}
