CREATE TABLE `group_members` (
	`userId` integer,
	`groupId` integer,
	`type` text NOT NULL,
	CONSTRAINT `group_members_pk` PRIMARY KEY(`userId`, `groupId`),
	CONSTRAINT `fk_group_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`),
	CONSTRAINT `fk_group_members_groupId_groups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `groups`(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL
);
