// fixcy/pages/api/notifications.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { auth_token } = req.cookies;
  if (!auth_token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  let conn;
  try {
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET!) as UserPayload;
    const userId = decoded.id;
    conn = await pool.getConnection();

    switch (req.method) {
      case 'GET': {
        const notifications = await conn.query(
          "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
          [userId]
        );
        return res.status(200).json(notifications);
      }

      case 'POST': { // Mark as read
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ message: 'Notification IDs are required.' });
        }
        await conn.query(
          "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND id IN (?)",
          [userId, ids]
        );
        return res.status(200).json({ message: 'Notifications marked as read.' });
      }
      
      // vvvvvvvvvvvvvv NEW CODE BLOCK vvvvvvvvvvvvvv
      case 'DELETE': {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ message: 'Notification IDs are required for deletion.' });
        }
        await conn.query(
          "DELETE FROM notifications WHERE user_id = ? AND id IN (?)",
          [userId, ids]
        );
        return res.status(200).json({ message: 'Notifications deleted successfully.' });
      }
      // ^^^^^^^^^^^^^^ NEW CODE BLOCK ^^^^^^^^^^^^^^

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
}