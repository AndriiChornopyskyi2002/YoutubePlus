import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const dbName = 'youtube_plus';

// Спочатку створюємо БД, якщо вона не існує
async function createDatabaseIfNotExists() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'password',
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.end();
}

// Перевіряє чи існує таблиця authusers, і створює її якщо ні
async function createAuthUsersTableIfNotExists(pool) {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS \`authusers\` (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            picture VARCHAR(500),
            history JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await pool.query(createTableSQL);
}

// Головна ініціалізація
await createDatabaseIfNotExists();

export const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: dbName,
});

// Створюємо таблицю, якщо потрібно
await createAuthUsersTableIfNotExists(pool);

// Ініціалізуємо drizzle ORM
export const db = drizzle(pool);