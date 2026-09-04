# SafeSend Advanced UI + Offline Demo Mode

## What changed
- Guided Recipient → Safety Check → Review → PIN → Success workflow.
- Explainable SafeSend warnings instead of relying on a raw risk score in the UI.
- Recipient identity and similar-recipient checks.
- 10-second undo experience.
- Inclusive, high-contrast, large-touch UI patterns.
- **Offline demo fallback:** if the API or PostgreSQL is unavailable, the frontend automatically uses seeded demo data in localStorage.
- Offline payments, history, recipient creation and undo continue to work for demonstrations.
- Server `/api/health` now reports database state without making the whole app unusable.

## Run

```powershell
npm run install:all
npm run dev:server
```

In another terminal:

```powershell
npm run dev:client
```

Open the Vite URL shown in the terminal.

## Demo PIN

`123456`

## Reset offline demo data

Open Chrome DevTools → Application → Local Storage and remove:

- `safesend.demoState`
- `safesend.demoMode`

Then refresh.
\n\n### SafeHold + one-time recipients\n- **SafeHold:** funds are reserved at PIN confirmation, held for 10 seconds, cancellable during the window, and finalized automatically when the window expires.\n- **One-time recipient:** Send Money includes “Send to someone new”, so users do not have to save a recipient just to make a payment.\n- The prototype labels this behavior clearly as simulated; real UPI execution would require payment-provider/bank support for the relevant authorization or delayed-execution mechanism.\n