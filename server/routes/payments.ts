import { Router } from "express";
import { query, pool } from "../database";
import { runSafetyCheck } from "../services/safetyEngine";

const router = Router();

const DEMO_UPI_PIN = process.env.DEMO_UPI_PIN || "123456";
const UNDO_WINDOW_MS = 10_000;

// POST /api/payments/check  { userId, recipientId, amount }
router.post("/check", async (req, res) => {
  try {
    const { userId, recipientId, amount } = req.body;
    if (!userId || !recipientId || !amount) {
      return res.status(400).json({ error: "userId, recipientId and amount are required." });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: "Enter an amount greater than zero." });
    }

    const users = await query("SELECT balance FROM users WHERE id = $1", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    if (Number(amount) > Number(users[0].balance)) {
      return res.status(400).json({ error: "This amount is more than your available balance." });
    }

    const result = await runSafetyCheck(Number(userId), Number(recipientId), Number(amount));
    res.json(result);
  } catch (err: any) {
    console.error(err);
    if (err.message === "Recipient not found") {
      return res.status(404).json({ error: "We couldn't find that recipient." });
    }
    res.status(500).json({ error: "Couldn't run the SafeSend Check right now." });
  }
});

// POST /api/payments/confirm  { userId, recipientId, amount, pin, concernLevel, concernReasons }
router.post("/confirm", async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, recipientId, amount, pin, concernLevel, concernReasons } = req.body;

    if (!userId || !recipientId || !amount || !pin) {
      return res.status(400).json({ error: "Missing details needed to confirm this payment." });
    }
    if (pin !== DEMO_UPI_PIN) {
      return res.status(401).json({ error: "Incorrect PIN. Please try again." });
    }

    await client.query("BEGIN");

    const users = await client.query("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [
      userId,
    ]);
    if (users.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found." });
    }

    const balance = Number(users.rows[0].balance);
    if (Number(amount) > balance) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This amount is more than your available balance." });
    }

    const newBalance = balance - Number(amount);
    await client.query("UPDATE users SET balance = $1 WHERE id = $2", [newBalance, userId]);

    const txnResult = await client.query(
      `INSERT INTO transactions (user_id, recipient_id, amount, status, concern_level, concern_reasons)
       VALUES ($1, $2, $3, 'completed', $4, $5) RETURNING *`,
      [userId, recipientId, amount, concernLevel || null, JSON.stringify(concernReasons || [])]
    );

    await client.query("COMMIT");

    res.status(201).json({
      transaction: txnResult.rows[0],
      balance: newBalance,
      undoWindowMs: UNDO_WINDOW_MS,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "The payment couldn't be completed. Please try again." });
  } finally {
    client.release();
  }
});

// POST /api/payments/undo  { transactionId }
router.post("/undo", async (req, res) => {
  const client = await pool.connect();
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required." });
    }

    await client.query("BEGIN");

    const txns = await client.query("SELECT * FROM transactions WHERE id = $1 FOR UPDATE", [
      transactionId,
    ]);
    if (txns.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transaction not found." });
    }

    const txn = txns.rows[0];
    if (txn.status === "reversed") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This payment has already been reversed." });
    }

    const elapsed = Date.now() - new Date(txn.created_at).getTime();
    if (elapsed > UNDO_WINDOW_MS + 2000) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "The undo window for this payment has passed." });
    }

    await client.query("UPDATE transactions SET status = 'reversed' WHERE id = $1", [
      transactionId,
    ]);

    const users = await client.query("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [
      txn.user_id,
    ]);
    const newBalance = Number(users.rows[0].balance) + Number(txn.amount);
    await client.query("UPDATE users SET balance = $1 WHERE id = $2", [newBalance, txn.user_id]);

    await client.query("COMMIT");

    res.json({ status: "reversed", balance: newBalance });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Couldn't reverse this payment right now." });
  } finally {
    client.release();
  }
});

export default router;
