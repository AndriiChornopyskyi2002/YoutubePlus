import { mysqlTable, varchar, timestamp, json } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('authUsers', {
    id: varchar('id', { length: 255 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    picture: varchar('picture', { length: 500 }),
    history: json('history'),
    createdAt: timestamp('created_at').defaultNow(),
});