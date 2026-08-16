import { sqliteTable as table } from "drizzle-orm/sqlite-core";
import * as t from "drizzle-orm/sqlite-core";
import { uuidv7 } from "uuidv7";

export const users = table("users", {
  id: t.int().primaryKey({ autoIncrement: true }),
  name: t.text().notNull(),
  lastSeen: t.int().notNull(),
});

export const groups = table("groups", {
  id: t.text().primaryKey().$defaultFn(uuidv7),
  name: t.text().notNull(),
  joinCode: t.text().notNull().unique(),
  expires: t.int().notNull(),
});

export const groupMembers = table(
  "group_members",
  {
    userId: t
      .int()
      .notNull()
      .references(() => users.id),
    groupId: t
      .text()
      .notNull()
      .references(() => groups.id),
    memberType: t.text({ enum: ["admin", "member"] }).notNull(),
  },
  (def) => [t.primaryKey({ columns: [def.userId, def.groupId] })],
);

export const userGroupInfos = table(
  "user_group_infos",
  {
    id: t.int().primaryKey({ autoIncrement: true }),
    userId: t
      .int()
      .notNull()
      .references(() => users.id),
    groupId: t
      .text()
      .notNull()
      .references(() => groups.id),
    beer: t.int().notNull().default(0),
    wine: t.int().notNull().default(0),
    spirits: t.int().notNull().default(0),
    cocktails: t.int().notNull().default(0),
    shots: t.int().notNull().default(0),
    cidersSeltzers: t.int("ciders_seltzers").notNull().default(0),
    bloodAlcoholLevel: t.real("blood_alcohol_level").notNull().default(0),
  },
  (def) => [t.unique().on(def.groupId, def.userId)],
);
