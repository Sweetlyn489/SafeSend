import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import recipientsRouter from "./routes/recipients";
import transactionsRouter from "./routes/transactions";
import paymentsRouter from "./routes/payments";
import usersRouter from "./routes/users";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/recipients", recipientsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`SafeSend server running on http://localhost:${PORT}`);
});
