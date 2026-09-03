import { Router, Request, Response, NextFunction } from "express";
import { query } from "../database";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.query.userId);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: "Valid userId is required" });

    const result = await query(
      `SELECT t.id AS "transactionId", r.name AS "recipientName",
              r.upi_id AS "upiId", t.amount, t.status,
              t.concern_level AS "concernLevel", t.concern_reasons AS "concernReasons",
              t.created_at AS "createdAt"
       FROM transactions t
       JOIN recipients r ON r.id = t.recipient_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

export default router;
