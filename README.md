# Dinner Roulette Splitter

A full-stack roulette-style bill splitter for dinner groups. The frontend collects the bill, diners, and color picks. The Worker backend spins red, blue, or green and returns an exact settlement.

## Rules

- If a diner picked the landed color, they pay nothing tonight.
- If green lands, green winners also receive 3 future bill credits.
- Everyone who did not win pays enough to cover the full bill.
- If nobody wins, everyone splits the bill evenly.
- Settlement is penny-safe, so the allocated total always equals the bill.

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
