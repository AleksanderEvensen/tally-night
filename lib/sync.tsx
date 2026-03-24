import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { estimateBAC } from './bac';
import { mapDrinksToCounts } from './convex';
import { useApp } from './context';

/**
 * SyncProvider: auto-syncs BAC and drink counts to the backend for all groups.
 *
 * Only active when dataConsent is true and a convexUserId exists.
 * Debounces updates by 2 seconds after changes, and refreshes every 30 seconds
 * to reflect natural BAC decline.
 *
 * Data sent: ONLY { userId, groupId, drinks counts, bloodAlcoholLevel }
 * Never sent: timestamps, weight, gender, stomach status, water data
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { dataConsent, convexUserId, drinks, userInfo, stomachStatus, waterEntries } = useApp();

  const isActive = dataConsent && !!convexUserId && !!userInfo;

  const groups = useQuery(
    api.groups.getMyGroups,
    isActive ? { userId: convexUserId as Id<'users'> } : 'skip'
  );

  const updateDrinks = useMutation(api.groups.updateDrinks);
  const registerLogin = useMutation(api.users.registerLogin);

  // Fire registerLogin on startup (once)
  const hasLoggedIn = useRef(false);
  useEffect(() => {
    if (!isActive || hasLoggedIn.current) return;
    hasLoggedIn.current = true;
    registerLogin({ userId: convexUserId as Id<'users'> }).catch(() => {
      // Non-critical
    });
  }, [isActive, convexUserId, registerLogin]);

  // Sync drinks & BAC to all groups
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive || !groups || groups.length === 0) return;

    function doSync() {
      if (!userInfo || !convexUserId) return;

      const now = new Date();
      const bac = estimateBAC(drinks, userInfo, now, stomachStatus, waterEntries);
      const counts = mapDrinksToCounts(drinks);

      for (const group of groups!) {
        updateDrinks({
          userId: convexUserId as Id<'users'>,
          groupId: group.groupId as Id<'groups'>,
          drinks: counts,
          bloodAlcoholLevel: bac,
        }).catch(() => {
          // Best-effort — don't crash on network failure
        });
      }
    }

    // Debounced sync on data change (2 seconds)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(doSync, 2_000);

    // Periodic refresh every 30 seconds (for BAC decline)
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(doSync, 30_000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, groups, drinks, userInfo, stomachStatus, waterEntries, convexUserId, updateDrinks]);

  return children;
}
