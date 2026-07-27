import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000"
}));

app.get("/", (req, res) => {
  res.redirect("/records");
});

/* Get all records */
app.get("/records", (req, res) => {
    try {
        const records = db.prepare("SELECT * FROM records").all();
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Get record by id */
app.get("/records/:id", (req, res) => {
    try {
        const record = db
            .prepare("SELECT * FROM records WHERE id_metadata = ?")
            .get(req.params.id);

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }

        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Create record */
app.post("/records", (req, res) => {
    try {
        const {
            id_metadata,
            ai_result_short_description,
            ai_result_documentation,
            short_description,
            documentation
        } = req.body;

        const info = db.prepare(`
            INSERT INTO records (
                id_metadata,
                ai_result_short_description,
                ai_result_documentation,
                short_description,
                documentation
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            id_metadata,
            ai_result_short_description,
            ai_result_documentation,
            short_description,
            documentation
        );

        res.json({
            id: info.lastInsertRowid,
            id_metadata,
            ai_result_short_description,
            ai_result_documentation,
            short_description,
            documentation
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Update record */
app.put("/records/:id", (req, res) => {
    try {
        const {
            id_metadata,
            ai_result_short_description,
            ai_result_documentation,
            short_description,
            documentation
        } = req.body;

        const info = db.prepare(`
            UPDATE records
            SET
                id_metadata = ?,
                ai_result_short_description = ?,
                ai_result_documentation = ?,
                short_description = ?,
                documentation = ?
            WHERE id_metadata = ?
        `).run(
            id_metadata,
            ai_result_short_description,
            ai_result_documentation,
            short_description,
            documentation,
            req.params.id
        );

        res.json({
            updated: info.changes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* Delete record */
app.delete("/records/:id", (req, res) => {
    try {
        const info = db
            .prepare("DELETE FROM records WHERE id = ?")
            .run(req.params.id);

        res.json({
            deleted: info.changes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3005, () => {
    console.log("Server running at http://localhost:3005");
});