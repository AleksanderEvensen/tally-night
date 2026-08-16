import { useState } from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppFrame } from "#/components/app-frame";
import { DrinkForm } from "#/components/drink-form";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";
import { formatDateTimeInputValue, parseDateTimeInput } from "#/lib/format";

export const Route = createFileRoute("/add-drink")({
  component: AddDrinkPage,
});

function AddDrinkPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { addDrink, drinkPresets, userProfile } = useAppState();
  const [presetTime, setPresetTime] = useState(formatDateTimeInputValue(new Date()));

  if (!hydrated) {
    return <AppFrame title="Add drink" backHref="/" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  return (
    <AppFrame title="Add drink" backHref="/" description="Tap a preset or enter a custom drink.">
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,0.9fr)]">
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="font-heading text-2xl">Quick presets</p>
            <p className="text-sm text-muted-foreground">
              The selected time applies to quick-pick entries.
            </p>
            <Input
              type="datetime-local"
              max={formatDateTimeInputValue(new Date())}
              value={presetTime}
              onChange={(event) => setPresetTime(event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {drinkPresets.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="outline"
                className="h-auto min-h-24 flex-col items-start rounded-[1.5rem] px-4 py-4 text-left"
                onClick={async () => {
                  await addDrink({
                    time: parseDateTimeInput(presetTime),
                    type: preset.type,
                    volumeMl: preset.volumeMl,
                    alcoholPercent: preset.alcoholPercent,
                  });
                  await navigate({ to: "/" });
                }}
              >
                <span className="text-3xl">{preset.emoji}</span>
                <span className="mt-2 text-sm font-medium">{preset.name}</span>
                <span className="text-xs text-muted-foreground">
                  {preset.volumeMl}ml · {preset.alcoholPercent}%
                </span>
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-muted/30 p-4 ring-1 ring-foreground/8 sm:p-5">
          <p className="mb-4 font-heading text-2xl">Custom drink</p>
          <DrinkForm
            submitLabel="Add drink"
            onSubmit={async (value) => {
              await addDrink(value);
              await navigate({ to: "/" });
            }}
          />
        </section>
      </div>
    </AppFrame>
  );
}
