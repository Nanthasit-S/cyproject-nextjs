// fixcy/pages/api/booking-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const [setting] = await conn.query(
            "SELECT setting_value FROM settings WHERE setting_key = 'booking_enabled'"
        );

        const isBookingEnabled = setting ? setting.setting_value === 'true' : false;

        res.status(200).json({ isBookingEnabled });
    } catch (error) {
        console.error('Failed to fetch booking status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}