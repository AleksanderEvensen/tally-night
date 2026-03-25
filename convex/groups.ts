import { internalMutation, mutation, query, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { UTCDate } from '@date-fns/utc';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const DEFAULT_DRINKS = {
  beer: 0,
  wine: 0,
  spirits: 0,
  cocktails: 0,
  shots: 0,
  ciders_seltzers: 0,
};

// ── Shared helpers (used by mutations across files) ──────────────────────────

/**
 * Deletes a group and all associated data (members + userGroupInfos).
 */
export async function deleteGroupData(ctx: MutationCtx, groupId: Id<'groups'>) {
  const members = await ctx.db
    .query('groupMembers')
    .withIndex('by_group', (q) => q.eq('groupId', groupId))
    .collect();
  for (const member of members) {
    await ctx.db.delete(member._id);
  }

  const infos = await ctx.db
    .query('userGroupInfos')
    .withIndex('by_group', (q) => q.eq('groupId', groupId))
    .collect();
  for (const info of infos) {
    await ctx.db.delete(info._id);
  }

  await ctx.db.delete(groupId);
}

/**
 * Removes a user from a group. Handles admin promotion if needed,
 * and deletes the entire group if the user is the last member.
 *
 * Returns `{ groupDeleted: true }` if the group was deleted.
 */
export async function removeUserFromGroup(
  ctx: MutationCtx,
  groupId: Id<'groups'>,
  userId: Id<'users'>
) {
  const membership = await ctx.db
    .query('groupMembers')
    .withIndex('by_group_user', (q) => q.eq('groupId', groupId).eq('userId', userId))
    .first();

  if (membership === null) {
    return { groupDeleted: false };
  }

  const allMembers = await ctx.db
    .query('groupMembers')
    .withIndex('by_group', (q) => q.eq('groupId', groupId))
    .collect();

  if (allMembers.length === 1) {
    // Last member — delete the entire group
    await deleteGroupData(ctx, groupId);
    return { groupDeleted: true };
  }

  // If user is the only admin, promote another member
  if (membership.memberType === 'admin') {
    const admins = allMembers.filter((m) => m.memberType === 'admin');
    if (admins.length === 1) {
      const otherMember = allMembers.find((m) => m.userId !== userId && m.memberType === 'member');
      if (otherMember) {
        await ctx.db.patch(otherMember._id, {
          memberType: 'admin' as const,
        });
      }
    }
  }

  // Remove membership
  await ctx.db.delete(membership._id);

  // Remove userGroupInfo
  const info = await ctx.db
    .query('userGroupInfos')
    .withIndex('by_group_user', (q) => q.eq('groupId', groupId).eq('userId', userId))
    .first();
  if (info !== null) {
    await ctx.db.delete(info._id);
  }

  return { groupDeleted: false };
}

// ── Public mutations & queries ───────────────────────────────────────────────

export const createGroup = mutation({
  args: {
    name: v.string(),
    userId: v.id('users'),
    expiresInHours: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const { name, userId } = args;
    const expiresInHours = args.expiresInHours ?? 24;

    if (name.length < 2) {
      throw new Error('Group name must be at least 2 characters long');
    }

    // Generate a unique join code
    let joinCode = generateJoinCode();
    let existing = await ctx.db
      .query('groups')
      .withIndex('by_joinCode', (q) => q.eq('joinCode', joinCode))
      .first();
    while (existing !== null) {
      joinCode = generateJoinCode();
      existing = await ctx.db
        .query('groups')
        .withIndex('by_joinCode', (q) => q.eq('joinCode', joinCode))
        .first();
    }

    const now = new UTCDate().getTime();
    const expires = now + expiresInHours * 60 * 60 * 1000;

    const groupId = await ctx.db.insert('groups', {
      name,
      joinCode,
      expires,
    });

    // Add creator as admin
    await ctx.db.insert('groupMembers', {
      groupId,
      userId,
      memberType: 'admin',
    });

    // Initialize drink tracking for the creator
    await ctx.db.insert('userGroupInfos', {
      userId,
      groupId,
      drinks: DEFAULT_DRINKS,
      bloodAlcoholLevel: 0,
    });

    return { groupId, joinCode };
  },
});

export const joinGroup = mutation({
  args: {
    joinCode: v.string(),
    userId: v.id('users'),
  },
  async handler(ctx, args) {
    const { joinCode, userId } = args;

    const group = await ctx.db
      .query('groups')
      .withIndex('by_joinCode', (q) => q.eq('joinCode', joinCode.toUpperCase()))
      .first();

    if (group === null) {
      throw new Error('Invalid join code');
    }

    // Check if group has expired
    const now = new UTCDate().getTime();
    if (now > group.expires) {
      throw new Error('This group has expired');
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query('groupMembers')
      .withIndex('by_group_user', (q) => q.eq('groupId', group._id).eq('userId', userId))
      .first();

    if (existingMembership !== null) {
      throw new Error('You are already a member of this group');
    }

    // Add user as member
    await ctx.db.insert('groupMembers', {
      groupId: group._id,
      userId,
      memberType: 'member',
    });

    // Initialize drink tracking
    await ctx.db.insert('userGroupInfos', {
      userId,
      groupId: group._id,
      drinks: DEFAULT_DRINKS,
      bloodAlcoholLevel: 0,
    });

    return { groupId: group._id, groupName: group.name };
  },
});

export const getLeaderboard = query({
  args: {
    groupId: v.id('groups'),
  },
  async handler(ctx, args) {
    const { groupId } = args;

    const group = await ctx.db.get(groupId);
    if (group === null) {
      return null;
    }

    // Get all user group infos sorted by BAC descending
    const userGroupInfos = await ctx.db
      .query('userGroupInfos')
      .withIndex('by_group_bac', (q) => q.eq('groupId', groupId))
      .order('desc')
      .collect();

    // Enrich with user names
    const leaderboard = await Promise.all(
      userGroupInfos.map(async (info) => {
        const user = await ctx.db.get(info.userId);
        return {
          userId: info.userId,
          name: user?.name ?? 'Unknown',
          drinks: info.drinks,
          bloodAlcoholLevel: info.bloodAlcoholLevel,
        };
      })
    );

    return {
      groupName: group.name,
      joinCode: group.joinCode,
      expires: group.expires,
      leaderboard,
    };
  },
});

export const updateDrinks = mutation({
  args: {
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
  },
  async handler(ctx, args) {
    const { userId, groupId, drinks, bloodAlcoholLevel } = args;

    const info = await ctx.db
      .query('userGroupInfos')
      .withIndex('by_group_user', (q) => q.eq('groupId', groupId).eq('userId', userId))
      .first();

    if (info === null) {
      throw new Error('You are not a member of this group');
    }

    // Validate drink counts are non-negative
    for (const [type, count] of Object.entries(drinks)) {
      if (count < 0) {
        throw new Error(`${type} count cannot be negative`);
      }
    }

    // Validate BAC is non-negative
    if (bloodAlcoholLevel < 0) {
      throw new Error('Blood alcohol level cannot be negative');
    }

    // Use client-provided BAC (computed on-device using the full pharmacokinetic model)
    await ctx.db.patch(info._id, {
      drinks,
      bloodAlcoholLevel,
    });

    return { bloodAlcoholLevel };
  },
});

export const getMyGroups = query({
  args: {
    userId: v.id('users'),
  },
  async handler(ctx, args) {
    const { userId } = args;

    const memberships = await ctx.db
      .query('groupMembers')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        if (group === null) return null;
        return {
          groupId: group._id,
          name: group.name,
          joinCode: group.joinCode,
          expires: group.expires,
          memberType: membership.memberType,
        };
      })
    );

    return groups.filter((g) => g !== null);
  },
});

export const deleteGroup = mutation({
  args: {
    groupId: v.id('groups'),
    userId: v.id('users'),
  },
  async handler(ctx, args) {
    const { groupId, userId } = args;

    // Only admins can delete groups
    const membership = await ctx.db
      .query('groupMembers')
      .withIndex('by_group_user', (q) => q.eq('groupId', groupId).eq('userId', userId))
      .first();

    if (membership === null || membership.memberType !== 'admin') {
      throw new Error('Only group admins can delete a group');
    }

    await deleteGroupData(ctx, groupId);

    return true;
  },
});

export const leaveGroup = mutation({
  args: {
    groupId: v.id('groups'),
    userId: v.id('users'),
  },
  async handler(ctx, args) {
    const { groupId, userId } = args;

    const membership = await ctx.db
      .query('groupMembers')
      .withIndex('by_group_user', (q) => q.eq('groupId', groupId).eq('userId', userId))
      .first();

    if (membership === null) {
      throw new Error('You are not a member of this group');
    }

    const { groupDeleted } = await removeUserFromGroup(ctx, groupId, userId);
    return { deleted: groupDeleted };
  },
});

// ── Internal mutations (called by crons) ─────────────────────────────────────

export const deleteOldGroups = internalMutation({
  args: {
    maxAge: v.number(),
  },
  async handler(ctx, args) {
    const now = new UTCDate().getTime();
    const cutoff = now - args.maxAge;

    const allGroups = await ctx.db.query('groups').collect();
    const expiredGroups = allGroups.filter((g) => g.expires < cutoff);

    for (const group of expiredGroups) {
      await deleteGroupData(ctx, group._id);
    }

    return { deletedCount: expiredGroups.length };
  },
});
