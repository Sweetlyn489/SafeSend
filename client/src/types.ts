export interface User {
  id: number;
  name: string;
  email: string;
  balance: number;
}

export interface Recipient {
  id: number;
  user_id: number;
  name: string;
  upi_id: string;
  profession: string | null;
}

export type ConcernLevel = "LOW" | "MODERATE" | "HIGH";

export type CheckStatus = "good" | "warning" | "neutral";

export interface SafetyCheckItem {
  type: "recipient" | "amount" | "timing" | "similar";
  status: CheckStatus;
  title: string;
  message: string;
}

export interface SafetyCheckResult {
  level: ConcernLevel;
  score: number;
  checks: SafetyCheckItem[];
  summary: string;
}

export type TransactionStatus = "completed" | "reversed";

export interface Transaction {
  id: number;
  amount: string | number;
  status: TransactionStatus;
  concern_level: ConcernLevel | null;
  concern_reasons: SafetyCheckItem[] | null;
  created_at: string;
  recipient_name: string;
  upi_id: string;
  profession: string | null;
}
