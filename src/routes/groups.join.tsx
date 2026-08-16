import { useState } from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppFrame } from "#/components/app-frame";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";
import { joinGroup } from "#/services/groups";

export const Route = createFileRoute("/groups/join")({
  component: JoinGroupPage,
});

function JoinGroupPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dataConsent, serverIdentity, userProfile } = useAppState();
  const joinGroupFn = useServerFn(joinGroup);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (!hydrated) {
    return <AppFrame title="Join group" backHref="/groups" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  if (!dataConsent || !serverIdentity) {
    return <Navigate to="/privacy" />;
  }

  const cleanCode = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  return (
    <AppFrame title="Join group" backHref="/groups">
      <form
        className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center gap-5 p-6 text-center"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            const result = await joinGroupFn({
              data: { joinCode: cleanCode, userId: serverIdentity.userId },
            });
            await queryClient.invalidateQueries({ queryKey: ["groups", serverIdentity.userId] });
            await navigate({ to: "/groups/$groupId", params: { groupId: result.groupId } });
          } catch (errorValue) {
            setError(errorValue instanceof Error ? errorValue.message : "Could not join group.");
          }
        }}
      >
        <p className="font-heading text-4xl">Enter a code</p>
        <Input
          className="h-16 rounded-[1.6rem] text-center font-heading text-4xl tracking-[0.4em]"
          value={cleanCode}
          onChange={(event) => setCode(event.target.value)}
          maxLength={6}
          autoFocus
        />
        <p className="text-sm text-muted-foreground">
          Ask the host for the six-character group code.
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="submit"
          size="lg"
          className="h-11 rounded-2xl"
          disabled={cleanCode.length !== 6}
        >
          Join group
        </Button>
      </form>
    </AppFrame>
  );
}
