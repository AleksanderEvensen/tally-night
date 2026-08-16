import { useState } from "react";

import { DRINK_TYPES, DRINK_TYPE_EMOJI, DRINK_TYPE_LABEL, type DrinkType } from "#/lib/bac";
import { formatDateTimeInputValue, parseDateTimeInput } from "#/lib/format";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

export function DrinkForm({
  initialValue,
  submitLabel,
  onSubmit,
}: {
  initialValue?: {
    type: DrinkType;
    volumeMl: number;
    alcoholPercent: number;
    time: Date;
  };
  submitLabel: string;
  onSubmit: (value: {
    type: DrinkType;
    volumeMl: number;
    alcoholPercent: number;
    time: Date;
  }) => Promise<void> | void;
}) {
  const [type, setType] = useState<DrinkType>(initialValue?.type ?? "beer");
  const [volume, setVolume] = useState(String(initialValue?.volumeMl ?? ""));
  const [percent, setPercent] = useState(String(initialValue?.alcoholPercent ?? ""));
  const [time, setTime] = useState(formatDateTimeInputValue(initialValue?.time ?? new Date()));

  const canSubmit = Number(volume) > 0 && Number(percent) > 0 && Number(percent) <= 100;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }

        await onSubmit({
          type,
          volumeMl: Number(volume),
          alcoholPercent: Number(percent),
          time: parseDateTimeInput(time),
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="drink-time">Time</Label>
        <Input
          id="drink-time"
          type="datetime-local"
          max={formatDateTimeInputValue(new Date())}
          value={time}
          onChange={(event) => setTime(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DRINK_TYPES.map((drinkType) => (
            <Button
              key={drinkType}
              type="button"
              variant={drinkType === type ? "default" : "outline"}
              className="h-12 justify-start rounded-2xl px-3"
              onClick={() => setType(drinkType)}
            >
              <span>{DRINK_TYPE_EMOJI[drinkType]}</span>
              <span>{DRINK_TYPE_LABEL[drinkType]}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="drink-volume">Volume (ml)</Label>
          <Input
            id="drink-volume"
            inputMode="numeric"
            placeholder="330"
            value={volume}
            onChange={(event) => setVolume(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="drink-percent">Alcohol %</Label>
          <Input
            id="drink-percent"
            inputMode="decimal"
            placeholder="5"
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-2 h-11 rounded-2xl" disabled={!canSubmit}>
        {submitLabel}
      </Button>
    </form>
  );
}
