import { useState } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppFrame } from "#/components/app-frame";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";
import { createGroup } from "#/services/groups";

export const Route = createFileRoute("/groups/create")({
  component: CreateGroupPage,
});

const expiryOptions = [
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "24 hours", hours: 24 },
  { label: "48 hours", hours: 48 },
];

function CreateGroupPage() {
  const hydrated = useHydrated();
  const queryClient = useQueryClient();
  const { dataConsent, serverIdentity, userProfile } = useAppState();
  const createGroupFn = useServerFn(createGroup);
  const [name, setName] = useState("");
  const [expiryHours, setExpiryHours] = useState(24);
  const [result, setResult] = useState<{ groupId: string; joinCode: string } | null>(null);

  if (!hydrated) {
    return <AppFrame title="Create group" backHref="/groups" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  if (!dataConsent || !serverIdentity) {
    return <Navigate to="/privacy" />;
  }

  if (result) {
    return (
      <AppFrame title="Group created" backHref="/groups">
        <div className="grid min-h-[50vh] place-items-center p-6 text-center">
          <div className="max-w-md space-y-5">
            <p className="font-heading text-4xl">Share this code</p>
            <div className="rounded-[1.8rem] border border-border/70 bg-muted/20 px-6 py-8">
              <p className="font-heading text-5xl tracking-[0.4em]">{result.joinCode}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                size="lg"
                className="h-11 rounded-2xl"
                onClick={async () => navigator.clipboard.writeText(result.joinCode)}
              >
                Copy code
              </Button>
              <Button
                render={<Link to="/groups/$groupId" params={{ groupId: result.groupId }} />}
                type="button"
                variant="outline"
                size="lg"
                className="h-11 rounded-2xl"
              >
                Open session
              </Button>
            </div>
          </div>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame title="Create group" backHref="/groups">
      <form
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-5 sm:p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const next = await createGroupFn({
            data: {
              name: name.trim(),
              userId: serverIdentity.userId,
              expiresInHours: expiryHours,
            },
          });
          setResult(next);
          await queryClient.invalidateQueries({ queryKey: ["groups", serverIdentity.userId] });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="group-name">Group name</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Friday Night"
          />
        </div>

        <div className="space-y-2">
          <Label>Expires after</Label>
          <div className="grid grid-cols-2 gap-2">
            {expiryOptions.map((option) => (
              <Button
                key={option.hours}
                type="button"
                variant={expiryHours === option.hours ? "default" : "outline"}
                className="h-11 rounded-2xl"
                onClick={() => setExpiryHours(option.hours)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-11 rounded-2xl"
          disabled={name.trim().length < 2}
        >
          Create group
        </Button>
      </form>
    </AppFrame>
  );
}
