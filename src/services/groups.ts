import { db } from "#/drizzle";
import { groups, groupMembers, userGroupInfos, users } from "#/drizzle/schema.ts";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq, and, lt, desc } from "drizzle-orm";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const deleteGroupData = createServerOnlyFn(async (groupId: string) => {
  await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
  await db.delete(userGroupInfos).where(eq(userGroupInfos.groupId, groupId));
  await db.delete(groups).where(eq(groups.id, groupId));
});

export const removeUserFromGroup = createServerOnlyFn(async (groupId: string, userId: number) => {
  const membership = await db.query.groupMembers.findFirst({
    where: { groupId, userId },
  });

  if (!membership) {
    return { groupDeleted: false };
  }

  const allMembers = await db.query.groupMembers.findMany({
    where: { groupId },
  });

  if (allMembers.length === 1) {
    await deleteGroupData(groupId);
    return { groupDeleted: true };
  }

  // If user is the only admin, promote another member
  if (membership.memberType === "admin") {
    const admins = allMembers.filter((m) => m.memberType === "admin");
    if (admins.length === 1) {
      const otherMember = allMembers.find((m) => m.userId !== userId && m.memberType === "member");
      if (otherMember) {
        await db
          .update(groupMembers)
          .set({ memberType: "admin" })
          .where(
            and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, otherMember.userId)),
          );
      }
    }
  }

  // Remove membership
  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

  // Remove userGroupInfo
  await db
    .delete(userGroupInfos)
    .where(and(eq(userGroupInfos.groupId, groupId), eq(userGroupInfos.userId, userId)));

  return { groupDeleted: false };
});

// -- Public server functions -------------------------------------------------

export const createGroup = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; userId: number; expiresInHours?: number }) => input)
  .handler(async ({ data }) => {
    const { name, userId } = data;
    const expiresInHours = data.expiresInHours ?? 24;

    if (name.length < 2) {
      throw new Error("Group name must be at least 2 characters long");
    }

    // Generate a unique join code
    let joinCode = generateJoinCode();
    let existing = await db.query.groups.findFirst({
      where: { joinCode },
    });
    while (existing) {
      joinCode = generateJoinCode();
      existing = await db.query.groups.findFirst({
        where: { joinCode },
      });
    }

    const now = Date.now();
    const expires = now + expiresInHours * 60 * 60 * 1000;

    const [group] = await db
      .insert(groups)
      .values({ name, joinCode, expires })
      .returning({ id: groups.id });

    const groupId = group.id;

    // Add creator as admin
    await db.insert(groupMembers).values({ groupId, userId, memberType: "admin" });

    // Initialize drink tracking
    await db.insert(userGroupInfos).values({ userId, groupId });

    return { groupId, joinCode };
  });

export const joinGroup = createServerFn({ method: "POST" })
  .inputValidator((input: { joinCode: string; userId: number }) => input)
  .handler(async ({ data }) => {
    const { joinCode, userId } = data;

    const group = await db.query.groups.findFirst({
      where: { joinCode: joinCode.toUpperCase() },
    });

    if (!group) {
      throw new Error("Invalid join code");
    }

    if (Date.now() > group.expires) {
      throw new Error("This group has expired");
    }

    const existingMembership = await db.query.groupMembers.findFirst({
      where: { groupId: group.id, userId },
    });

    if (existingMembership) {
      throw new Error("You are already a member of this group");
    }

    await db.insert(groupMembers).values({ groupId: group.id, userId, memberType: "member" });
    await db.insert(userGroupInfos).values({ userId, groupId: group.id });

    return { groupId: group.id, groupName: group.name };
  });

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((input: { groupId: string }) => input)
  .handler(async ({ data }) => {
    const { groupId } = data;

    const group = await db.query.groups.findFirst({
      where: { id: groupId },
    });

    if (!group) {
      return null;
    }

    const infos = await db
      .select({
        userId: userGroupInfos.userId,
        beer: userGroupInfos.beer,
        wine: userGroupInfos.wine,
        spirits: userGroupInfos.spirits,
        cocktails: userGroupInfos.cocktails,
        shots: userGroupInfos.shots,
        cidersSeltzers: userGroupInfos.cidersSeltzers,
        bloodAlcoholLevel: userGroupInfos.bloodAlcoholLevel,
        userName: users.name,
      })
      .from(userGroupInfos)
      .leftJoin(users, eq(userGroupInfos.userId, users.id))
      .where(eq(userGroupInfos.groupId, groupId))
      .orderBy(desc(userGroupInfos.bloodAlcoholLevel));

    const leaderboard = infos.map((info) => ({
      userId: info.userId,
      name: info.userName ?? "Unknown",
      drinks: {
        beer: info.beer,
        wine: info.wine,
        spirits: info.spirits,
        cocktails: info.cocktails,
        shots: info.shots,
        ciders_seltzers: info.cidersSeltzers,
      },
      bloodAlcoholLevel: info.bloodAlcoholLevel,
    }));

    return {
      groupName: group.name,
      joinCode: group.joinCode,
      expires: group.expires,
      leaderboard,
    };
  });

export const updateDrinks = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      userId: number;
      groupId: string;
      drinks: {
        beer: number;
        wine: number;
        spirits: number;
        cocktails: number;
        shots: number;
        ciders_seltzers: number;
      };
      bloodAlcoholLevel: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { userId, groupId, drinks, bloodAlcoholLevel } = data;

    const info = await db.query.userGroupInfos.findFirst({
      where: { groupId, userId },
    });

    if (!info) {
      throw new Error("You are not a member of this group");
    }

    for (const [type, count] of Object.entries(drinks)) {
      if (count < 0) {
        throw new Error(`${type} count cannot be negative`);
      }
    }

    if (bloodAlcoholLevel < 0) {
      throw new Error("Blood alcohol level cannot be negative");
    }

    await db
      .update(userGroupInfos)
      .set({
        beer: drinks.beer,
        wine: drinks.wine,
        spirits: drinks.spirits,
        cocktails: drinks.cocktails,
        shots: drinks.shots,
        cidersSeltzers: drinks.ciders_seltzers,
        bloodAlcoholLevel,
      })
      .where(eq(userGroupInfos.id, info.id));

    return { bloodAlcoholLevel };
  });

export const getMyGroups = createServerFn({ method: "GET" })
  .inputValidator((input: { userId: number }) => input)
  .handler(async ({ data }) => {
    const { userId } = data;

    const memberships = await db.query.groupMembers.findMany({
      where: { userId },
    });

    const result = await Promise.all(
      memberships.map(async (membership) => {
        const group = await db.query.groups.findFirst({
          where: { id: membership.groupId },
        });
        if (!group) return null;
        return {
          groupId: group.id,
          name: group.name,
          joinCode: group.joinCode,
          expires: group.expires,
          memberType: membership.memberType,
        };
      }),
    );

    return result.filter((g) => g !== null);
  });

export const deleteGroup = createServerFn({ method: "POST" })
  .inputValidator((input: { groupId: string; userId: number }) => input)
  .handler(async ({ data }) => {
    const { groupId, userId } = data;

    const membership = await db.query.groupMembers.findFirst({
      where: { groupId, userId },
    });

    if (!membership || membership.memberType !== "admin") {
      throw new Error("Only group admins can delete a group");
    }

    await deleteGroupData(groupId);
    return true;
  });

export const leaveGroup = createServerFn({ method: "POST" })
  .inputValidator((input: { groupId: string; userId: number }) => input)
  .handler(async ({ data }) => {
    const { groupId, userId } = data;

    const membership = await db.query.groupMembers.findFirst({
      where: { groupId, userId },
    });

    if (!membership) {
      throw new Error("You are not a member of this group");
    }

    const { groupDeleted } = await removeUserFromGroup(groupId, userId);
    return { deleted: groupDeleted };
  });

// -- Cron handler ------------------------------------------------------------

const MAX_GROUP_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

export const deleteOldGroups = createServerOnlyFn(async (maxAge: number = MAX_GROUP_AGE) => {
  const now = Date.now();
  const cutoff = now - maxAge;

  const expiredGroups = await db
    .select({ id: groups.id })
    .from(groups)
    .where(lt(groups.expires, cutoff));

  for (const group of expiredGroups) {
    await deleteGroupData(group.id);
  }

  return { deletedCount: expiredGroups.length };
});
