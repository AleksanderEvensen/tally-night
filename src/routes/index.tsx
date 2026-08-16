import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { Droplets, GlassWater, Pencil, Trash2, TrendingUp, Users } from "lucide-react";

import { AppFrame } from "#/components/app-frame";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Separator } from "#/components/ui/separator";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";
import { DRINK_TYPE_EMOJI, DRINK_TYPE_LABEL, estimateBAC } from "#/lib/bac";
import { formatTime } from "#/lib/format";
import { getBacColor, getBacStatus } from "#/lib/group-sharing";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type DeleteState =
  | { kind: "none" }
  | { kind: "drink"; id: string; label: string }
  | { kind: "water"; id: string }
  | { kind: "clear" };

const stomachOptions = [
  { value: "empty", label: "Empty", icon: "💨" },
  { value: "moderate", label: "Some food", icon: "🍞" },
  { value: "full", label: "Full", icon: "🍽️" },
] as const;

const waterPresets = [200, 330, 500];

function HomePage() {
  const hydrated = useHydrated();
  const {
    addWaterEntry,
    clearSession,
    deleteDrink,
    deleteWaterEntry,
    drinks,
    setStomachStatus,
    stomachStatus,
    userProfile,
    waterEntries,
  } = useAppState();

  const [now, setNow] = useState(() => new Date());
  const [deleteState, setDeleteState] = useState<DeleteState>({ kind: "none" });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (drinks.length === 0) {
      return;
    }

    const latestDrinkTime = Math.max(...drinks.map((drink) => drink.time.getTime()));
    if (Date.now() - latestDrinkTime > 12 * 60 * 60 * 1000) {
      clearSession().catch(() => undefined);
    }
  }, [clearSession, drinks]);

  const history = useMemo(
    () =>
      [
        ...drinks.map((drink) => ({
          kind: "drink" as const,
          id: drink.id,
          time: drink.time,
          drink,
        })),
        ...waterEntries.map((water) => ({
          kind: "water" as const,
          id: water.id,
          time: water.time,
          water,
        })),
      ]
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 30),
    [drinks, waterEntries],
  );

  if (!hydrated) {
    return <HydrationState />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  const bac = estimateBAC(drinks, userProfile, now, stomachStatus, waterEntries);
  const bacColor = getBacColor(bac);
  const bacStatus = getBacStatus(bac);

  return (
    <AppFrame
      title="Tonight's Tracker"
      description="Private on your device unless you enable group sharing."
      actions={
        <Button render={<Link to="/groups" />} variant="outline" size="sm" className="rounded-full">
          <Users />
          Groups
        </Button>
      }
    >
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.8fr)]">
        <section className="space-y-5">
          <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(249,115,22,0.14),rgba(236,72,153,0.14))] p-5 ring-1 ring-foreground/8">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              Blood Alcohol Level
            </p>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Link to="/bac-graph" className="block">
                  <p
                    className="font-heading text-7xl leading-none sm:text-8xl"
                    style={{ color: bacColor }}
                  >
                    {bac.toFixed(2)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">‰ · Tap for graph</p>
                </Link>
              </div>
              <Badge
                variant="outline"
                className="rounded-full px-4 py-2 text-sm"
                style={{ borderColor: bacColor, color: bacColor }}
              >
                {bacStatus}
              </Badge>
            </div>
          </div>

          <section className="rounded-[1.5rem] bg-muted/35 p-4 ring-1 ring-foreground/8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Stomach</p>
              <p className="text-xs text-muted-foreground">Changes absorption speed</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {stomachOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={stomachStatus === option.value ? "default" : "outline"}
                  className="h-14 rounded-2xl"
                  onClick={() => setStomachStatus(option.value)}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Button
              render={<Link to="/add-drink" />}
              size="lg"
              className="h-12 rounded-2xl text-sm"
            >
              <GlassWater />
              Add Drink
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 rounded-2xl"
              onClick={() => setDeleteState({ kind: "clear" })}
              disabled={history.length === 0}
            >
              Clear
            </Button>
          </div>

          <section className="rounded-[1.5rem] bg-sky-500/6 p-4 ring-1 ring-sky-500/15">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-sky-700 dark:text-sky-300">Quick water log</p>
              <Droplets className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {waterPresets.map((volume) => (
                <Button
                  key={volume}
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl border-sky-500/20 bg-background/80"
                  onClick={() => addWaterEntry(volume)}
                >
                  💧 {volume}ml
                </Button>
              ))}
            </div>
          </section>

          <p className="text-center text-xs text-muted-foreground">
            BAC values are estimates only. Never use this app to judge driving or safety.
          </p>
        </section>

        <section className="space-y-4 p-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-2xl">Recent history</p>
              <p className="text-sm text-muted-foreground">Drinks and water, newest first.</p>
            </div>
            <Button
              render={<Link to="/bac-graph" />}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <TrendingUp />
              Graph
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
                No entries yet. Add a drink to start the session.
              </div>
            ) : (
              history.map((entry) =>
                entry.kind === "drink" ? (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-border/70 bg-background/90 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-2xl bg-muted text-xl">
                        {DRINK_TYPE_EMOJI[entry.drink.type]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{DRINK_TYPE_LABEL[entry.drink.type]}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {entry.drink.volumeMl}ml · {entry.drink.alcoholPercent}% ·{" "}
                          {formatTime(entry.drink.time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        render={<Link to="/edit-drink/$drinkId" params={{ drinkId: entry.id }} />}
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
                        onClick={() =>
                          setDeleteState({ kind: "drink", id: entry.id, label: entry.drink.type })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-sky-500/18 bg-sky-500/6 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-2xl bg-background text-xl">
                        💧
                      </div>
                      <div>
                        <p className="font-medium">Water</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.water.volumeMl}ml · {formatTime(entry.water.time)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-full text-destructive"
                      onClick={() => setDeleteState({ kind: "water", id: entry.id })}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ),
              )
            )}
          </div>
        </section>
      </div>

      <Dialog
        open={deleteState.kind !== "none"}
        onOpenChange={(open) => !open && setDeleteState({ kind: "none" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteState.kind === "clear" ? "Clear history" : "Delete entry"}
            </DialogTitle>
            <DialogDescription>
              {deleteState.kind === "drink"
                ? `Delete this ${deleteState.label} entry?`
                : deleteState.kind === "water"
                  ? "Delete this water entry?"
                  : "This removes all drinks and water entries from the current session."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteState({ kind: "none" })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (deleteState.kind === "drink") {
                  await deleteDrink(deleteState.id);
                } else if (deleteState.kind === "water") {
                  await deleteWaterEntry(deleteState.id);
                } else if (deleteState.kind === "clear") {
                  await clearSession();
                }

                setDeleteState({ kind: "none" });
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}

function HydrationState() {
  return (
    <AppFrame title="Loading" description="Restoring your local session.">
      <div className="grid min-h-[60vh] place-items-center p-10 text-sm text-muted-foreground">
        Restoring local data…
      </div>
    </AppFrame>
  );
}
