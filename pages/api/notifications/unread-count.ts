// fixcy/pages/api/notifications/unread-count.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }
  
  const { auth_token } = req.cookies;
  if (!auth_token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  let conn;
  try {
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET!) as UserPayload;
    const userId = decoded.id;
    conn = await pool.getConnection();

    const [result] = await conn.query(
      "SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );
    
    res.status(200).json({ unreadCount: result.unreadCount });

  } catch (error) {
    console.error('Unread count API error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
}