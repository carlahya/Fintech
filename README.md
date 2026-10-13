# Dinner Roulette Splitter

A full-stack roulette-style bill splitter for dinner groups. The frontend collects the bill, diners, and color picks. The Worker backend spins red, blue, or green and returns an exact settlement.

## Rules

- If a diner picked the landed color, they pay nothing tonight.
- If green lands, green winners also receive 3 future bill credits.
- Everyone who did not win pays enough to cover the full bill.
- If nobody wins, everyone splits the bill evenly.
- If everyone picked the winning color, one diner is protected and the rest pay so the bill still reconciles.
- Settlement is penny-safe, so the allocated total always equals the bill.

## AI and backups

The backend uses a small agent pipeline:

- Rules Agent loads the embedded knowledge bank.
- Zaro AI Agent calls `ZARO_AI_BASE_URL` with `ZARO_AI_API_KEY` when both are configured.
- Fallback Agent performs deterministic local settlement if AI is missing, invalid, or unavailable.
- Audit Agent verifies exact totals, winner exemptions, green credits, and valid colors.
- Payment Agent creates Stripe checkout sessions for payers.

The knowledge bank is available at `/api/knowledge`; the agent roster is available at `/api/agents`.

## Run locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Check

```bash
npm run build
npm run validate
```
