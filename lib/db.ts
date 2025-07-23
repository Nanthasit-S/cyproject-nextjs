// cy-project/lib/db.ts
import mariadb from 'mariadb';

// ประกาศตัวแปร pool ใน global scope เพื่อให้คงอยู่ข้ามการ re-render ใน development
declare global {
  // eslint-disable-next-line no-var
  var mariadbPool: mariadb.Pool | undefined;
}

const poolConfig = {
  host: process.env.MARIADB_HOST,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  connectionLimit: 5,
  // เพิ่ม timeouts เพื่อป้องกันการรอเชื่อมต่อนานเกินไป
  acquireTimeout: 15000, // 15 วินาที
  connectTimeout: 10000   // 10 วินาที
};

// ใช้ pool ที่มีอยู่แล้วใน global หรือสร้างใหม่ถ้ายังไม่มี
export const pool = global.mariadbPool || mariadb.createPool(poolConfig);

// ในโหมด development ให้เก็บ pool ไว้ใน global เพื่อใช้ซ้ำ
if (process.env.NODE_ENV !== 'production') {
  global.mariadbPool = pool;
}