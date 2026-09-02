import Database from "better-sqlite3";

const db = new Database("database.db");

db.exec(`
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_metadata TEXT,
    ai_result_short_description TEXT,
    ai_result_documentation TEXT,
    ai_index_page TEXT,
    ai_doc_language TEXT,
    ai_doc_references TEXT,
    ai_data_retrieval TEXT,
    ai_retrieval_protocol TEXT,
    short_description TEXT,
    documentation TEXT
    )
`);

export default db;