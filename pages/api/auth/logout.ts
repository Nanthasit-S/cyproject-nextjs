// cy-project/pages/api/auth/logout.ts
import { serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // สร้างคุกกี้ชื่อ auth_token ให้หมดอายุทันที
  const cookie = serialize('auth_token', '', {
    maxAge: -1,
    path: '/',
  });

  // ตั้งค่า Header เพื่อส่งคุกกี้ที่หมดอายุไปให้เบราว์เซอร์
  res.setHeader('Set-Cookie', cookie);

  // Redirect กลับไปที่หน้าแรก
  res.redirect('/');
}