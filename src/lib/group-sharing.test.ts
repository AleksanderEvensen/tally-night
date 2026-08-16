import { describe, expect, it } from "vitest";

import { mapDrinksToCounts } from "#/lib/group-sharing";
import type { Drink } from "#/lib/bac";

const drinks: Drink[] = [
  {
    id: "1",
    time: new Date("2026-04-11T20:00:00.000Z"),
    type: "beer",
    volumeMl: 500,
    alcoholPercent: 5,
  },
  {
    id: "2",
    time: new Date("2026-04-11T20:10:00.000Z"),
    type: "spirit",
    volumeMl: 40,
    alcoholPercent: 40,
  },
  {
    id: "3",
    time: new Date("2026-04-11T20:20:00.000Z"),
    type: "cider_or_seltzer",
    volumeMl: 330,
    alcoholPercent: 4.7,
  },
];

describe("mapDrinksToCounts", () => {
  it("maps local drink types to the backend payload shape", () => {
    expect(mapDrinksToCounts(drinks)).toEqual({
      beer: 1,
      wine: 0,
      spirits: 1,
      cocktails: 0,
      shots: 0,
      ciders_seltzers: 1,
    });
  });
});
