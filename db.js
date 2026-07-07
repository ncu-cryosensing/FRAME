const Database = require("better-sqlite3");

const db = new Database("database.db");

db.exec(`
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_metadata TEXT,
    ai_result_short_description TEXT,
    ai_result_documentation TEXT,
    short_description TEXT,
    documentation TEXT
);
`);

module.exports = db;