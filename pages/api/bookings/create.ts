// fixcy/pages/api/bookings/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { format } from 'date-fns';

interface UserPayload {
  id: number;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { auth_token } = req.cookies;
  if (!auth_token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { tableId, bookingDate } = req.body;
  if (!tableId || !bookingDate) {
    return res.status(400).json({ message: 'Table ID and booking date are required' });
  }

  let conn;
  try {
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET!) as UserPayload;
    const userId = decoded.id;
    
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const existingBooking = await conn.query(
      "SELECT id FROM bookings WHERE table_id = ? AND booking_date = ? AND status = 'confirmed'",
      [tableId, bookingDate]
    );

    if (existingBooking.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'This table is already reserved on the selected date.' });
    }

    await conn.query(
      "INSERT INTO bookings (user_id, table_id, booking_date, status) VALUES (?, ?, ?, 'confirmed')",
      [userId, tableId, bookingDate]
    );
    
    // Get table number for the notification message
    const [tableInfo] = await conn.query("SELECT table_number FROM tables WHERE id = ?", [tableId]);
    const formattedDate = format(new Date(bookingDate), 'PPP'); // e.g., July 23rd, 2025
    const message = `Your booking is confirmed! You have successfully reserved table ${tableInfo.table_number} for ${formattedDate}.`;

    // Insert notification into the user's inbox
    await conn.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [userId, message]
    );
    
    await conn.commit();
    res.status(201).json({ message: 'Booking successful!' });

  } catch (error: any) {
    if (conn) await conn.rollback();
    console.error('Booking creation failed:', error);
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'You have already booked a table for this date.' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
}