import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Override only for isolated integration tests; normal development uses data/app.db.
const dbPath = process.env.FITNESS_DB_PATH || path.join(process.cwd(), 'data', 'app.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

export default db;