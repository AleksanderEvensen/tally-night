import { defineRelations } from "drizzle-orm";

import * as schema from "./schema.ts";

export const relations = defineRelations(schema, (r) => ({
  users: {
    groups: r.many.groups({
      from: r.users.id.through(r.groupMembers.userId),
      to: r.groups.id.through(r.groupMembers.groupId),
    }),
    groupInfos: r.many.userGroupInfos({
      from: r.users.id,
      to: r.userGroupInfos.userId,
    }),
  },
  groups: {
    members: r.many.users({
      from: r.groups.id.through(r.groupMembers.groupId),
      to: r.users.id.through(r.groupMembers.userId),
    }),
    groupInfos: r.many.userGroupInfos({
      from: r.groups.id,
      to: r.userGroupInfos.groupId,
    }),
  },
  userGroupInfos: {
    user: r.one.users({
      from: r.userGroupInfos.userId,
      to: r.users.id,
    }),
    group: r.one.groups({
      from: r.userGroupInfos.groupId,
      to: r.groups.id,
    }),
  },
}));
