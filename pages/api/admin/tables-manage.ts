// fixcy/pages/api/admin/tables-manage.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db';
import jwt from 'jsonwebtoken';

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

    const { entity } = req.query;

    let conn;
    try {
        conn = await pool.getConnection();

        // --- ZONE MANAGEMENT ---
        if (entity === 'zones') {
            switch (req.method) {
                case 'POST':
                    const { name, description } = req.body;
                    if (!name) return res.status(400).json({ message: 'Zone name is required.' });
                    const result = await conn.query('INSERT INTO zones (name, description) VALUES (?, ?)', [name, description || null]);
                    res.status(201).json({ message: 'Zone created successfully', id: Number(result.insertId) });
                    break;
                case 'DELETE':
                    const { id } = req.body;
                    if (!id) return res.status(400).json({ message: 'Zone ID is required.' });
                    await conn.query('DELETE FROM zones WHERE id = ?', [id]);
                    res.status(200).json({ message: 'Zone deleted successfully.' });
                    break;
                default:
                    res.setHeader('Allow', ['POST', 'DELETE']);
                    res.status(405).end('Method Not Allowed for zones');
            }
            return;
        }

        // --- TABLE MANAGEMENT (and general GET) ---
        switch (req.method) {
            case 'GET':
                const targetDate = new Date().toISOString().slice(0, 10);
                const zones = await conn.query("SELECT * FROM zones ORDER BY id ASC");
                
                // vvvvvvvvvvvvvv CHANGE IS HERE vvvvvvvvvvvvvv
                const tablesQuery = `
                    SELECT 
                        t.*, 
                        b.id as booking_id, 
                        b.user_id as booked_by_user_id,
                        u.display_name as booked_by_user_name
                    FROM tables t
                    LEFT JOIN bookings b ON t.id = b.table_id AND b.booking_date = ? AND b.status = 'confirmed'
                    LEFT JOIN users u ON b.user_id = u.id
                    ORDER BY t.zone_id, t.table_number;
                `;
                const tables = await conn.query(tablesQuery, [targetDate]);
                // ^^^^^^^^^^^^^^ CHANGE IS HERE ^^^^^^^^^^^^^^

                res.status(200).json({ zones, tables });
                break;
            
            case 'POST':
                 const { table_number, capacity, zone_id } = req.body;
                if (!table_number || !capacity || !zone_id) {
                    return res.status(400).json({ message: 'Missing required fields.' });
                }
                const postResult = await conn.query(
                    'INSERT INTO tables (table_number, capacity, zone_id) VALUES (?, ?, ?)',
                    [table_number, capacity, zone_id]
                );
                res.status(201).json({ 
                    message: 'Table created successfully', 
                    id: Number(postResult.insertId) 
                });
                break;

            case 'PUT':
                const { ids, capacity: newCapacity, zone_id: newZoneId } = req.body;
                if (!ids || !Array.isArray(ids) || ids.length === 0) {
                    return res.status(400).json({ message: 'Table IDs are required.' });
                }

                let query = 'UPDATE tables SET';
                const params = [];
                if (newCapacity) {
                    query += ' capacity = ?';
                    params.push(newCapacity);
                }
                if (newZoneId) {
                    query += (params.length > 0 ? ',' : '') + ' zone_id = ?';
                    params.push(newZoneId);
                }
                
                if (params.length === 0) {
                    return res.status(400).json({ message: 'No fields to update.' });
                }

                query += ' WHERE id IN (?)';
                params.push(ids);
                
                await conn.query(query, params);
                res.status(200).json({ message: 'Tables updated successfully.' });
                break;

            case 'DELETE':
                const { ids: idsToDelete } = req.body;
                if (!idsToDelete || !Array.isArray(idsToDelete) || idsToDelete.length === 0) {
                    return res.status(400).json({ message: 'Table IDs are required.' });
                }
                await conn.query('DELETE FROM tables WHERE id IN (?)', [idsToDelete]);
                res.status(200).json({ message: 'Tables deleted successfully.' });
                break;
                
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error: any) {
        console.error('Admin tables manage API error:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Cannot delete zone. Please remove all tables from this zone first.' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        if (conn) conn.release();
    }
}