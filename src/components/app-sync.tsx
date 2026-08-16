import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useAppState } from "#/hooks/use-app-state";
import { estimateBAC } from "#/lib/bac";
import { mapDrinksToCounts } from "#/lib/group-sharing";
import { getMyGroups, updateDrinks } from "#/services/groups";
import { registerLogin } from "#/services/users";

export function AppSync() {
  const { dataConsent, drinks, serverIdentity, stomachStatus, userProfile, waterEntries } =
    useAppState();

  const getMyGroupsFn = useServerFn(getMyGroups);
  const updateDrinksFn = useServerFn(updateDrinks);
  const registerLoginFn = useServerFn(registerLogin);

  const activeUserId = dataConsent && serverIdentity && userProfile ? serverIdentity.userId : null;
  const hasLoggedIn = useRef<number | null>(null);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", activeUserId],
    queryFn: () => getMyGroupsFn({ data: { userId: activeUserId! } }),
    enabled: activeUserId !== null,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (activeUserId === null || hasLoggedIn.current === activeUserId) {
      return;
    }

    hasLoggedIn.current = activeUserId;
    registerLoginFn({ data: { userId: activeUserId } }).catch(() => undefined);
  }, [activeUserId, registerLoginFn]);

  useEffect(() => {
    if (activeUserId === null || groups.length === 0 || !userProfile) {
      return;
    }

    const sync = () => {
      const bac = estimateBAC(drinks, userProfile, new Date(), stomachStatus, waterEntries);
      const counts = mapDrinksToCounts(drinks);

      for (const group of groups) {
        updateDrinksFn({
          data: {
            userId: activeUserId,
            groupId: group.groupId,
            drinks: counts,
            bloodAlcoholLevel: bac,
          },
        }).catch(() => undefined);
      }
    };

    const timeout = window.setTimeout(sync, 1_500);
    const interval = window.setInterval(sync, 30_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [activeUserId, drinks, groups, stomachStatus, updateDrinksFn, userProfile, waterEntries]);

  return null;
}
