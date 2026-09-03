import { Router, Request, Response, NextFunction } from "express";
import { query } from "../database";

const router = Router();

function positiveInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = positiveInt(req.query.userId);
    if (!userId) return res.status(400).json({ error: "Valid userId is required" });
    const result = await query(
      `SELECT id, name, upi_id AS "upiId", profession, created_at AS "createdAt"
       FROM recipients WHERE user_id = $1 ORDER BY name`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, name, upiId, profession } = req.body ?? {};
    const id = positiveInt(userId);
    if (!id || typeof name !== "string" || !name.trim() || typeof upiId !== "string" || !upiId.trim()) {
      return res.status(400).json({ error: "userId, name and upiId are required" });
    }
    const user = await query("SELECT id FROM users WHERE id = $1", [id]);
    if (user.rowCount === 0) return res.status(404).json({ error: "User not found" });
    if (profession !== undefined && profession !== null && typeof profession !== "string") {
      return res.status(400).json({ error: "profession must be a string when provided" });
    }
    const result = await query(
      `INSERT INTO recipients (user_id, name, upi_id, profession)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, upi_id AS "upiId", profession, created_at AS "createdAt"`,
      [id, name.trim(), upiId.trim(), profession?.trim() || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
