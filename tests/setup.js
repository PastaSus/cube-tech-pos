import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setup() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  await conn.query('CREATE DATABASE IF NOT EXISTS cube_pos');
  await conn.query('USE cube_pos');

  const schema = fs.readFileSync(path.resolve(__dirname, '..', 'database.sql'), 'utf-8');
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.toUpperCase().startsWith('CREATE DATABASE') && !s.toUpperCase().startsWith('USE'));

  for (const stmt of statements) {
    if (stmt) {
      try {
        await conn.query(stmt + ';');
      } catch (err) {
        // Table already exists, ignore
        if (err.code !== 'ER_TABLE_EXISTS_ERROR') throw err;
      }
    }
  }

  await conn.end();
}

await setup();
