import { ConvexReactClient } from 'convex/react';

import type { Drink } from './bac';

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error('EXPO_PUBLIC_CONVEX_URL is not set');
}

export const convexClient = new ConvexReactClient(CONVEX_URL);

/**
 * Maps the app's detailed drink objects to the backend's simple category counts.
 * Only counts are shared — no timestamps, volumes, or ABV%.
 */
export function mapDrinksToCounts(drinks: Drink[]): {
  beer: number;
  wine: number;
  spirits: number;
  cocktails: number;
  shots: number;
  ciders_seltzers: number;
} {
  const counts = { beer: 0, wine: 0, spirits: 0, cocktails: 0, shots: 0, ciders_seltzers: 0 };

  for (const drink of drinks) {
    switch (drink.type) {
      case 'beer':
        counts.beer++;
        break;
      case 'wine':
        counts.wine++;
        break;
      case 'spirit':
        counts.spirits++;
        break;
      case 'cocktail':
        counts.cocktails++;
        break;
      case 'shot':
        counts.shots++;
        break;
      case 'cider_or_seltzer':
        counts.ciders_seltzers++;
        break;
    }
  }

  return counts;
}
