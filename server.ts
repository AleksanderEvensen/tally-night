import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { deleteOldGroups } from "#/services/groups.ts";
import { deleteOldUsers } from "#/services/users.ts";

const tanstackEntry = createServerEntry({
  fetch: handler.fetch,
});

export default {
  ...tanstackEntry,
  async scheduled(event: ScheduledEvent) {
    switch (event.cron) {
      case "0 7 * * *":
        await deleteOldGroups();
        await deleteOldUsers();
        break;
    }
  },
};
