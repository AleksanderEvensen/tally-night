import { useState } from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppFrame } from "#/components/app-frame";
import { DRINK_TYPES, DRINK_TYPE_LABEL, type DrinkType } from "#/lib/bac";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";

export const Route = createFileRoute("/drink-presets/$presetId")({
  component: EditPresetPage,
});

const emojiOptions = ["🍺", "🍷", "🥃", "🍸", "🥂", "🍹", "🍶", "🧉"];

function EditPresetPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { presetId } = Route.useParams();
  const { drinkPresets, savePreset, userProfile } = useAppState();

  if (!hydrated) {
    return <AppFrame title="Edit preset" backHref="/drink-presets" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  const preset = drinkPresets.find((item) => item.id === presetId);
  const [name, setName] = useState(preset?.name ?? "");
  const [emoji, setEmoji] = useState(preset?.emoji ?? "🍺");
  const [type, setType] = useState<DrinkType>(preset?.type ?? "beer");
  const [volume, setVolume] = useState(preset ? String(preset.volumeMl) : "");
  const [percent, setPercent] = useState(preset ? String(preset.alcoholPercent) : "");

  if (!preset) {
    return (
      <AppFrame title="Edit preset" backHref="/drink-presets">
        <div className="grid min-h-[40vh] place-items-center p-8 text-sm text-muted-foreground">
          Preset not found.
        </div>
      </AppFrame>
    );
  }

  const canSave =
    name.trim().length > 0 && Number(volume) > 0 && Number(percent) > 0 && Number(percent) <= 100;

  return (
    <AppFrame title="Edit preset" backHref="/drink-presets">
      <form
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-5 sm:p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSave) {
            return;
          }

          await savePreset({
            id: preset.id,
            name: name.trim(),
            emoji,
            type,
            volumeMl: Number(volume),
            alcoholPercent: Number(percent),
          });
          await navigate({ to: "/drink-presets" });
        }}
      >
        <div className="space-y-2">
          <Label>Emoji</Label>
          <div className="flex flex-wrap gap-2">
            {emojiOptions.map((option) => (
              <Button
                key={option}
                type="button"
                variant={emoji === option ? "default" : "outline"}
                className="size-11 rounded-2xl text-xl"
                onClick={() => setEmoji(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-preset-name">Name</Label>
          <Input
            id="edit-preset-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DRINK_TYPES.map((drinkType) => (
              <Button
                key={drinkType}
                type="button"
                variant={type === drinkType ? "default" : "outline"}
                className="h-11 rounded-2xl"
                onClick={() => setType(drinkType)}
              >
                {DRINK_TYPE_LABEL[drinkType]}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-preset-volume">Volume (ml)</Label>
            <Input
              id="edit-preset-volume"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-preset-percent">Alcohol %</Label>
            <Input
              id="edit-preset-percent"
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="h-11 rounded-2xl" disabled={!canSave}>
          Save changes
        </Button>
      </form>
    </AppFrame>
  );
}
