import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = resolve(__dirname, '../../data/hope.db');
const DB_PATH = process.env.HOPE_DB_PATH || DEFAULT_DB_PATH;

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
const schema = readFileSync(resolve(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

const DEMO = {
  uid: 'user-001',
  username: 'demo',
  email: 'demo@hope.local',
  password: 'hope1234',
  nickname: '지우',
  gender: 'female',
};

const existing = db.prepare('SELECT uid FROM users WHERE uid = ?').get(DEMO.uid);
if (!existing) {
  const passwordHash = bcrypt.hashSync(DEMO.password, 10);
  db.prepare(`
    INSERT INTO users (uid, username, email, password_hash, nickname, gender)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(DEMO.uid, DEMO.username, DEMO.email, passwordHash, DEMO.nickname, DEMO.gender);
}
