import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import recipientsRouter from "./routes/recipients";
import paymentsRouter from "./routes/payments";
import transactionsRouter from "./routes/transactions";

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/recipients", recipientsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/transactions", transactionsRouter);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`SafeSend backend running on http://localhost:${port}`);
});
