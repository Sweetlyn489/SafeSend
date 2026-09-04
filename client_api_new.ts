import type { Recipient, SafetyCheckItem, SafetyCheckResult, Transaction, User } from "./types";

const BASE_URL = "/api";
const DEMO_MODE_KEY = "safesend.demoMode";
const DEMO_STATE_KEY = "safesend.demoState";

interface DemoState {
  users: User[];
  recipients: Recipient[];
  transactions: Transaction[];
  nextTransactionId: number;
}

const seedState: DemoState = {
  users: [
    { id: 1, name: "Rahul", email: "rahul@demo.safesend", balance: 50000 },
    { id: 2, name: "Priya", email: "priya@demo.safesend", balance: 32000 },
    { id: 3, name: "Arun", email: "arun@demo.safesend", balance: 18500 },
  ],
  recipients: [
    { id: 1, user_id: 1, name: "Rahul Kumar", upi_id: "rahulkumar@upi", profession: "Electrician" },
    { id: 2, user_id: 1, name: "Priya Sharma", upi_id: "priyasharma@upi", profession: "Designer" },
    { id: 3, user_id: 1, name: "Rohit Kumar", upi_id: "rohitkumar@upi", profession: "Contractor" },
    { id: 4, user_id: 1, name: "City Power Board", upi_id: "citypower@upi", profession: null },
    { id: 5, user_id: 2, name: "Arjun Mehta", upi_id: "arjunmehta@upi", profession: "Landlord" },
    { id: 6, user_id: 2, name: "Rahul", upi_id: "rahul.p@upi", profession: null },
    { id: 7, user_id: 3, name: "Sana Traders", upi_id: "sanatraders@upi", profession: "Wholesaler" },
  ],
  transactions: [],
  nextTransactionId: 1001,
};

const dayMs = 24 * 60 * 60 * 1000;
function seedTransactions(): Transaction[] {
  const now = Date.now();
  const make = (id: number, recipientId: number, amount: number, daysAgo: number): Transaction => {
    const recipient = seedState.recipients.find((r) => r.id === recipientId)!;
    return {
      id,
      amount,
      status: "completed",
      concern_level: "LOW",
      concern_reasons: [],
      created_at: new Date(now - daysAgo * dayMs).toISOString(),
      recipient_name: recipient.name,
      upi_id: recipient.upi_id,
      profession: recipient.profession,
    };
  };
  return [
    make(1, 1, 2000, 90), make(2, 1, 2500, 60), make(3, 1, 3000, 30), make(4, 1, 2800, 10),
    make(5, 4, 1800, 75), make(6, 4, 1800, 45), make(7, 4, 1800, 15),
    make(8, 2, 4000, 45), make(9, 2, 3800, 15),
  ];
}

function loadDemoState(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch { /* use seed */ }
  const fresh = { ...seedState, transactions: seedTransactions() };
  saveDemoState(fresh);
  return fresh;
}

function saveDemoState(state: DemoState) {
  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
}

function setDemoMode(enabled: boolean) {
  localStorage.setItem(DEMO_MODE_KEY, enabled ? "1" : "0");
}

export function isDemoFallbackMode() {
  return localStorage.getItem(DEMO_MODE_KEY) === "1";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}

function localUsers() { return loadDemoState().users; }
function localUser(id: number) { return localUsers().find((u) => u.id === id); }
function localRecipients(userId: number) { return loadDemoState().recipients.filter((r) => r.user_id === userId); }
function localTransactions(userId: number) {
  return loadDemoState().transactions.filter((t) => {
    const recipient = loadDemoState().recipients.find((r) => r.name === t.recipient_name && r.upi_id === t.upi_id);
    return recipient ? recipient.user_id === userId : false;
  }).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

function similarity(a: string, b: string) {
  const s1 = a.toLowerCase().trim(), s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  const d = Array.from({ length: s1.length + 1 }, () => new Array<number>(s2.length + 1).fill(0));
  for (let i = 0; i <= s1.length; i++) d[i][0] = i;
  for (let j = 0; j <= s2.length; j++) d[0][j] = j;
  for (let i = 1; i <= s1.length; i++) for (let j = 1; j <= s2.length; j++) {
    d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (s1[i-1] === s2[j-1] ? 0 : 1));
  }
  return 1 - d[s1.length][s2.length] / Math.max(s1.length, s2.length);
}

function localSafetyCheck(userId: number, recipientId: number, amount: number): SafetyCheckResult {
  const state = loadDemoState();
  const recipient = state.recipients.find((r) => r.id === recipientId && r.user_id === userId);
  if (!recipient) throw new Error("We couldn't find that recipient.");
  const prior = state.transactions
    .filter((t) => t.recipient_name === recipient.name && t.upi_id === recipient.upi_id && t.status !== "reversed")
    .sort((a,b) => +new Date(a.created_at) - +new Date(b.created_at));
  const checks: SafetyCheckItem[] = [];
  let score = 0;

  if (prior.length) checks.push({ type: "recipient", status: "good", title: "Familiar recipient", message: `You've paid ${recipient.name} before.` });
  else { score += 25; checks.push({ type: "recipient", status: "warning", title: "New recipient", message: `You haven't paid ${recipient.name} before.` }); }

  const amounts = prior.map((t) => Number(t.amount));
  if (amounts.length >= 2) {
    const min = Math.min(...amounts), max = Math.max(...amounts), avg = amounts.reduce((a,b)=>a+b,0)/amounts.length;
    const sd = Math.sqrt(amounts.reduce((s,v)=>s+(v-avg)**2,0)/amounts.length);
    if (amount > Math.max(avg + 2*sd, max*1.5) || amount > max*3) {
      score += 30; checks.push({ type: "amount", status: "warning", title: "Amount is unusual", message: `Your previous payments to ${recipient.name} were usually between ₹${min.toLocaleString("en-IN")} and ₹${max.toLocaleString("en-IN")}.` });
    } else checks.push({ type: "amount", status: "good", title: "Amount looks familiar", message: `This is in line with your usual payments to ${recipient.name}.` });
  } else if (amounts.length === 1) {
    const prev = amounts[0];
    if (amount > prev*3) { score += 20; checks.push({ type: "amount", status: "warning", title: "Amount is higher than last time", message: `Your last payment to ${recipient.name} was ₹${prev.toLocaleString("en-IN")}.` }); }
    else checks.push({ type: "amount", status: "good", title: "Amount looks familiar", message: `This is close to your last payment to ${recipient.name}.` });
  } else checks.push({ type: "amount", status: "neutral", title: "No amount history yet", message: `This is your first payment to ${recipient.name}, so there's no pattern to compare yet.` });

  if (prior.length >= 3) {
    const dates = prior.map((t) => +new Date(t.created_at));
    const gaps = dates.slice(1).map((d,i)=>(d-dates[i])/dayMs);
    const avgGap = gaps.reduce((a,b)=>a+b,0)/gaps.length;
    const spread = Math.sqrt(gaps.reduce((s,v)=>s+(v-avgGap)**2,0)/gaps.length);
    if (avgGap >= 3 && spread <= avgGap*0.4) {
      const since = (Date.now()-dates[dates.length-1])/dayMs;
      if (Math.abs(since-avgGap)>7) { score += 10; checks.push({ type:"timing", status:"warning", title:"Timing is different", message: since < avgGap ? `You usually pay ${recipient.name} about every ${Math.round(avgGap)} days, but it's only been ${Math.round(since)} days since your last payment.` : `You usually pay ${recipient.name} about every ${Math.round(avgGap)} days, and it's been ${Math.round(since)} days since your last payment.` }); }
      else checks.push({ type:"timing", status:"good", title:"Timing looks familiar", message:"You usually make this payment around this time." });
    } else checks.push({ type:"timing", status:"neutral", title:"No regular pattern", message:`Your past payments to ${recipient.name} don't follow a fixed schedule.` });
  } else checks.push({ type:"timing", status:"neutral", title:"Not enough history", message:`There isn't enough history with ${recipient.name} to compare timing yet.` });

  const similar = state.recipients.filter(r=>r.user_id===userId && r.id!==recipientId).map(r=>({r, s: similarity(recipient.name,r.name)})).filter(x=>x.s>=0.6).sort((a,b)=>b.s-a.s)[0];
  if (similar) { score += 30; checks.push({ type:"similar", status:"warning", title:"Similar recipient found", message:`You also have a saved recipient named ${similar.r.name}.` }); }
  else checks.push({ type:"similar", status:"good", title:"No similar recipient found", message:"No closely matching recipient was found." });

  const level = score >= 55 ? "HIGH" : score >= 25 ? "MODERATE" : "LOW";
  const warnings = checks.filter(c=>c.status === "warning").length;
  const summary = level === "HIGH" ? `${warnings} things look different. Take a moment to verify before sending.` : level === "MODERATE" ? "A few details are different from your usual payments. Take a second look." : "This payment looks consistent with your recent activity.";
  return { level, score, checks, summary };
}

export const api = {
  getUsers: async () => { try { const data = await request<User[]>("/users"); setDemoMode(false); return data; } catch { setDemoMode(true); return localUsers(); } },
  getUser: async (id: number) => { try { const data = await request<User>(`/users/${id}`); setDemoMode(false); return data; } catch { setDemoMode(true); const u = localUser(id); if (!u) throw new Error("Demo account not found."); return u; } },
  getRecipients: async (userId: number) => { try { const data = await request<Recipient[]>(`/recipients?userId=${userId}`); setDemoMode(false); return data; } catch { setDemoMode(true); return localRecipients(userId); } },
  addRecipient: async (payload: { userId:number; name:string; upiId:string; profession?:string }) => { try { const data = await request<Recipient>("/recipients", {method:"POST",body:JSON.stringify(payload)}); setDemoMode(false); return data; } catch { setDemoMode(true); const state=loadDemoState(); const item:Recipient={id:Math.max(0,...state.recipients.map(r=>r.id))+1,user_id:payload.userId,name:payload.name.trim(),upi_id:payload.upiId.trim(),profession:payload.profession?.trim()||null}; state.recipients.push(item); saveDemoState(state); return item; } },
  getTransactions: async (userId: number) => { try { const data = await request<Transaction[]>(`/transactions?userId=${userId}`); setDemoMode(false); return data; } catch { setDemoMode(true); return localTransactions(userId); } },
  checkPayment: async (payload: {userId:number;recipientId:number;amount:number}) => { try { const data=await request<SafetyCheckResult>("/payments/check",{method:"POST",body:JSON.stringify(payload)}); setDemoMode(false); return data; } catch { setDemoMode(true); return localSafetyCheck(payload.userId,payload.recipientId,payload.amount); } },
  confirmPayment: async (payload: {userId:number;recipientId:number;amount:number;pin:string;concernLevel:string;concernReasons:unknown}) => {
    try { const data=await request<{transaction:any;balance:number;undoWindowMs:number}>("/payments/confirm",{method:"POST",body:JSON.stringify(payload)}); setDemoMode(false); return data; }
    catch {
      setDemoMode(true); if (payload.pin !== "123456") throw new Error("Incorrect PIN. Try 123456 for the demo.");
      const state=loadDemoState(); const user=state.users.find(u=>u.id===payload.userId); const recipient=state.recipients.find(r=>r.id===payload.recipientId);
      if (!user || !recipient) throw new Error("Demo payment details could not be found."); if (payload.amount>user.balance) throw new Error("This amount is more than your available balance.");
      user.balance -= payload.amount; const transaction:Transaction={id:state.nextTransactionId++,amount:payload.amount,status:"completed",concern_level:payload.concernLevel as any,concern_reasons:payload.concernReasons as any,created_at:new Date().toISOString(),recipient_name:recipient.name,upi_id:recipient.upi_id,profession:recipient.profession}; state.transactions.push(transaction); saveDemoState(state);
      return {transaction,balance:user.balance,undoWindowMs:10000};
    }
  },
  undoPayment: async (transactionId:number) => {
    try { const data=await request<{status:string;balance:number}>("/payments/undo",{method:"POST",body:JSON.stringify({transactionId})}); setDemoMode(false); return data; }
    catch {
      setDemoMode(true); const state=loadDemoState(); const txn=state.transactions.find(t=>t.id===transactionId); if(!txn) throw new Error("Transaction not found."); if(txn.status==="reversed") throw new Error("This payment has already been reversed."); if(Date.now()-new Date(txn.created_at).getTime()>12000) throw new Error("The undo window for this payment has passed.");
      const recipient=state.recipients.find(r=>r.name===txn.recipient_name && r.upi_id===txn.upi_id); const user=recipient&&state.users.find(u=>u.id===recipient.user_id); if(!user) throw new Error("Demo account not found."); txn.status="reversed"; user.balance+=Number(txn.amount); saveDemoState(state); return {status:"reversed",balance:user.balance};
    }
  },
};
