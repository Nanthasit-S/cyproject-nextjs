// forgm/pages/api/auth/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code not found.' });
  }

  try {
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: process.env.LINE_LOGIN_REDIRECT_URI!,
        client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
        client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
        return res.status(400).json({ message: tokenData.error_description });
    }

    const { access_token } = tokenData;

    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profileData = await profileResponse.json();
    const { userId, displayName, pictureUrl } = profileData;

    let conn;
    try {
      conn = await pool.getConnection();
      let userResult: any[] = await conn.query('SELECT * FROM users WHERE line_id = ?', [userId]);

      if (userResult.length === 0) {
        await conn.query('INSERT INTO users (line_id, display_name, picture_url, role) VALUES (?, ?, ?, ?)', [userId, displayName, pictureUrl, 'user']);
        userResult = await conn.query('SELECT * FROM users WHERE line_id = ?', [userId]);
      } else {
        await conn.query('UPDATE users SET display_name = ?, picture_url = ? WHERE line_id = ?', [displayName, pictureUrl, userId]);
      }
      
      const user = userResult[0];

      const jwtPayload = {
        id: user.id,
        displayName: user.display_name,
        pictureUrl: pictureUrl,
        role: user.role,
      };

      const token = jwt.sign(jwtPayload, process.env.JWT_SECRET!, {
        expiresIn: '7d', // Token หมดอายุใน 7 วัน
      });

      const cookie = serialize('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      res.setHeader('Set-Cookie', cookie);
      res.redirect('/profile');

    } finally {
      if (conn) conn.release();
    }
  } catch (error) {
    console.error('Callback Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}