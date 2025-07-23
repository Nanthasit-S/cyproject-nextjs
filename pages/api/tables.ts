// fixcy/pages/api/tables.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Verify user is authenticated
  const { auth_token } = req.cookies;
  if (!auth_token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // ดึงวันที่ที่ต้องการตรวจสอบจาก query, ถ้าไม่ระบุให้ใช้ัวันปัจจุบัน
  const { date } = req.query;
  const targetDate = date ? new Date(date as string).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  let conn;
  try {
    conn = await pool.getConnection();
    
    // ดึงข้อมูลโซนทั้งหมด
    const zones = await conn.query("SELECT * FROM zones ORDER BY id ASC");
    
    // ดึงข้อมูลโต๊ะทั้งหมด
    const tables = await conn.query("SELECT * FROM tables WHERE status = 'available' ORDER BY id ASC");
    
    // ดึงข้อมูลการจองที่ "confirmed" สำหรับวันที่ที่ระบุ
    const bookings = await conn.query(
      "SELECT table_id FROM bookings WHERE booking_date = ? AND status = 'confirmed'",
      [targetDate]
    );
    const bookedTableIds = bookings.map((b: { table_id: any; }) => b.table_id);

    // อัปเดตสถานะของโต๊ะสำหรับ client
    const tablesWithStatus = tables.map((table: { id: any; }) => ({
      ...table,
      status: bookedTableIds.includes(table.id) ? 'reserved' : 'available',
    }));
    
    // จัดกลุ่มโต๊ะตามโซน
    const zonesWithTables = zones.map((zone: { id: any; }) => ({
      ...zone,
      tables: tablesWithStatus.filter((table: { zone_id: any; }) => table.zone_id === zone.id)
    }));

    res.status(200).json(zonesWithTables);
  } catch (error) {
    console.error("Failed to fetch tables data:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
}