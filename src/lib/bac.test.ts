import { describe, expect, it } from "vitest";

import { estimateBAC, type Drink, type UserProfile, type WaterEntry } from "#/lib/bac";

const profile: UserProfile = {
  name: "Alex",
  gender: "male",
  weightInKg: 80,
};

function makeDrink(overrides: Partial<Drink> = {}): Drink {
  return {
    id: "drink-1",
    time: new Date("2026-04-11T20:00:00.000Z"),
    type: "beer",
    volumeMl: 500,
    alcoholPercent: 5,
    ...overrides,
  };
}

describe("estimateBAC", () => {
  it("returns zero when there are no drinks", () => {
    expect(estimateBAC([], profile, new Date("2026-04-11T21:00:00.000Z"))).toBe(0);
  });

  it("increases after drinks and declines over time", () => {
    const drinks = [makeDrink()];

    const shortlyAfter = estimateBAC(drinks, profile, new Date("2026-04-11T20:30:00.000Z"));
    const muchLater = estimateBAC(drinks, profile, new Date("2026-04-12T01:30:00.000Z"));

    expect(shortlyAfter).toBeGreaterThan(0);
    expect(muchLater).toBeLessThan(shortlyAfter);
  });

  it("accounts for nearby water intake", () => {
    const drinks = [makeDrink()];
    const water: WaterEntry[] = [
      {
        id: "water-1",
        time: new Date("2026-04-11T20:05:00.000Z"),
        volumeMl: 500,
      },
    ];

    const withoutWater = estimateBAC(
      drinks,
      profile,
      new Date("2026-04-11T20:45:00.000Z"),
      "moderate",
      [],
    );
    const withWater = estimateBAC(
      drinks,
      profile,
      new Date("2026-04-11T20:45:00.000Z"),
      "moderate",
      water,
    );

    expect(withWater).toBeLessThanOrEqual(withoutWater);
  });
});
