import { useState } from "react";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";

import { AppFrame } from "#/components/app-frame";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Switch } from "#/components/ui/switch";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";
import { deleteUserData, registerLogin, registerUser } from "#/services/users";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const hydrated = useHydrated();
  const {
    clearServerIdentity,
    dataConsent,
    serverIdentity,
    setDataConsent,
    setServerIdentity,
    userProfile,
  } = useAppState();

  const registerUserFn = useServerFn(registerUser);
  const registerLoginFn = useServerFn(registerLogin);
  const deleteUserDataFn = useServerFn(deleteUserData);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (!hydrated) {
    return <AppFrame title="Data & privacy" backHref="/" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  return (
    <AppFrame
      title="Data & privacy"
      backHref="/"
      description="Detailed tracker data stays local unless you opt into group sharing."
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-5 sm:p-6">
        <Alert className="rounded-[1.5rem] border-emerald-500/20 bg-emerald-500/7">
          <ShieldCheck className="size-4" />
          <AlertTitle>What Data Is Shared</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>Display name</p>
            <p>Current BAC estimate</p>
            <p>Drink counts by category only</p>
          </AlertDescription>
        </Alert>

        <Alert className="rounded-[1.5rem] border-red-500/20 bg-red-500/6">
          <ShieldCheck className="size-4" />
          <AlertTitle>Never Shared</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>Weight and gender</p>
            <p>Drink timestamps, volumes, and ABV</p>
            <p>Stomach status and water intake</p>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
          <div>
            <p className="font-medium">Share data with groups</p>
            <p className="text-sm text-muted-foreground">
              {dataConsent
                ? "Enabled. You can join or create groups."
                : "Disabled. Local tracking still works."}
            </p>
          </div>
          <Switch
            checked={dataConsent}
            disabled={pending}
            onCheckedChange={async (value) => {
              if (value !== true) {
                setConfirmOpen(true);
                return;
              }

              setPending(true);
              try {
                if (serverIdentity) {
                  await registerLoginFn({ data: { userId: serverIdentity.userId } });
                } else {
                  const userId = await registerUserFn({ data: { name: userProfile.name } });
                  await setServerIdentity(userId);
                }

                await setDataConsent(true);
              } finally {
                setPending(false);
              }
            }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Opting out removes your server-side group data and memberships, but keeps all local
          drinks, presets, and profile data on this device.
        </p>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable data sharing?</DialogTitle>
            <DialogDescription>
              This removes your server-side data and all group memberships, but keeps your local
              tracker history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                setPending(true);
                try {
                  if (serverIdentity) {
                    await deleteUserDataFn({ data: { userId: serverIdentity.userId } });
                    await clearServerIdentity();
                  }
                  await setDataConsent(false);
                } finally {
                  setPending(false);
                  setConfirmOpen(false);
                }
              }}
            >
              Disable & delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}
