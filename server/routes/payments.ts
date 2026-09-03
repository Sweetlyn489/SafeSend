import { Router, Request, Response, NextFunction } from "express";
import { pool, query } from "../database";
import { runSafetyCheck, ConcernLevel } from "../safetyEngine";

const router = Router();

function validPositiveAmount(value: unknown): number | null {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function validId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.post("/check", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = validId(req.body?.userId);
    const recipientId = validId(req.body?.recipientId);
    const amount = validPositiveAmount(req.body?.amount);
    if (!userId || !recipientId || amount === null) {
      return res.status(400).json({ error: "userId, recipientId and a positive amount are required" });
    }
    const user = await query("SELECT id FROM users WHERE id = $1", [userId]);
    if (user.rowCount === 0) return res.status(404).json({ error: "User not found" });
    const recipient = await query("SELECT id FROM recipients WHERE id = $1 AND user_id = $2", [recipientId, userId]);
    if (recipient.rowCount === 0) return res.status(404).json({ error: "Recipient not found" });

    const safety = await runSafetyCheck(userId, recipientId, amount);
    res.json(safety);
  } catch (err) { next(err); }
});

router.post("/confirm", async (req: Request, res: Response, next: NextFunction) => {
  const userId = validId(req.body?.userId);
  const recipientId = validId(req.body?.recipientId);
  const amount = validPositiveAmount(req.body?.amount);
  const concernLevel = req.body?.concernLevel;
  const concernReasons = req.body?.concernReasons;

  if (!userId || !recipientId || amount === null) {
    return res.status(400).json({ error: "userId, recipientId and a positive amount are required" });
  }
  if (!["LOW", "MODERATE", "HIGH"].includes(concernLevel)) {
    return res.status(400).json({ error: "Valid concernLevel is required" });
  }
  if (concernReasons !== undefined && typeof concernReasons !== "string") {
    return res.status(400).json({ error: "concernReasons must be a string" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query<{ id: number; balance: string }>(
      "SELECT id, balance FROM users WHERE id = $1 FOR UPDATE", [userId]
    );
    if (userResult.rowCount === 0) throw Object.assign(new Error("User not found"), { status: 404 });
    const recipientResult = await client.query(
      "SELECT id FROM recipients WHERE id = $1 AND user_id = $2", [recipientId, userId]
    );
    if (recipientResult.rowCount === 0) throw Object.assign(new Error("Recipient not found"), { status: 404 });

    const balance = Number(userResult.rows[0].balance);
    if (balance < amount) throw Object.assign(new Error("Insufficient balance"), { status: 400 });

    await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, userId]);
    const tx = await client.query<{ id: number }>(
      `INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons)
       VALUES ($1, $2, $3, 'COMPLETED', $4, $5) RETURNING id`,
      [userId, recipientId, amount, concernLevel as ConcernLevel, concernReasons ?? null]
    );
    const remaining = await client.query<{ balance: string }>("SELECT balance FROM users WHERE id = $1", [userId]);
    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      transactionId: tx.rows[0].id,
      remainingBalance: Number(remaining.rows[0].balance)
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err?.status) return res.status(err.status).json({ error: err.message });
    next(err);
  } finally { client.release(); }
});

router.post("/undo", async (req: Request, res: Response, next: NextFunction) => {
  const transactionId = validId(req.body?.transactionId);
  if (!transactionId) return res.status(400).json({ error: "Valid transactionId is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tx = await client.query<{ id: number; user_id: number; amount: string; status: string }>(
      "SELECT id, user_id, amount, status FROM transactions WHERE id = $1 FOR UPDATE", [transactionId]
    );
    if (tx.rowCount === 0) throw Object.assign(new Error("Transaction not found"), { status: 404 });
    if (tx.rows[0].status === "REVERSED") throw Object.assign(new Error("Transaction already reversed"), { status: 400 });
    if (tx.rows[0].status !== "COMPLETED") throw Object.assign(new Error("Transaction cannot be undone"), { status: 400 });

    await client.query("UPDATE users SET balance = balance + $1 WHERE id = $2", [tx.rows[0].amount, tx.rows[0].user_id]);
    await client.query("UPDATE transactions SET status = 'REVERSED' WHERE id = $1", [transactionId]);
    const balance = await client.query<{ balance: string }>("SELECT balance FROM users WHERE id = $1", [tx.rows[0].user_id]);
    await client.query("COMMIT");
    res.json({ success: true, transactionId, status: "REVERSED", restoredAmount: Number(tx.rows[0].amount), remainingBalance: Number(balance.rows[0].balance) });
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err?.status) return res.status(err.status).json({ error: err.message });
    next(err);
  } finally { client.release(); }
});

export default router;
