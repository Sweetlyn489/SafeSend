import { Router } from "express";
import { query, pool } from "../database";
import { runSafetyCheck } from "../services/safetyEngine";

const router = Router();

const DEMO_UPI_PIN = process.env.DEMO_UPI_PIN || "123456";
const SAFE_HOLD_MS = 10_000;

// POST /api/payments/check
router.post("/check", async (req, res) => {
  try {
    const { userId, recipientId, amount } = req.body;
    if (!userId || !recipientId || !amount) return res.status(400).json({ error: "userId, recipientId and amount are required." });
    if (Number(amount) <= 0) return res.status(400).json({ error: "Enter an amount greater than zero." });

    const users = await query("SELECT balance FROM users WHERE id = $1", [userId]);
    if (users.length === 0) return res.status(404).json({ error: "User not found." });
    if (Number(amount) > Number(users[0].balance)) return res.status(400).json({ error: "This amount is more than your available balance." });

    const result = await runSafetyCheck(Number(userId), Number(recipientId), Number(amount));
    res.json(result);
  } catch (err: any) {
    console.error(err);
    if (err.message === "Recipient not found") return res.status(404).json({ error: "We couldn't find that recipient." });
    res.status(500).json({ error: "Couldn't run the SafeSend Check right now." });
  }
});

// POST /api/payments/confirm — reserves funds and creates a SafeHold, but does not complete the transfer yet.
router.post("/confirm", async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, recipientId, amount, pin, concernLevel, concernReasons } = req.body;
    if (!userId || !recipientId || !amount || !pin) return res.status(400).json({ error: "Missing details needed to confirm this payment." });
    if (pin !== DEMO_UPI_PIN) return res.status(401).json({ error: "Incorrect PIN. Please try again." });

    await client.query("BEGIN");
    const users = await client.query("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [userId]);
    if (users.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "User not found." }); }

    const balance = Number(users.rows[0].balance);
    if (Number(amount) > balance) { await client.query("ROLLBACK"); return res.status(400).json({ error: "This amount is more than your available balance." }); }

    const expiresAt = new Date(Date.now() + SAFE_HOLD_MS);
    const newBalance = balance - Number(amount);
    await client.query("UPDATE users SET balance = $1 WHERE id = $2", [newBalance, userId]);

    const txnResult = await client.query(
      `INSERT INTO transactions
       (user_id, recipient_id, amount, status, concern_level, concern_reasons, hold_expires_at)
       VALUES ($1, $2, $3, 'pending_hold', $4, $5, $6) RETURNING *`,
      [userId, recipientId, amount, concernLevel || null, JSON.stringify(concernReasons || []), expiresAt]
    );
    await client.query("COMMIT");

    res.status(201).json({
      transaction: txnResult.rows[0],
      balance: newBalance,
      holdWindowMs: SAFE_HOLD_MS,
      holdExpiresAt: expiresAt.toISOString()
    });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(err);
    res.status(500).json({ error: "The payment couldn't enter SafeHold. Please try again." });
  } finally { client.release(); }
});

// Finalize the held payment after the safety window expires.
router.post("/finalize", async (req, res) => {
  const client = await pool.connect();
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: "transactionId is required." });

    await client.query("BEGIN");
    const txns = await client.query("SELECT * FROM transactions WHERE id = $1 FOR UPDATE", [transactionId]);
    if (txns.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Transaction not found." }); }
    const txn = txns.rows[0];

    if (txn.status === "completed") { await client.query("ROLLBACK"); return res.json({ status: "completed" }); }
    if (txn.status === "reversed") { await client.query("ROLLBACK"); return res.status(400).json({ error: "This payment was cancelled." }); }
    if (txn.status !== "pending_hold") { await client.query("ROLLBACK"); return res.status(400).json({ error: "This payment is not waiting in SafeHold." }); }

    if (new Date(txn.hold_expires_at).getTime() > Date.now()) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "SafeHold is still active.", remainingMs: new Date(txn.hold_expires_at).getTime() - Date.now() });
    }

    await client.query("UPDATE transactions SET status = 'completed', hold_expires_at = NULL WHERE id = $1", [transactionId]);
    await client.query("COMMIT");
    res.json({ status: "completed" });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(err);
    res.status(500).json({ error: "Couldn't finalize the payment right now." });
  } finally { client.release(); }
});

// Cancel the payment while it is in SafeHold.
router.post("/cancel", async (req, res) => {
  const client = await pool.connect();
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: "transactionId is required." });

    await client.query("BEGIN");
    const txns = await client.query("SELECT * FROM transactions WHERE id = $1 FOR UPDATE", [transactionId]);
    if (txns.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Transaction not found." }); }
    const txn = txns.rows[0];

    if (txn.status === "reversed") { await client.query("ROLLBACK"); return res.status(400).json({ error: "This payment has already been cancelled." }); }
    if (txn.status === "completed") { await client.query("ROLLBACK"); return res.status(400).json({ error: "The payment has already completed." }); }
    if (txn.status !== "pending_hold") { await client.query("ROLLBACK"); return res.status(400).json({ error: "This payment is not in SafeHold." }); }
    if (new Date(txn.hold_expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "The SafeHold window has expired." });
    }

    await client.query("UPDATE transactions SET status = 'reversed', hold_expires_at = NULL WHERE id = $1", [transactionId]);
    const users = await client.query("SELECT balance FROM users WHERE id = $1 FOR UPDATE", [txn.user_id]);
    const newBalance = Number(users.rows[0].balance) + Number(txn.amount);
    await client.query("UPDATE users SET balance = $1 WHERE id = $2", [newBalance, txn.user_id]);
    await client.query("COMMIT");

    res.json({ status: "reversed", balance: newBalance });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(err);
    res.status(500).json({ error: "Couldn't cancel this SafeHold right now." });
  } finally { client.release(); }
});

export default router;
