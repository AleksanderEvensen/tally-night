import { useState } from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";

import { AppFrame } from "#/components/app-frame";
import { Checkbox } from "#/components/ui/checkbox";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { ageConfirmed, saveUserProfile, setAgeConfirmed, userProfile } = useAppState();

  const [name, setName] = useState(userProfile?.name ?? "");
  const [gender, setGender] = useState<"male" | "female" | null>(userProfile?.gender ?? null);
  const [weight, setWeight] = useState(userProfile ? String(userProfile.weightInKg) : "");

  if (!hydrated) {
    return (
      <AppFrame title="Setup" description="Preparing your local profile.">
        <div className="grid min-h-[50vh] place-items-center p-8 text-sm text-muted-foreground">
          Loading…
        </div>
      </AppFrame>
    );
  }

  if (userProfile) {
    return <Navigate to="/" />;
  }

  const canContinue =
    name.trim().length >= 2 && gender !== null && Number(weight) > 0 && ageConfirmed;

  return (
    <AppFrame title="Setup" description="A few details stay local so the BAC estimate can work.">
      <form
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-5 sm:p-8"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canContinue || !gender) {
            return;
          }

          await saveUserProfile({
            name: name.trim(),
            gender,
            weightInKg: Number(weight),
          });
          await navigate({ to: "/" });
        }}
      >
        <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,rgba(249,115,22,0.14),rgba(251,191,36,0.16))] p-5 ring-1 ring-foreground/8">
          <p className="font-heading text-3xl tracking-tight">Welcome</p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Unlucky BAC keeps your detailed tracker data on this device. Group sharing is optional
            later.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="At least 2 characters"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Gender</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={gender === "male" ? "default" : "outline"}
                className="h-14 rounded-2xl"
                onClick={() => setGender("male")}
              >
                ♂ Male
              </Button>
              <Button
                type="button"
                variant={gender === "female" ? "default" : "outline"}
                className="h-14 rounded-2xl"
                onClick={() => setGender("female")}
              >
                ♀ Female
              </Button>
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              inputMode="decimal"
              placeholder="75"
            />
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-amber-500/25 bg-amber-500/8 p-4">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={ageConfirmed}
              onCheckedChange={(value) => setAgeConfirmed(value === true)}
              className="mt-1"
            />
            <span className="text-sm leading-6">
              I confirm that I am of legal drinking age where I am using this app. BAC values are
              approximate, not medical advice, and should never be used to judge whether it is safe
              to drive or operate machinery.
            </span>
          </label>
        </div>

        <Button type="submit" size="lg" className="h-12 rounded-2xl" disabled={!canContinue}>
          Continue
        </Button>
      </form>
    </AppFrame>
  );
}
