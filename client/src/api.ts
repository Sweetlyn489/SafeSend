import type { Recipient, SafetyCheckResult, Transaction, User } from "./types";

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data as T;
}

export const api = {
  getUsers: () => request<User[]>("/users"),
  getUser: (id: number) => request<User>(`/users/${id}`),

  getRecipients: (userId: number) => request<Recipient[]>(`/recipients?userId=${userId}`),
  addRecipient: (payload: {
    userId: number;
    name: string;
    upiId: string;
    profession?: string;
  }) =>
    request<Recipient>("/recipients", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getTransactions: (userId: number) =>
    request<Transaction[]>(`/transactions?userId=${userId}`),

  checkPayment: (payload: { userId: number; recipientId: number; amount: number }) =>
    request<SafetyCheckResult>("/payments/check", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  confirmPayment: (payload: {
    userId: number;
    recipientId: number;
    amount: number;
    pin: string;
    concernLevel: string;
    concernReasons: unknown;
  }) =>
    request<{ transaction: any; balance: number; undoWindowMs: number }>(
      "/payments/confirm",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  undoPayment: (transactionId: number) =>
    request<{ status: string; balance: number }>("/payments/undo", {
      method: "POST",
      body: JSON.stringify({ transactionId }),
    }),
};
