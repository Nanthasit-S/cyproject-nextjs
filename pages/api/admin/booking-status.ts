// fixcy/pages/api/admin/booking-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

const verifyAdmin = (req: NextApiRequest): boolean => {
    const { auth_token } = req.cookies;
    if (!auth_token) return false;
    try {
        const decoded: any = jwt.verify(auth_token, process.env.JWT_SECRET!);
        return decoded.role === 'admin';
    } catch {
        return false;
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!verifyAdmin(req)) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        if (req.method === 'POST') {
            const { isBookingEnabled } = req.body;
            await conn.query(
                "UPDATE settings SET setting_value = ? WHERE setting_key = 'booking_enabled'",
                [isBookingEnabled.toString()]
            );
            return res.status(200).json({ message: 'Booking status updated successfully.' });
        } else if (req.method === 'GET') {
             const [setting] = await conn.query(
                "SELECT setting_value FROM settings WHERE setting_key = 'booking_enabled'"
            );
            const isBookingEnabled = setting ? setting.setting_value === 'true' : false;
            return res.status(200).json({ isBookingEnabled });
        }
        
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error('Admin booking status API error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}