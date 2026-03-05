const sqlite = require('better-sqlite3');
const path = require('path');

// Using SQLite for this environment to ensure persistence without external setup
// In a real production environment, you would use Mongoose with MongoDB
const db = new sqlite(path.join(__dirname, '../../database.sqlite'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
  );
`);

module.exports = db;
