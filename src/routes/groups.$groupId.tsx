import { useState } from "react";
import { Navigate, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

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
import { formatExpiry } from "#/lib/format";
import { getBacColor } from "#/lib/group-sharing";
import { getLeaderboard, leaveGroup } from "#/services/groups";

export const Route = createFileRoute("/groups/$groupId")({
  component: GroupSessionPage,
});

function GroupSessionPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { groupId } = Route.useParams();
  const { dataConsent, serverIdentity, userProfile } = useAppState();
  const getLeaderboardFn = useServerFn(getLeaderboard);
  const leaveGroupFn = useServerFn(leaveGroup);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["leaderboard", groupId],
    queryFn: () => getLeaderboardFn({ data: { groupId } }),
    enabled: hydrated && Boolean(dataConsent && serverIdentity && userProfile),
    refetchInterval: 30_000,
  });

  if (!hydrated) {
    return <AppFrame title="Session" backHref="/groups" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  if (!dataConsent || !serverIdentity) {
    return <Navigate to="/privacy" />;
  }

  if (data === null) {
    return <Navigate to="/groups" />;
  }

  if (!data) {
    return (
      <AppFrame title="Session" backHref="/groups">
        <div className="grid min-h-[50vh] place-items-center p-8 text-sm text-muted-foreground">
          Loading session…
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title={data.groupName}
      backHref="/groups"
      description={`${data.joinCode} · ${formatExpiry(data.expires)}`}
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => navigator.clipboard.writeText(data.joinCode)}
          >
            Copy join code
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => setLeaveOpen(true)}
          >
            Leave group
          </Button>
        </div>

        <div className="space-y-3">
          {data.leaderboard.map((member, index) => {
            const isMe = member.userId === serverIdentity.userId;
            return (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-background/85 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-2xl bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.name}
                      {isMe ? " (you)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      🍺 {member.drinks.beer} · 🍷 {member.drinks.wine} · 🥃{" "}
                      {member.drinks.spirits + member.drinks.shots} · 🍸 {member.drinks.cocktails} ·
                      🍏 {member.drinks.ciders_seltzers}
                    </p>
                  </div>
                </div>
                <p
                  className="font-heading text-3xl"
                  style={{ color: getBacColor(member.bloodAlcoholLevel) }}
                >
                  {member.bloodAlcoholLevel.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Shared view includes only display names, BAC estimates, and drink counts by category.
        </p>
      </div>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave group?</DialogTitle>
            <DialogDescription>
              You can join again later if the group has not expired.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLeaveOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                await leaveGroupFn({ data: { groupId, userId: serverIdentity.userId } });
                await queryClient.invalidateQueries({
                  queryKey: ["groups", serverIdentity.userId],
                });
                await navigate({ to: "/groups" });
              }}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}
