// forgm/pages/api/slider-images.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query('SELECT * FROM slider_images ORDER BY sort_order ASC');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Failed to fetch slider images:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    } finally {
      if (conn) conn.release();
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}