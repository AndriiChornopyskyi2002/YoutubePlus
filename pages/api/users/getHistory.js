import { userService } from "../../../src/services/userService";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Missing user ID' });
    }

    try {
        const history = await userService.getUserHistory(id);
        return res.status(200).json({ history });
    } catch (error) {
        console.error('[HISTORY GET ERROR]', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}