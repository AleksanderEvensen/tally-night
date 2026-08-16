import { Navigate, createFileRoute } from "@tanstack/react-router";

import { AppFrame } from "#/components/app-frame";
import { Badge } from "#/components/ui/badge";
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";
import { estimateBAC } from "#/lib/bac";
import { formatTime } from "#/lib/format";
import { getBacColor } from "#/lib/group-sharing";

export const Route = createFileRoute("/bac-graph")({
  component: BacGraphPage,
});

function BacGraphPage() {
  const hydrated = useHydrated();
  const { drinks, stomachStatus, userProfile, waterEntries } = useAppState();

  if (!hydrated) {
    return <AppFrame title="BAC graph" backHref="/" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  if (drinks.length === 0) {
    return (
      <AppFrame title="BAC graph" backHref="/">
        <div className="grid min-h-[50vh] place-items-center p-8 text-center text-sm text-muted-foreground">
          No drink data yet. Add some drinks to see the graph.
        </div>
      </AppFrame>
    );
  }

  const sorted = [...drinks].sort((a, b) => a.time.getTime() - b.time.getTime());
  const firstDrinkTime = sorted[0].time.getTime();
  const now = Date.now();
  const points: Array<{ time: number; bac: number }> = [];

  for (let t = firstDrinkTime; t <= now + 2 * 60 * 60 * 1000; t += 15 * 60 * 1000) {
    const bac = estimateBAC(drinks, userProfile, new Date(t), stomachStatus, waterEntries);
    points.push({ time: t, bac });
    if (bac === 0 && t > now) {
      break;
    }
  }

  const maxBac = Math.max(0.5, ...points.map((point) => point.bac));
  const start = points[0].time;
  const end = points[points.length - 1].time;
  const currentBac = estimateBAC(drinks, userProfile, new Date(now), stomachStatus, waterEntries);
  const line = points
    .map((point) => {
      const x = ((point.time - start) / (end - start || 1)) * 100;
      const y = 100 - (point.bac / maxBac) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const xLabels = [start, start + (end - start) / 2, end];

  return (
    <AppFrame title="BAC graph" backHref="/" description="From first drink to projected sobriety.">
      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              Current level
            </p>
            <p className="mt-2 font-heading text-5xl" style={{ color: getBacColor(currentBac) }}>
              {currentBac.toFixed(2)}‰
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-4 py-2 text-sm">
            {points.length} samples
          </Badge>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-muted/20 p-4">
          <svg viewBox="0 0 100 100" className="aspect-[16/9] w-full overflow-visible">
            {[0, 50, 100].map((lineY) => (
              <line
                key={lineY}
                x1="0"
                y1={lineY}
                x2="100"
                y2={lineY}
                stroke="currentColor"
                opacity="0.1"
              />
            ))}
            <polyline fill="none" stroke="url(#bac-gradient)" strokeWidth="2.5" points={line} />
            <defs>
              <linearGradient id="bac-gradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            {xLabels.map((time) => (
              <span key={time}>{formatTime(new Date(time))}</span>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Graph shows the estimated curve based on drink timing, stomach status, and nearby water
          intake.
        </p>
      </div>
    </AppFrame>
  );
}
