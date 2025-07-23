// fixcy/pages/api/admin/cancel-booking.ts
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
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    if (!verifyAdmin(req)) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { bookingId, userId, tableName } = req.body;

    if (!bookingId || !userId || !tableName) {
        return res.status(400).json({ message: 'Missing required booking information.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Delete the booking
        const deleteResult = await conn.query('DELETE FROM bookings WHERE id = ?', [bookingId]);

        if (deleteResult.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Booking not found or already cancelled.' });
        }

        // 2. Create a notification for the user
        const message = `We're sorry, your booking for table ${tableName} has been cancelled by an administrator. Please contact us for more details.`;
        await conn.query(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [userId, message]
        );

        await conn.commit();
        res.status(200).json({ message: 'Booking cancelled and user notified successfully.' });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Cancel booking API error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}