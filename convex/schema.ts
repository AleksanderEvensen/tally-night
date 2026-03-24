import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    joinCode: v.string(),
    expires: v.number(),
  }).index('by_joinCode', ['joinCode']),

  groupMembers: defineTable({
    groupId: v.id('groups'),
    userId: v.id('users'),
    memberType: v.union(v.literal('admin'), v.literal('member')),
  })
    .index('by_user', ['userId'])
    .index('by_group', ['groupId'])
    .index('by_group_user', ['groupId', 'userId'])
    .index('by_group_memberType', ['groupId', 'memberType']),

  userGroupInfos: defineTable({
    userId: v.id('users'),
    groupId: v.id('groups'),
    drinks: v.object({
      beer: v.number(),
      wine: v.number(),
      spirits: v.number(),
      cocktails: v.number(),
      shots: v.number(),
      ciders_seltzers: v.number(),
    }),
    bloodAlcoholLevel: v.number(),
  })
    // For efficiently looking up all the groups a users is in
    .index('by_user', ['userId'])
    // For efficiently looking up a group
    .index('by_group', ['groupId'])
    // For efficiently looking up a user's info in a group
    .index('by_group_user', ['groupId', 'userId'])
    // For Sorting leaderboards
    .index('by_group_bac', ['groupId', 'bloodAlcoholLevel']),

  users: defineTable({
    name: v.string(),
    lastSeen: v.number(),
  }).index('by_lastSeen', ['lastSeen']),
});
