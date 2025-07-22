// forgm/pages/api/admin/slider.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { Formidable } from 'formidable';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    if (!verifyAdmin(req)) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        switch (req.method) {
            case 'POST':
                const form = new Formidable({});
                const [fields, files] = await form.parse(req);

                const imageFile = files.image?.[0];
                if (!imageFile) {
                    return res.status(400).json({ message: 'Image file is required.' });
                }

                const altText = fields.altText?.[0] || '';
                const linkUrl = fields.linkUrl?.[0] || '';

                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                await fs.mkdir(uploadDir, { recursive: true });
                const fileName = `${Date.now()}-${imageFile.originalFilename}`;
                const newPath = path.join(uploadDir, fileName);
                await fs.rename(imageFile.filepath, newPath);

                const imageUrl = `/uploads/${fileName}`;

                await conn.query(
                    'INSERT INTO slider_images (image_url, alt_text, link_url) VALUES (?, ?, ?)',
                    [imageUrl, altText, linkUrl]
                );

                res.status(201).json({ message: 'Image uploaded successfully' });
                break;

            case 'DELETE':
                const { id, imageUrl: urlToDelete } = req.query;
                if (!id || !urlToDelete) {
                    return res.status(400).json({ message: 'Missing ID or image URL' });
                }

                const deleteResult = await conn.query('DELETE FROM slider_images WHERE id = ?', [id]);

                if (deleteResult.affectedRows > 0) {
                    const filePath = path.join(process.cwd(), 'public', urlToDelete as string);
                    try {
                        await fs.unlink(filePath);
                        res.status(200).json({ message: 'Image deleted successfully' });
                    } catch (fileError) {
                        console.error("Failed to delete file:", fileError);
                        res.status(200).json({ message: 'Image deleted from database, but file deletion failed.' });
                    }
                } else {
                    res.status(404).json({ message: 'Image not found' });
                }
                break;

            default:
                res.setHeader('Allow', ['POST', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error: any) {
        console.error('Admin slider API error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } finally {
        if (conn) conn.release();
    }
}