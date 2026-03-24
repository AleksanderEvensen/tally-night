import type { DrinkType } from './bac';

export interface DrinkPreset {
  id: string;
  name: string;
  type: DrinkType;
  volumeMl: number;
  alcoholPercent: number;
  emoji: string;
}

export const DEFAULT_DRINK_PRESETS: DrinkPreset[] = [
  {
    id: 'beer-330',
    name: 'Beer 0.33l',
    type: 'beer',
    volumeMl: 330,
    alcoholPercent: 5,
    emoji: '🍺',
  },
  {
    id: 'beer-500',
    name: 'Beer 0.5l',
    type: 'beer',
    volumeMl: 500,
    alcoholPercent: 5,
    emoji: '🍺',
  },
  {
    id: 'strong-beer-500',
    name: 'Strong Beer 0.5l',
    type: 'beer',
    volumeMl: 500,
    alcoholPercent: 7,
    emoji: '🍺',
  },
  {
    id: 'wine-150',
    name: 'Wine',
    type: 'wine',
    volumeMl: 150,
    alcoholPercent: 12,
    emoji: '🍷',
  },
  {
    id: 'wine-200',
    name: 'Large Wine',
    type: 'wine',
    volumeMl: 200,
    alcoholPercent: 12,
    emoji: '🍷',
  },
  {
    id: 'shot-40',
    name: 'Shot',
    type: 'shot',
    volumeMl: 40,
    alcoholPercent: 40,
    emoji: '🥃',
  },
  {
    id: 'cocktail-200',
    name: 'Cocktail',
    type: 'cocktail',
    volumeMl: 200,
    alcoholPercent: 15,
    emoji: '🍸',
  },
  {
    id: 'champagne-150',
    name: 'Champagne',
    type: 'wine',
    volumeMl: 150,
    alcoholPercent: 12,
    emoji: '🥂',
  },
];
