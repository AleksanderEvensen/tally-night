import { useState } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, DoorOpen, Lock, Trash2 } from "lucide-react";

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
import { useAppState } from "#/hooks/use-app-state";
import { useHydrated } from "#/hooks/use-hydrated";
import { formatExpiry } from "#/lib/format";
import { deleteGroup, getMyGroups, leaveGroup } from "#/services/groups";

export const Route = createFileRoute("/groups/")({
  component: GroupsPage,
});

type DialogState = { kind: "leave" | "delete"; groupId: string; groupName: string } | null;

function GroupsPage() {
  const hydrated = useHydrated();
  const queryClient = useQueryClient();
  const { dataConsent, serverIdentity, userProfile } = useAppState();
  const getMyGroupsFn = useServerFn(getMyGroups);
  const leaveGroupFn = useServerFn(leaveGroup);
  const deleteGroupFn = useServerFn(deleteGroup);
  const [dialogState, setDialogState] = useState<DialogState>(null);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", serverIdentity?.userId],
    queryFn: () => getMyGroupsFn({ data: { userId: serverIdentity!.userId } }),
    enabled: hydrated && Boolean(dataConsent && serverIdentity && userProfile),
  });

  if (!hydrated) {
    return <AppFrame title="Groups" backHref="/" />;
  }

  if (!userProfile) {
    return <Navigate to="/onboarding" />;
  }

  if (!dataConsent || !serverIdentity) {
    return (
      <AppFrame
        title="Groups"
        backHref="/"
        description="Sharing is required for live group sessions."
      >
        <div className="grid min-h-[55vh] place-items-center p-8 text-center">
          <div className="max-w-md space-y-4">
            <Lock className="mx-auto size-10 text-muted-foreground" />
            <p className="font-heading text-3xl">Groups are off</p>
            <p className="text-sm text-muted-foreground">
              To join or create live groups, enable data sharing for your display name, BAC, and
              drink counts.
            </p>
            <Button render={<Link to="/privacy" />} size="lg" className="h-11 rounded-2xl">
              Open privacy settings
            </Button>
          </div>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title="Groups"
      backHref="/"
      description="Create a room or join one with a six-character code."
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button render={<Link to="/groups/create" />} size="lg" className="h-12 rounded-2xl">
            Create group
          </Button>
          <Button
            render={<Link to="/groups/join" />}
            variant="outline"
            size="lg"
            className="h-12 rounded-2xl"
          >
            Join by code
          </Button>
        </div>

        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
              No active groups yet.
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.groupId}
                className="rounded-[1.5rem] border border-border/70 bg-background/85 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Code {group.joinCode} · {formatExpiry(group.expires)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {group.memberType === "admin" ? (
                      <Badge variant="outline" className="rounded-full">
                        <Crown className="mr-1 size-3.5" />
                        Admin
                      </Badge>
                    ) : null}
                    <Button
                      render={<Link to="/groups/$groupId" params={{ groupId: group.groupId }} />}
                      size="sm"
                      className="rounded-full"
                    >
                      Open
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {group.memberType === "admin" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        setDialogState({
                          kind: "delete",
                          groupId: group.groupId,
                          groupName: group.name,
                        })
                      }
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      setDialogState({
                        kind: "leave",
                        groupId: group.groupId,
                        groupName: group.name,
                      })
                    }
                  >
                    <DoorOpen />
                    Leave
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={dialogState !== null} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState?.kind === "delete" ? "Delete group?" : "Leave group?"}
            </DialogTitle>
            <DialogDescription>
              {dialogState?.kind === "delete"
                ? `Delete "${dialogState.groupName}" for everyone?`
                : `Leave "${dialogState?.groupName}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogState(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={dialogState?.kind === "delete" ? "destructive" : "default"}
              onClick={async () => {
                if (!dialogState) {
                  return;
                }

                if (dialogState.kind === "delete") {
                  await deleteGroupFn({
                    data: { groupId: dialogState.groupId, userId: serverIdentity.userId },
                  });
                } else {
                  await leaveGroupFn({
                    data: { groupId: dialogState.groupId, userId: serverIdentity.userId },
                  });
                }

                await queryClient.invalidateQueries({
                  queryKey: ["groups", serverIdentity.userId],
                });
                setDialogState(null);
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
