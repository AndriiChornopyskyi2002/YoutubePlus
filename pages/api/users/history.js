import { userService } from "../../../src/services/userService";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id, newEntry } = req.body;

        if (!id || !newEntry) {
            return res.status(400).json({ error: 'Missing id or newEntry' });
        }

        await userService.appendToHistory(id, newEntry);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('[HISTORY POST ERROR]', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}