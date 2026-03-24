import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

const MAX_GROUP_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days
const MAX_USER_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

crons.daily(
  "remove-old-groups",
  {
    hourUTC: 7,
    minuteUTC: 0,
  },
  internal.groups.deleteOldGroups,
  { maxAge: MAX_GROUP_AGE },
);

crons.daily(
  "remove-old-users",
  {
    hourUTC: 7,
    minuteUTC: 0,
  },
  internal.users.deleteOldUsers,
  { maxAge: MAX_USER_AGE },
);

export default crons;
