# Dinner Roulette Splitter

A full-stack roulette-style bill splitter for dinner groups. The frontend collects the bill, diners, and casino-style red, black, or green bets. The Worker backend spins and returns an exact settlement.

The main experience opens with a Three.js casino entrance, animated table camera move, 3D roulette table, and chip-drop spin feedback before the audited settlement appears.

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
- Zaro AI Agent calls the configured MCP server with `ZARO_MCP_URL` and `ZARO_MCP_TOOL_NAME`.
- Fallback Agent performs deterministic local settlement if AI is missing, invalid, or unavailable.
- Audit Agent verifies exact totals, winner exemptions, green credits, and valid colors.
- Payment Agent creates Stripe checkout sessions for payers.

The knowledge bank is available at `/api/knowledge`; the agent roster is available at `/api/agents`.

## Run locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Zaro MCP configuration

The app is MCP-native. It does not expect a Zaro API key.

Set these environment variables locally or in Vercel:

```bash
ZARO_MCP_URL=https://your-zaro-mcp-host.example.com/mcp
ZARO_MCP_TOOL_NAME=spin
```

Optional:

```bash
ZARO_MCP_AUTH_TOKEN=only-if-your-mcp-host-requires-bearer-auth
ZARO_MCP_PROTOCOL_VERSION=2025-06-18
ZARO_MCP_TIMEOUT_MS=8000
```

The MCP tool should return structured content or text JSON containing one of:

```json
{ "landedColor": "red" }
```

`landed_color` and `color` are also accepted. The backend calculates and audits the money split itself.

## Deploy on Vercel

This repo includes a Vercel serverless adapter at `api/index.js` and routing in `vercel.json`, so all routes are served by the same Worker-style app.

1. Import the repo into Vercel.
2. Add the Zaro MCP environment variables above.
3. Deploy.
4. Smoke test:

```bash
curl https://your-vercel-domain.vercel.app/api/health
curl -X POST https://your-vercel-domain.vercel.app/api/spin \
  -H 'content-type: application/json' \
  -d '{"bill":42.5,"players":[{"name":"Ava","color":"red"},{"name":"Ben","color":"black"},{"name":"Mia","color":"green"}]}'
```

If Zaro is configured, `/api/health` returns `integrations.zaroMcp: true` and `/api/spin` returns `calculationProvider: "zaro-ai"`. If the MCP server is unavailable, the app falls back to local settlement and says so in `agentTrace`.

## Check

```bash
npm run build
npm run validate
```
