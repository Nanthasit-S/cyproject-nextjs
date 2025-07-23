// fixcy/pages/api/admin/slider-update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { Formidable } from 'formidable';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';
import { URL } from 'url';

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
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    if (!verifyAdmin(req)) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const form = new Formidable({});
        const [fields, files] = await form.parse(req);

        const id = fields.id?.[0];
        const altText = fields.altText?.[0];
        const newImageFile = files.image?.[0];
        const newImageUrl = fields.imageUrl?.[0];

        if (!id) {
            return res.status(400).json({ message: 'Image ID is required.' });
        }

        const [existingImage] = await conn.query('SELECT image_url FROM slider_images WHERE id = ?', [id]);
        if (!existingImage) {
            return res.status(404).json({ message: 'Image not found.' });
        }
        
        let updatedImageUrl = existingImage.image_url;
        
        if (newImageFile || newImageUrl) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            await fs.mkdir(uploadDir, { recursive: true });
            
            let fileName = '';

            if (newImageFile) {
                fileName = `${Date.now()}-${newImageFile.originalFilename}`;
                const newPath = path.join(uploadDir, fileName);
                await fs.rename(newImageFile.filepath, newPath);
            } else if (newImageUrl) {
                const imageResponse = await fetch(newImageUrl);
                if (!imageResponse.ok) throw new Error('Failed to fetch image from URL');
                
                // vvvvvvvvvvvvvv CHANGE IS HERE vvvvvvvvvvvvvv
                const arrayBuffer = await imageResponse.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer); // Use Uint8Array directly
                // ^^^^^^^^^^^^^^ CHANGE IS HERE ^^^^^^^^^^^^^^

                fileName = `${Date.now()}-${path.basename(new URL(newImageUrl).pathname)}`;
                const newPath = path.join(uploadDir, fileName);
                await fs.writeFile(newPath, buffer);
            }

            updatedImageUrl = `/uploads/${fileName}`;

            const oldFilePath = path.join(process.cwd(), 'public', existingImage.image_url);
            try {
                await fs.unlink(oldFilePath);
            } catch (error) {
                console.error(`Could not delete old file: ${oldFilePath}`, error);
            }
        }
        
        await conn.query(
            'UPDATE slider_images SET image_url = ?, alt_text = ? WHERE id = ?',
            [updatedImageUrl, altText, id]
        );

        res.status(200).json({ message: 'Image updated successfully', updatedImage: { id: Number(id), image_url: updatedImageUrl, alt_text: altText } });

    } catch (error: any) {
        console.error('Update Slider API Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } finally {
        if (conn) conn.release();
    }
}