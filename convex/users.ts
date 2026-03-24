import { internalMutation, mutation } from './_generated/server';
import { v } from 'convex/values';
import { UTCDate } from '@date-fns/utc';
import { removeUserFromGroup } from './groups';

export const registerUser = mutation({
  args: {
    name: v.string(),
  },
  async handler(ctx, args) {
    const { name } = args;

    if (name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    const userId = await ctx.db.insert('users', {
      name,
      lastSeen: new UTCDate().getTime(),
    });

    return userId;
  },
});

export const registerLogin = mutation({
  args: {
    userId: v.id('users'),
  },
  async handler(ctx, args) {
    const { userId } = args;
    await ctx.db.patch(userId, {
      lastSeen: new UTCDate().getTime(),
    });
  },
});

export const deleteUserData = mutation({
  args: {
    userId: v.id('users'),
  },
  async handler(ctx, args) {
    const { userId } = args;

    const memberships = await ctx.db
      .query('groupMembers')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    for (const membership of memberships) {
      await removeUserFromGroup(ctx, membership.groupId, userId);
    }

    // Do not delete the user table entry (will be recreated on next login)

    return true;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    name: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const { userId, name } = args;

    if (name != null) {
      if (name.length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }
      await ctx.db.patch(userId, { name });
    }

    // Add more if more fields are added in the future
  },
});

export const deleteOldUsers = internalMutation({
  args: {
    maxAge: v.number(),
  },
  async handler(ctx, args) {
    const now = new UTCDate().getTime();
    const cutoff = now - args.maxAge;

    const staleUsers = await ctx.db
      .query('users')
      .withIndex('by_lastSeen')
      .filter((q) => q.lt(q.field('lastSeen'), cutoff))
      .collect();

    for (const user of staleUsers) {
      const memberships = await ctx.db
        .query('groupMembers')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();

      for (const membership of memberships) {
        await removeUserFromGroup(ctx, membership.groupId, user._id);
      }

      // Delete the user record itself
      await ctx.db.delete(user._id);
    }

    return { deletedCount: staleUsers.length };
  },
});
