import { db } from "../db/db";
import { users } from "../db/schema";
import { eq } from 'drizzle-orm';

class UserService {
    // Метод для перевірки наявності користувача в базі
    async userExists(id) {
        const existing = await db.select().from(users).where(eq(users.id, id));
        return existing.length > 0;
    }

    // Метод для створення нового користувача
    async createUser({ id, email, name, picture, history }) {
        await db.insert(users).values({ id, email, name, picture, history });
    }

    async appendToHistory(id, newEntry) {
        const result = await db.select().from(users).where(eq(users.id, id));
        if (!result.length) return;

        const currentUser = result[0];
        let history = [];

        try {
            history = currentUser.history ? JSON.parse(currentUser.history) : [];
        } catch (err) {
            console.error('JSON parse error:', err);
        }

        history.push({
            ...newEntry,
            timestamp: new Date().toISOString()
        });

        await db.update(users)
            .set({ history: JSON.stringify(history) })
            .where(eq(users.id, id));
    }

    async getUserHistory(id) {
        const result = await db.select().from(users).where(eq(users.id, id));
        if (!result.length) return [];

        try {
            return result[0].history ? JSON.parse(result[0].history) : [];
        } catch (err) {
            console.error('JSON parse error in getUserHistory:', err);
            return [];
        }
    }
}

export const userService = new UserService();