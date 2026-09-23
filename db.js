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

// cleanup: remove duplicate rows, keep the oldest row per id_metadata
db.exec(`
  DELETE FROM records
  WHERE id NOT IN (
    SELECT MIN(id) FROM records GROUP BY id_metadata
  )
`);

// prevent future duplicates: one row per metadata id
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_records_id_metadata
  ON records(id_metadata)
`);

export default db;