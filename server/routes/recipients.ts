import { Router } from "express";
import { query } from "../database";

const router = Router();

// GET /api/recipients?userId=1
router.get("/", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const recipients = await query(
      "SELECT * FROM recipients WHERE user_id = $1 AND is_saved = TRUE ORDER BY name ASC",
      [userId]
    );
    res.json(recipients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't load recipients right now." });
  }
});

// POST /api/recipients
router.post("/", async (req, res) => {
  try {
    const { userId, name, upiId, profession } = req.body;

    if (!userId || !name || !upiId) {
      return res.status(400).json({ error: "Name and UPI ID are required." });
    }
    const upiPattern = /^[\w.\-]+@[\w.\-]+$/;
    if (!upiPattern.test(upiId)) {
      return res.status(400).json({ error: "That doesn't look like a valid UPI ID." });
    }

    const rows = await query(
      `INSERT INTO recipients (user_id, name, upi_id, profession, is_saved)
       VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
      [userId, name.trim(), upiId.trim(), profession ? profession.trim() : null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't save this recipient right now." });
  }
});

export default router;
