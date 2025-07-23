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

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', (err) => reject(err));
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!verifyAdmin(req)) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        switch (req.method) {
            case 'POST':
                const contentType = req.headers['content-type'] || '';
                
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                await fs.mkdir(uploadDir, { recursive: true });

                if (contentType.includes('multipart/form-data')) {
                    const form = new Formidable({});
                    const [fields, files] = await form.parse(req);

                    const imageFile = files.image?.[0];
                    if (!imageFile) {
                        return res.status(400).json({ message: 'Image file is required.' });
                    }

                    const altText = fields.altText?.[0] || '';
                    const fileName = `${Date.now()}-${imageFile.originalFilename}`;
                    const newPath = path.join(uploadDir, fileName);
                    await fs.rename(imageFile.filepath, newPath);
                    const imageUrl = `/uploads/${fileName}`;

                    await conn.query(
                        'INSERT INTO slider_images (image_url, alt_text) VALUES (?, ?)',
                        [imageUrl, altText]
                    );

                    res.status(201).json({ message: 'Image uploaded successfully' });

                } else if (contentType.includes('application/json')) {
                    const rawBody = await getRawBody(req);
                    const { imageUrl: urlToFetch, altText } = JSON.parse(rawBody.toString());

                    if (!urlToFetch) {
                        return res.status(400).json({ message: 'Image URL is required.' });
                    }

                    const imageResponse = await fetch(urlToFetch);
                    if (!imageResponse.ok) {
                        throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
                    }
                    
                    const arrayBuffer = await imageResponse.arrayBuffer();
                    const buffer = new Uint8Array(arrayBuffer);
                    
                    const fileName = `${Date.now()}-${path.basename(new URL(urlToFetch).pathname)}`;
                    const newPath = path.join(uploadDir, fileName);
                    await fs.writeFile(newPath, buffer);

                    const imageUrl = `/uploads/${fileName}`;

                    await conn.query(
                        'INSERT INTO slider_images (image_url, alt_text) VALUES (?, ?)',
                        [imageUrl, altText]
                    );

                    res.status(201).json({ message: 'Image fetched and saved successfully' });
                } else {
                    return res.status(400).json({ message: 'Unsupported Content-Type' });
                }
                break;
            
            case 'PUT':
                const body = await getRawBody(req);
                const { id: updateId, altText: newAltText } = JSON.parse(body.toString());

                if (!updateId) {
                    return res.status(400).json({ message: 'Image ID is required for update.' });
                }

                await conn.query(
                    'UPDATE slider_images SET alt_text = ? WHERE id = ?',
                    [newAltText, updateId]
                );

                res.status(200).json({ message: 'Image details updated successfully' });
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
                res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error: any) {
        console.error('Admin slider API error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } finally {
        if (conn) conn.release();
    }
}