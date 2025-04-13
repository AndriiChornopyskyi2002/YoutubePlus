import { userService } from "../../../src/services/userService";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { id, email, name, picture, history } = req.body;

    if (!email || !id) {
        return res.status(400).json({ message: 'Missing user data' });
    }

    try {
        // Використовуємо сервіс для перевірки, чи існує користувач
        const exists = await userService.userExists(id);

        if (!exists) {
            // Якщо користувача нема, створюємо його
            await userService.createUser({ id, email, name, picture, history });
            return res.status(201).json({ message: 'User created' });
        } else {
            // Якщо користувач вже існує
            return res.status(200).json({ message: 'User exists' });
        }
    } catch (error) {
        console.error('DB Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}