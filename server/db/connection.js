import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 4000;
if (isNaN(port)) {
  throw new Error(`Invalid DB_PORT: ${process.env.DB_PORT}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

export default pool;
