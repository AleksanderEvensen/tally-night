import { useState } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AppFrame } from "#/components/app-frame";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";
import { updateUser } from "#/services/users";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const hydrated = useHydrated();
  const { dataConsent, saveUserProfile, serverIdentity, userProfile } = useAppState();
  const updateUserFn = useServerFn(updateUser);

  const [name, setName] = useState(userProfile?.name ?? "");
  const [gender, setGender] = useState<"male" | "female">(userProfile?.gender ?? "male");
  const [weight, setWeight] = useState(userProfile ? String(userProfile.weightInKg) : "");
  const [saved, setSaved] = useState(false);

  if (!hydrated) {
    return <AppFrame title="Profile" backHref="/" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  const canSave = name.trim().length >= 2 && Number(weight) > 0;

  return (
    <AppFrame
      title="Profile"
      backHref="/"
      description="These details stay local except your display name when sharing is enabled."
    >
      <form
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-5 sm:p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSave) {
            return;
          }

          await saveUserProfile({
            name: name.trim(),
            gender,
            weightInKg: Number(weight),
          });

          if (dataConsent && serverIdentity) {
            await updateUserFn({
              data: { userId: serverIdentity.userId, name: name.trim() },
            }).catch(() => undefined);
          }

          setSaved(true);
          window.setTimeout(() => setSaved(false), 1500);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Gender</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={gender === "male" ? "default" : "outline"}
              className="h-12 rounded-2xl"
              onClick={() => setGender("male")}
            >
              ♂ Male
            </Button>
            <Button
              type="button"
              variant={gender === "female" ? "default" : "outline"}
              className="h-12 rounded-2xl"
              onClick={() => setGender("female")}
            >
              ♀ Female
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-weight">Weight (kg)</Label>
          <Input
            id="profile-weight"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            inputMode="decimal"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" size="lg" className="h-11 rounded-2xl" disabled={!canSave}>
            {saved ? "Saved" : "Save profile"}
          </Button>
          <Button
            render={<Link to="/drink-presets" />}
            type="button"
            variant="outline"
            size="lg"
            className="h-11 rounded-2xl"
          >
            Drink presets
          </Button>
          <Button
            render={<Link to="/privacy" />}
            type="button"
            variant="outline"
            size="lg"
            className="h-11 rounded-2xl"
          >
            Data & privacy
          </Button>
        </div>
      </form>
    </AppFrame>
  );
}
