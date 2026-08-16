import { db } from "#/drizzle";
import { users } from "#/drizzle/schema.ts";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq, lt } from "drizzle-orm";
import { removeUserFromGroup } from "./groups.ts";

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }) => {
    const { name } = data;

    if (name.length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    const [user] = await db
      .insert(users)
      .values({ name, lastSeen: Date.now() })
      .returning({ id: users.id });

    return user.id;
  });

export const registerLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: number }) => input)
  .handler(async ({ data }) => {
    await db.update(users).set({ lastSeen: Date.now() }).where(eq(users.id, data.userId));
  });

export const deleteUserData = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: number }) => input)
  .handler(async ({ data }) => {
    const { userId } = data;

    const memberships = await db.query.groupMembers.findMany({
      where: { userId },
    });

    for (const membership of memberships) {
      await removeUserFromGroup(membership.groupId, userId);
    }

    return true;
  });

export const updateUser = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: number; name?: string }) => input)
  .handler(async ({ data }) => {
    const { userId, name } = data;

    if (name != null) {
      if (name.length < 2) {
        throw new Error("Name must be at least 2 characters long");
      }
      await db.update(users).set({ name }).where(eq(users.id, userId));
    }
  });

// -- Cron handler ------------------------------------------------------------

const MAX_USER_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

export const deleteOldUsers = createServerOnlyFn(async (maxAge: number = MAX_USER_AGE) => {
  const now = Date.now();
  const cutoff = now - maxAge;

  const staleUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(lt(users.lastSeen, cutoff));

  for (const user of staleUsers) {
    const memberships = await db.query.groupMembers.findMany({
      where: { userId: user.id },
    });

    for (const membership of memberships) {
      await removeUserFromGroup(membership.groupId, user.id);
    }

    await db.delete(users).where(eq(users.id, user.id));
  }

  return { deletedCount: staleUsers.length };
});
