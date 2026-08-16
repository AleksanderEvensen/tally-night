import { useState } from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppFrame } from "#/components/app-frame";
import { DRINK_TYPES, DRINK_TYPE_LABEL, type DrinkType } from "#/lib/bac";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";

export const Route = createFileRoute("/drink-presets/new")({
  component: NewPresetPage,
});

const emojiOptions = ["🍺", "🍷", "🥃", "🍸", "🥂", "🍹", "🍶", "🧉"];

function NewPresetPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { savePreset, userProfile } = useAppState();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍺");
  const [type, setType] = useState<DrinkType>("beer");
  const [volume, setVolume] = useState("");
  const [percent, setPercent] = useState("");

  if (!hydrated) {
    return <AppFrame title="New preset" backHref="/drink-presets" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  const canSave =
    name.trim().length > 0 && Number(volume) > 0 && Number(percent) > 0 && Number(percent) <= 100;

  return (
    <PresetEditor
      title="New preset"
      name={name}
      setName={setName}
      emoji={emoji}
      setEmoji={setEmoji}
      type={type}
      setType={setType}
      volume={volume}
      setVolume={setVolume}
      percent={percent}
      setPercent={setPercent}
      canSave={canSave}
      submitLabel="Add preset"
      onSubmit={async () => {
        const presetId = await savePreset({
          name: name.trim(),
          emoji,
          type,
          volumeMl: Number(volume),
          alcoholPercent: Number(percent),
        });
        await navigate({ to: "/drink-presets/$presetId", params: { presetId } });
      }}
    />
  );
}

function PresetEditor({
  title,
  name,
  setName,
  emoji,
  setEmoji,
  type,
  setType,
  volume,
  setVolume,
  percent,
  setPercent,
  canSave,
  submitLabel,
  onSubmit,
}: {
  title: string;
  name: string;
  setName: (value: string) => void;
  emoji: string;
  setEmoji: (value: string) => void;
  type: DrinkType;
  setType: (value: DrinkType) => void;
  volume: string;
  setVolume: (value: string) => void;
  percent: string;
  setPercent: (value: string) => void;
  canSave: boolean;
  submitLabel: string;
  onSubmit: () => Promise<void>;
}) {
  return (
    <AppFrame title={title} backHref="/drink-presets">
      <form
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-5 sm:p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (canSave) {
            await onSubmit();
          }
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
          <Label htmlFor="preset-name">Name</Label>
          <Input
            id="preset-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="IPA Pint"
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
            <Label htmlFor="preset-volume">Volume (ml)</Label>
            <Input
              id="preset-volume"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preset-percent">Alcohol %</Label>
            <Input
              id="preset-percent"
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="h-11 rounded-2xl" disabled={!canSave}>
          {submitLabel}
        </Button>
      </form>
    </AppFrame>
  );
}
