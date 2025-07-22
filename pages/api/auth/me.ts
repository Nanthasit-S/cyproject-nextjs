// forgm/pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { auth_token } = req.cookies;

  if (!auth_token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(auth_token, process.env.JWT_SECRET!);
    res.status(200).json(decoded);
  } catch (error) {
    // Token is invalid or expired
    res.status(401).json({ message: 'Invalid token' });
  }
}