import { Router } from "express";
import { query } from "../database";

const router = Router();

// GET /api/transactions?userId=1
router.get("/", async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const rows = await query(
      `SELECT t.id, t.amount, t.status, t.concern_level, t.concern_reasons, t.created_at,
              r.name AS recipient_name, r.upi_id, r.profession
       FROM transactions t
       JOIN recipients r ON r.id = t.recipient_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Couldn't load transaction history right now." });
  }
});

export default router;
