const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

fs.mkdirSync('data', { recursive: true });
const db = new Database(path.join('data', 'app.db'));
db.exec(fs.readFileSync(path.join('db', 'schema.sql'), 'utf8'));
console.log('Database ready.');
// Preserve existing records when adding preset avatars.
if (!db.prepare('PRAGMA table_info(users)').all().some(column => column.name === 'avatar')) {
  db.exec("ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT 'avery'");
}
