// cy-project/pages/api/auth/line.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const state = 'random_state_string'; // ควรสร้าง state แบบสุ่มและจัดเก็บเพื่อป้องกัน CSRF
  const scope = 'profile openid email';
  const response_type = 'code';
  const client_id = process.env.LINE_LOGIN_CHANNEL_ID;
  const redirect_uri = process.env.LINE_LOGIN_REDIRECT_URI;

  const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}&scope=${scope}`;

  res.redirect(302, url);
}