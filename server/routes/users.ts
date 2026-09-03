import { Router } from "express";
import { query } from "../database";

const router = Router();

// GET /api/users  -> list demo users for the login screen
router.get("/", async (_req, res) => {
  try {
    const rows = await query("SELECT id, name, email, balance FROM users ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't load demo users right now." });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await query("SELECT id, name, email, balance FROM users WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't load this user right now." });
  }
});

export default router;
