import { useState } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";

import { AppFrame } from "#/components/app-frame";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";

export const Route = createFileRoute("/drink-presets/")({
  component: DrinkPresetsPage,
});

function DrinkPresetsPage() {
  const hydrated = useHydrated();
  const { deletePreset, drinkPresets, resetPresets, userProfile } = useAppState();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  if (!hydrated) {
    return <AppFrame title="Drink presets" backHref="/profile" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  return (
    <AppFrame
      title="Drink presets"
      backHref="/profile"
      actions={
        <Button render={<Link to="/drink-presets/new" />} size="sm" className="rounded-full">
          New preset
        </Button>
      }
    >
      <div className="space-y-3 p-5 sm:p-6">
        {drinkPresets.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-border/70 bg-background/85 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-muted text-2xl">
                {preset.emoji}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{preset.name}</p>
                <p className="text-sm text-muted-foreground">
                  {preset.volumeMl}ml · {preset.alcoholPercent}%
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                render={<Link to="/drink-presets/$presetId" params={{ presetId: preset.id }} />}
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-destructive"
                onClick={() => setDeleteId(preset.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}

        <div className="pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw />
            Reset defaults
          </Button>
        </div>
      </div>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete preset</DialogTitle>
            <DialogDescription>This removes the preset from local storage.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (deleteId) {
                  await deletePreset(deleteId);
                }
                setDeleteId(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset presets</DialogTitle>
            <DialogDescription>Replace your current presets with the defaults.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                await resetPresets();
                setResetOpen(false);
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}
