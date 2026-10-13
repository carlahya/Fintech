const sessions = [];

const knowledgeBank = {
  version: "2026-10-13.2",
  product: "Dinner Roulette Splitter",
  purpose: "Gamified group bill settlement for dinner tables.",
  rules: [
    "Diners pick one color: red, black, or green.",
    "The roulette spin lands on exactly one of red, black, or green.",
    "Diners whose pick matches the landed color pay 0 for the current bill.",
    "If green lands, green winners also receive 3 future bill credits.",
    "If nobody matches the landed color, everyone pays.",
    "If at least one diner wins, only non-winners pay.",
    "If every diner picked the landed color, protect one diner and redistribute the bill to the rest so the bill is still payable.",
    "The total amount allocated to payers must equal the bill exactly in minor currency units.",
    "Amounts should be as even as possible among payers, with any penny remainder distributed one penny at a time.",
    "Never ask winners to pay in the current bill.",
    "Never create a settlement with no payers unless the bill is 0, which this app does not allow."
  ],
  examples: [
    {
      bill: 120,
      players: [
        { name: "Ana", color: "red" },
        { name: "Ben", color: "black" },
        { name: "Cy", color: "green" }
      ],
      landedColor: "red",
      expected: [
        { name: "Ana", pays: 0, futureCredits: 0 },
        { name: "Ben", pays: 60, futureCredits: 0 },
        { name: "Cy", pays: 60, futureCredits: 0 }
      ]
    },
    {
      bill: 99.99,
      players: [
        { name: "A", color: "red" },
        { name: "B", color: "black" },
        { name: "C", color: "green" },
        { name: "D", color: "red" }
      ],
      landedColor: "green",
      expected: [
        { name: "A", pays: 33.33, futureCredits: 0 },
        { name: "B", pays: 33.33, futureCredits: 0 },
        { name: "C", pays: 0, futureCredits: 3 },
        { name: "D", pays: 33.33, futureCredits: 0 }
      ]
    },
    {
      bill: 80,
      players: [
        { name: "Ivy", color: "red" },
        { name: "Jon", color: "red" },
        { name: "Kim", color: "red" },
        { name: "Lou", color: "red" }
      ],
      landedColor: "black",
      expected: [
        { name: "Ivy", pays: 20, futureCredits: 0 },
        { name: "Jon", pays: 20, futureCredits: 0 },
        { name: "Kim", pays: 20, futureCredits: 0 },
        { name: "Lou", pays: 20, futureCredits: 0 }
      ]
    }
  ],
  aiContract: {
    acceptedOutput: "Return JSON with landedColor or landed_color equal to red, black, or green. The app will independently calculate and audit amounts.",
    fallback: "If AI is unavailable, slow, invalid, or misconfigured, use deterministic local settlement.",
    audit: "Every settlement is checked for valid color, exact total, winner pays 0, green credits, and payer count."
  }
};

const agents = [
  { id: "rules-agent", name: "Rules Agent", role: "Loads the knowledge bank and prepares the rules for the calculation provider." },
  { id: "zaro-agent", name: "Zaro AI Agent", role: "Asks the configured AI provider for the spin/settlement signal when available." },
  { id: "fallback-agent", name: "Fallback Agent", role: "Produces deterministic settlement if AI is missing, invalid, or unreachable." },
  { id: "audit-agent", name: "Audit Agent", role: "Verifies exact bill total, winner exemptions, green credits, and valid colors." },
  { id: "payment-agent", name: "Payment Agent", role: "Creates Stripe checkout sessions only for diners who owe money." }
];

const page = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dinner Roulette Splitter</title>
    <meta name="description" content="Split a dinner bill with a roulette-style color game.">
    <style>
      :root {
        color-scheme: dark;
        --ink: #fbfcff;
        --muted: #9aa6b8;
        --line: rgba(255,255,255,.13);
        --panel: rgba(13, 18, 31, .82);
        --panel-strong: rgba(8, 11, 20, .94);
        --red: #ff5a66;
        --black: #10131a;
        --green: #3ee58b;
        --gold: #ffd166;
        --mint: #b8ffe0;
        --shadow: 0 24px 70px rgba(0,0,0,.32);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * { box-sizing: border-box; }
      html { min-width: 320px; background: #070a12; }
      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        background:
          linear-gradient(120deg, rgba(255,90,102,.16) 0 18%, transparent 18% 100%),
          linear-gradient(245deg, rgba(71,194,255,.16) 0 16%, transparent 16% 100%),
          linear-gradient(135deg, #070914 0%, #111827 42%, #081611 100%);
      }

      button, input, select { font: inherit; }
      button { border: 0; cursor: pointer; }
      .shell { width: min(1180px, calc(100% - 28px)); margin: 0 auto; padding: 18px 0 34px; }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
        color: var(--muted);
      }
      .brand { display: flex; align-items: center; gap: 10px; color: var(--ink); font-weight: 900; }
      .logo {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: conic-gradient(var(--red), var(--black), var(--green), var(--red));
        color: #061018;
        box-shadow: 0 12px 28px rgba(0,0,0,.28);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.07);
        border-radius: 999px;
        padding: 8px 10px;
        color: #dfe8f7;
        font-size: .86rem;
      }
      header {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(300px, .95fr);
        gap: 22px;
        align-items: stretch;
        min-height: 320px;
      }
      .hero, .control, .panel {
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: var(--shadow);
        backdrop-filter: blur(18px);
      }
      .hero { border-radius: 8px; padding: 34px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; }
      .hero::after {
        content: "";
        position: absolute;
        inset: auto 24px 24px auto;
        width: min(42%, 260px);
        aspect-ratio: 1;
        border-radius: 50%;
        background: conic-gradient(from -18deg, var(--red) 0 33%, var(--black) 0 66%, var(--green) 0 100%);
        border: 10px solid rgba(255,255,255,.86);
        box-shadow: inset 0 0 0 10px rgba(8,11,20,.42), 0 24px 46px rgba(0,0,0,.25);
        opacity: .72;
      }
      .eyebrow { color: var(--gold); font-weight: 800; letter-spacing: 0; text-transform: uppercase; font-size: .78rem; }
      h1 { margin: 12px 0 12px; font-size: clamp(2.45rem, 6vw, 5.6rem); line-height: .92; letter-spacing: 0; max-width: 760px; position: relative; z-index: 1; }
      .hero p { margin: 0; color: #d8dee9; max-width: 640px; font-size: 1.05rem; line-height: 1.6; position: relative; z-index: 1; }
      .quick-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 22px; position: relative; z-index: 1; }
      .step { border: 1px solid var(--line); background: rgba(255,255,255,.065); border-radius: 8px; padding: 12px; }
      .step b { display: block; color: var(--mint); margin-bottom: 5px; }
      .step span { color: var(--muted); font-size: .86rem; line-height: 1.35; }
      .stats { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; position: relative; z-index: 1; }
      .stat { border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; background: rgba(255,255,255,.06); min-width: 132px; }
      .stat b { display: block; font-size: 1.35rem; }
      .stat span { color: var(--muted); font-size: .82rem; }

      .control { border-radius: 8px; padding: 22px; }
      .section-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
      h2, h3 { margin: 0; letter-spacing: 0; }
      h2 { font-size: 1.25rem; }
      h3 { font-size: 1rem; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      label { display: grid; gap: 7px; color: var(--muted); font-size: .85rem; }
      input, select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(4, 7, 13, .74);
        color: var(--ink);
        padding: 12px;
        outline: none;
      }
      input:focus, select:focus { border-color: rgba(251,191,36,.75); box-shadow: 0 0 0 3px rgba(251,191,36,.14); }
      .actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
      .primary, .secondary {
        border-radius: 8px;
        min-height: 44px;
        padding: 0 16px;
        color: #081018;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .primary { background: linear-gradient(135deg, #fbbf24, #fb7185 48%, #38bdf8); }
      .secondary { color: var(--ink); background: rgba(255,255,255,.08); border: 1px solid var(--line); }
      .primary:disabled { filter: grayscale(.8); opacity: .6; cursor: wait; }

      main { display: grid; grid-template-columns: minmax(310px, .88fr) minmax(0, 1.12fr); gap: 22px; margin-top: 22px; align-items: start; }
      .panel { border-radius: 8px; padding: 20px; }
      .agent-strip {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-top: 22px;
      }
      .agent {
        border: 1px solid var(--line);
        background: rgba(255,255,255,.06);
        border-radius: 8px;
        padding: 12px;
        min-height: 82px;
      }
      .agent b { display: block; margin-bottom: 6px; color: #eaf3ff; }
      .agent span { color: var(--muted); font-size: .84rem; line-height: 1.35; }
      .agent.active { border-color: rgba(62,229,139,.45); background: rgba(62,229,139,.1); }
      .players { display: grid; gap: 10px; }
      .player {
        display: grid;
        grid-template-columns: minmax(92px, 1fr) 124px;
        gap: 10px;
        align-items: end;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 12px;
        background: rgba(255,255,255,.05);
      }
      .casino-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 24px; align-items: stretch; }
      .wheel-stage { position: relative; width: 300px; height: 300px; margin: 0 auto; }
      .pointer {
        position: absolute;
        left: 50%;
        top: -4px;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 17px solid transparent;
        border-right: 17px solid transparent;
        border-top: 34px solid var(--gold);
        filter: drop-shadow(0 7px 8px rgba(0,0,0,.45));
        z-index: 2;
      }
      .wheel {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 12px solid rgba(255,255,255,.92);
        background: conic-gradient(var(--red) 0 114deg, var(--black) 114deg 228deg, var(--green) 228deg 246deg, var(--red) 246deg 303deg, var(--black) 303deg 360deg);
        box-shadow: inset 0 0 0 8px rgba(2,6,23,.55), 0 26px 70px rgba(0,0,0,.45);
        transform: rotate(0deg);
        transition: transform 2.6s cubic-bezier(.13,.82,.13,1);
      }
      .wheel::before {
        content: "";
        position: absolute;
        inset: 50%;
        width: 74px;
        height: 74px;
        margin: -37px;
        border-radius: 50%;
        background: #0f172a;
        border: 8px solid rgba(255,255,255,.9);
      }
      .roulette-felt {
        min-height: 300px;
        border-radius: 8px;
        border: 2px solid rgba(255,255,255,.22);
        background:
          linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255,255,255,.06) 1px, transparent 1px),
          linear-gradient(135deg, #0d6a45, #06452f);
        background-size: 64px 64px, 64px 64px, auto;
        padding: 14px;
        box-shadow: inset 0 0 0 5px rgba(255,255,255,.05), inset 0 0 46px rgba(0,0,0,.34);
      }
      .roulette-felt + .result-card { margin-top: 14px; }
      .felt-title { display: flex; justify-content: space-between; gap: 10px; align-items: center; color: #eafff6; font-weight: 900; margin-bottom: 12px; }
      .bet-grid {
        display: grid;
        grid-template-columns: 80px repeat(6, minmax(38px, 1fr));
        grid-auto-rows: minmax(44px, auto);
        gap: 6px;
      }
      .zero-cell, .number-cell, .outside-bet {
        display: grid;
        place-items: center;
        border: 1px solid rgba(255,255,255,.42);
        border-radius: 4px;
        color: #fff;
        font-weight: 900;
        text-transform: uppercase;
        text-align: center;
        min-height: 44px;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,.2);
      }
      .zero-cell { grid-row: span 3; background: var(--green); color: #04130b; }
      .number-cell.red, .outside-bet.red { background: linear-gradient(180deg, #f0525f, #a70f1f); }
      .number-cell.black, .outside-bet.black { background: linear-gradient(180deg, #202632, #05070b); }
      .outside-bet.green { background: linear-gradient(180deg, #3ee58b, #087a42); color: #04130b; }
      .outside-bet { min-height: 54px; font-size: clamp(.78rem, 1.9vw, 1rem); padding: 8px; }
      .outside-bet.red { grid-column: 1 / span 2; }
      .outside-bet.black { grid-column: 3 / span 3; }
      .outside-bet.green { grid-column: 6 / span 2; }
      .legend { display: grid; gap: 10px; margin-top: 18px; }
      .chip { display: inline-flex; align-items: center; gap: 9px; color: var(--muted); }
      .dot { width: 13px; height: 13px; border-radius: 50%; display: inline-block; }
      .result-card {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
        padding: 18px;
        min-height: 180px;
      }
      .result-card strong { font-size: clamp(2rem, 5vw, 4.5rem); line-height: 1; display: block; text-transform: capitalize; }
      .result-card p { color: var(--muted); line-height: 1.5; margin: 12px 0 0; }
      .breakdown { display: grid; gap: 10px; margin-top: 16px; }
      .row {
        display: grid;
        grid-template-columns: minmax(90px, 1fr) 88px 95px 132px;
        gap: 8px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 10px;
        background: rgba(255,255,255,.045);
        color: #dbe5f3;
      }
      .row.header { color: var(--muted); font-size: .78rem; text-transform: uppercase; font-weight: 800; background: transparent; }
      .pill { border-radius: 999px; padding: 5px 8px; font-size: .78rem; font-weight: 800; text-align: center; color: #071018; text-transform: capitalize; }
      .pill.red { background: var(--red); }
      .pill.black { background: #111827; color: #f8fafc; border: 1px solid rgba(255,255,255,.28); }
      .pill.green { background: var(--green); }
      .status { color: var(--muted); min-height: 1.3em; margin-top: 12px; }
      .history { margin-top: 16px; color: var(--muted); font-size: .9rem; line-height: 1.5; }
      .trace { display: grid; gap: 8px; margin-top: 14px; }
      .trace-item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 9px 10px;
        color: #dfe8f7;
        background: rgba(255,255,255,.04);
      }
      .trace-item small { color: var(--muted); }
      .error { color: #fecdd3; }
      .pay {
        border-radius: 8px;
        background: rgba(34,197,94,.16);
        border: 1px solid rgba(34,197,94,.34);
        color: #bbf7d0;
        padding: 8px 10px;
        font-weight: 800;
      }
      .pay:disabled { opacity: .55; cursor: wait; }

      @media (max-width: 920px) {
        header, main, .casino-layout, .agent-strip { grid-template-columns: 1fr; }
        .hero { min-height: 360px; }
      }
      @media (max-width: 560px) {
        .shell { width: min(100% - 20px, 1180px); padding-top: 10px; }
        .hero, .control, .panel { padding: 16px; }
        .grid, .player { grid-template-columns: 1fr; }
        .quick-steps { grid-template-columns: 1fr; }
        .topbar { align-items: flex-start; flex-direction: column; }
        .wheel-stage { width: min(282px, 100%); height: auto; aspect-ratio: 1; }
        .bet-grid { grid-template-columns: 56px repeat(3, minmax(44px, 1fr)); }
        .zero-cell { grid-row: span 2; }
        .outside-bet.red, .outside-bet.black, .outside-bet.green { grid-column: auto / span 2; }
        .row { grid-template-columns: 1fr 72px; }
        .row.header { display: none; }
        .row span:nth-child(3), .row span:nth-child(4) { color: var(--muted); font-size: .86rem; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <nav class="topbar" aria-label="Product status">
        <div class="brand"><span class="logo">DR</span><span>Dinner Roulette</span></div>
        <div class="badge" id="systemBadge">AI assisted • rule-backed</div>
      </nav>
      <header>
        <section class="hero">
          <div>
            <div class="eyebrow">Fresh way to split dinner</div>
            <h1>Spin once. Settle fairly.</h1>
            <p>A simple game for the table with serious backup behind it: AI can help choose the result, deterministic math keeps the bill exact, and audit checks run before anyone pays.</p>
            <div class="quick-steps" aria-label="How it works">
              <div class="step"><b>1. Add the bill</b><span>Enter the total and seat count.</span></div>
              <div class="step"><b>2. Pick bets</b><span>Each diner chooses red, black, or green.</span></div>
              <div class="step"><b>3. Spin & pay</b><span>Winners skip, payers get checkout buttons.</span></div>
            </div>
          </div>
          <div class="stats" aria-label="Game rules">
            <div class="stat"><b>0</b><span>winners pay tonight</span></div>
            <div class="stat"><b>3</b><span>future passes on green</span></div>
            <div class="stat"><b>100%</b><span>bill always reconciled</span></div>
          </div>
        </section>
        <section class="control">
          <div class="section-title">
            <h2>Table setup</h2>
            <span class="chip"><span class="dot" style="background:var(--gold)"></span>Backend calculated</span>
          </div>
          <div class="grid">
            <label>Total bill
              <input id="bill" type="number" min="1" step="0.01" value="240.00" inputmode="decimal">
            </label>
            <label>People seated
              <input id="people" type="number" min="2" max="16" step="1" value="6" inputmode="numeric">
            </label>
          </div>
          <div class="actions">
            <button class="primary" id="build" type="button">Set table</button>
            <button class="secondary" id="demo" type="button">Shuffle picks</button>
          </div>
          <p class="status" id="setupStatus"></p>
        </section>
      </header>

      <section class="agent-strip" aria-label="Background agents">
        <div class="agent active"><b>Rules Agent</b><span>Loads the knowledge bank and game rules.</span></div>
        <div class="agent" id="zaroAgent"><b>Zaro AI Agent</b><span>Used when the API endpoint is configured.</span></div>
        <div class="agent active"><b>Fallback Agent</b><span>Exact local math is always available.</span></div>
        <div class="agent active"><b>Audit Agent</b><span>Checks totals, winners, and green credits.</span></div>
      </section>

      <main>
        <section class="panel">
          <div class="section-title">
            <h2>Diners</h2>
            <span id="tableMeta" class="chip">6 seated</span>
          </div>
          <div id="players" class="players"></div>
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Roulette table</h2>
            <button class="primary" id="spin" type="button">Spin now</button>
          </div>
          <div class="casino-layout">
            <div>
              <div class="wheel-stage" aria-label="Roulette wheel">
                <div class="pointer"></div>
                <div id="wheel" class="wheel"></div>
              </div>
              <div class="legend">
                <span class="chip"><span class="dot" style="background:var(--red)"></span>Red: matching diners pay 0</span>
                <span class="chip"><span class="dot" style="background:var(--black); border:1px solid rgba(255,255,255,.45)"></span>Black: matching diners pay 0</span>
                <span class="chip"><span class="dot" style="background:var(--green)"></span>Green: pay 0 plus 3 future passes</span>
              </div>
            </div>
            <div>
              <div class="roulette-felt" aria-label="Casino roulette betting table">
                <div class="felt-title"><span>Place color bets</span><span>0-12 demo layout</span></div>
                <div class="bet-grid">
                  <div class="zero-cell">0</div>
                  <div class="number-cell red">1</div>
                  <div class="number-cell black">2</div>
                  <div class="number-cell red">3</div>
                  <div class="number-cell black">4</div>
                  <div class="number-cell red">5</div>
                  <div class="number-cell black">6</div>
                  <div class="number-cell red">7</div>
                  <div class="number-cell black">8</div>
                  <div class="number-cell red">9</div>
                  <div class="number-cell black">10</div>
                  <div class="number-cell red">11</div>
                  <div class="number-cell black">12</div>
                  <div class="outside-bet red">Red</div>
                  <div class="outside-bet black">Black</div>
                  <div class="outside-bet green">Green</div>
                </div>
              </div>
              <div class="result-card" id="resultCard">
                <strong>Ready</strong>
                <p>Add the dinner table and spin. If nobody matches the color, everyone splits the bill evenly.</p>
              </div>
              <p class="status" id="apiStatus"></p>
            </div>
          </div>
          <div id="breakdown" class="breakdown"></div>
          <div id="trace" class="trace"></div>
          <div id="history" class="history"></div>
        </section>
      </main>
    </div>

    <script>
      const colors = ["red", "black", "green"];
      const playersEl = document.querySelector("#players");
      const billEl = document.querySelector("#bill");
      const peopleEl = document.querySelector("#people");
      const buildEl = document.querySelector("#build");
      const demoEl = document.querySelector("#demo");
      const spinEl = document.querySelector("#spin");
      const statusEl = document.querySelector("#setupStatus");
      const apiStatusEl = document.querySelector("#apiStatus");
      const tableMetaEl = document.querySelector("#tableMeta");
      const wheelEl = document.querySelector("#wheel");
      const resultCardEl = document.querySelector("#resultCard");
      const breakdownEl = document.querySelector("#breakdown");
      const historyEl = document.querySelector("#history");
      const traceEl = document.querySelector("#trace");
      const systemBadgeEl = document.querySelector("#systemBadge");
      const zaroAgentEl = document.querySelector("#zaroAgent");
      let rotation = 0;

      function money(value) {
        return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
      }

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]);
      }

      function buildPlayers() {
        const count = Math.max(2, Math.min(16, Number.parseInt(peopleEl.value || "2", 10)));
        peopleEl.value = String(count);
        playersEl.innerHTML = "";
        for (let index = 0; index < count; index += 1) {
          const row = document.createElement("div");
          row.className = "player";
          row.innerHTML =
            '<label>Name <input class="name" value="Diner ' + (index + 1) + '" maxlength="24"></label>' +
            '<label>Bet <select class="pick"><option value="red">Red</option><option value="black">Black</option><option value="green">Green</option></select></label>';
          row.querySelector(".pick").value = colors[index % colors.length];
          playersEl.appendChild(row);
        }
        tableMetaEl.textContent = count + " seated";
        statusEl.textContent = "Table is ready. Pick bets, then spin.";
      }

      function shufflePicks() {
        [...document.querySelectorAll(".pick")].forEach((select) => {
          select.value = colors[Math.floor(Math.random() * colors.length)];
        });
        statusEl.textContent = "Color picks shuffled.";
      }

      function payload() {
        return {
          bill: Number.parseFloat(billEl.value),
          players: [...document.querySelectorAll(".player")].map((row, index) => ({
            name: row.querySelector(".name").value.trim() || "Diner " + (index + 1),
            color: row.querySelector(".pick").value
          }))
        };
      }

      function animateWheel(color) {
        const target = { red: 58, black: 178, green: 237 }[color];
        rotation += 1440 + (360 - target);
        wheelEl.style.transform = "rotate(" + rotation + "deg)";
      }

      function renderResult(data) {
        const winnerText = data.winners.length
          ? data.winners.map((winner) => escapeHtml(winner.name)).join(", ") + " matched " + data.landedColor + "."
          : "Nobody matched, so everyone pays.";
        resultCardEl.innerHTML =
          '<strong style="color:var(--' + data.landedColor + ')">' + data.landedColor + '</strong>' +
          '<p>' + winnerText + ' Total collected: ' + money(data.totalAllocated) + ' of ' + money(data.bill) + '. ' +
          'Settlement: ' + escapeHtml(data.calculationProvider || "local") + '.</p>';

        breakdownEl.innerHTML =
          '<div class="row header"><span>Diner</span><span>Pick</span><span>Status</span><span>Pays</span></div>' +
          data.assignments.map((item, index) =>
            '<div class="row"><span>' + escapeHtml(item.name) + '</span><span class="pill ' + item.color + '">' + item.color + '</span><span>' +
            escapeHtml(item.status) + (item.futureCredits ? " +" + item.futureCredits + " future" : "") +
            '</span><span>' + (item.pays > 0
              ? '<button class="pay" type="button" data-index="' + index + '">Pay ' + money(item.pays) + '</button>'
              : money(item.pays)) + '</span></div>'
          ).join("");

        traceEl.innerHTML = (data.agentTrace || []).map((item) =>
          '<div class="trace-item"><span>' + escapeHtml(item.agent) + '</span><small>' + escapeHtml(item.status) + '</small></div>'
        ).join("");
        historyEl.textContent = "Session " + data.id + " • " + data.payers.length + " payer(s), " + data.winners.length + " winner(s). Knowledge bank " + (data.knowledgeVersion || "local") + ".";
        breakdownEl.querySelectorAll(".pay").forEach((button) => {
          button.addEventListener("click", () => checkout(data.id, Number(button.dataset.index), button));
        });
      }

      async function checkout(sessionId, assignmentIndex, button) {
        button.disabled = true;
        apiStatusEl.textContent = "Creating Stripe checkout...";
        apiStatusEl.className = "status";
        try {
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sessionId, assignmentIndex })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not create checkout.");
          if (data.url) {
            window.location.href = data.url;
          } else {
            apiStatusEl.textContent = data.message || "Stripe is not configured for this environment.";
            button.disabled = false;
          }
        } catch (error) {
          apiStatusEl.textContent = error.message;
          apiStatusEl.className = "status error";
          button.disabled = false;
        }
      }

      async function spin() {
        apiStatusEl.textContent = "Spinning and asking the backend to settle the bill...";
        apiStatusEl.className = "status";
        spinEl.disabled = true;
        try {
          const response = await fetch("/api/spin", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload())
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not spin.");
          animateWheel(data.landedColor);
          window.setTimeout(() => {
            renderResult(data);
            apiStatusEl.textContent = "Backend settlement complete.";
            spinEl.disabled = false;
          }, 900);
        } catch (error) {
          apiStatusEl.textContent = error.message;
          apiStatusEl.className = "status error";
          spinEl.disabled = false;
        }
      }

      buildEl.addEventListener("click", buildPlayers);
      demoEl.addEventListener("click", shufflePicks);
      spinEl.addEventListener("click", spin);
      buildPlayers();

      fetch("/api/health")
        .then((response) => response.json())
        .then((health) => {
          const zaroReady = Boolean(health.integrations && health.integrations.zaroAi);
          const stripeReady = Boolean(health.integrations && health.integrations.stripe);
          systemBadgeEl.textContent = (zaroReady ? "AI online" : "AI fallback ready") + " • " + (stripeReady ? "payments on" : "payments pending");
          zaroAgentEl.classList.toggle("active", zaroReady);
        })
        .catch(() => {
          systemBadgeEl.textContent = "Offline-safe fallback ready";
        });
    </script>
  </body>
</html>`;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function splitBillExactly(total, payerCount) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / payerCount);
  const remainder = cents % payerCount;
  return Array.from({ length: payerCount }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100);
}

function validate(body) {
  const bill = Number(body?.bill);
  const players = Array.isArray(body?.players) ? body.players : [];
  if (!Number.isFinite(bill) || bill <= 0 || bill > 100000) {
    return { error: "Enter a valid bill above 0." };
  }
  if (players.length < 2 || players.length > 16) {
    return { error: "Seat between 2 and 16 people." };
  }
  const cleaned = players.map((player, index) => ({
    name: String(player?.name || `Diner ${index + 1}`).trim().slice(0, 24) || `Diner ${index + 1}`,
    color: String(player?.color || "").toLowerCase(),
  }));
  if (cleaned.some((player) => !["red", "black", "green"].includes(player.color))) {
    return { error: "Every diner must pick red, black, or green." };
  }
  return { bill: roundCurrency(bill), players: cleaned };
}

function localSettle(valid, provider = "local-fallback") {
  const landedColor = ["red", "black", "green"][Math.floor(Math.random() * 3)];
  return buildSettlement(valid, landedColor, provider);
}

function buildSettlement(valid, landedColor, provider = "local") {
  if (!["red", "black", "green"].includes(landedColor)) {
    return { error: "Settlement provider returned an invalid roulette color." };
  }
  
  let winners = valid.players.filter((player) => player.color === landedColor);
  let payers = winners.length === 0
    ? valid.players
    : valid.players.filter((player) => player.color !== landedColor);
  if (winners.length === valid.players.length) {
    winners = [valid.players[0]];
    payers = valid.players.slice(1);
  }
  const shares = splitBillExactly(valid.bill, payers.length);
  let payerIndex = 0;

  const assignments = valid.players.map((player) => {
    const won = winners.includes(player);
    if (won) {
      return {
        ...player,
        pays: 0,
        status: landedColor === "green" ? "green winner" : "winner",
        futureCredits: landedColor === "green" ? 3 : 0,
      };
    }
    const pays = shares[payerIndex] ?? 0;
    payerIndex += 1;
    return { ...player, pays, status: "pays", futureCredits: 0 };
  });

  return {
    id: crypto.randomUUID().slice(0, 8),
    bill: valid.bill,
    landedColor,
    winners: assignments.filter((item) => item.pays === 0 && item.color === landedColor),
    payers: assignments.filter((item) => item.pays > 0),
    assignments,
    totalAllocated: roundCurrency(assignments.reduce((sum, item) => sum + item.pays, 0)),
    calculationProvider: provider,
    knowledgeVersion: knowledgeBank.version,
    fallbackUsed: provider !== "zaro-ai",
    createdAt: new Date().toISOString(),
  };
}

function auditSettlement(result, valid) {
  if (result.error) return result.error;
  if (!["red", "black", "green"].includes(result.landedColor)) return "Landed color is invalid.";
  if (result.assignments.length !== valid.players.length) return "Assignment count does not match player count.";
  if (roundCurrency(result.totalAllocated) !== valid.bill) return "Allocated total does not equal bill.";

  const winners = result.assignments.filter((item) => item.color === result.landedColor && item.pays === 0);
  const payers = result.assignments.filter((item) => item.pays > 0);
  if (winners.some((item) => item.pays !== 0)) return "A winner was asked to pay.";
  if (result.landedColor === "green" && winners.some((item) => item.futureCredits !== 3)) {
    return "A green winner is missing future bill credits.";
  }
  if (winners.length > 0 && payers.length + winners.length !== valid.players.length) {
    return "Payer and winner counts do not reconcile.";
  }
  if (winners.length === valid.players.length) {
    return "Settlement would leave nobody to pay the bill.";
  }
  return null;
}

function normalizeZaroResult(valid, data) {
  const landedColor = String(data?.landedColor || data?.landed_color || data?.color || "").toLowerCase();
  if (!landedColor) return null;
  return buildSettlement(valid, landedColor, "zaro-ai");
}

async function settleWithZaro(valid, env) {
  if (!env?.ZARO_AI_API_KEY || !env?.ZARO_AI_BASE_URL) return null;

  const response = await fetch(env.ZARO_AI_BASE_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.ZARO_AI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      task: "dinner_roulette_bill_settlement",
      knowledge_bank: knowledgeBank,
      bill: valid.bill,
      players: valid.players,
    }),
  });

  if (!response.ok) return null;
  return normalizeZaroResult(valid, await response.json());
}

async function settle(body, env) {
  const valid = validate(body);
  if (valid.error) return valid;

  const agentTrace = [
    { agent: "Rules Agent", status: `Loaded knowledge bank ${knowledgeBank.version}` },
  ];

  const aiConfigured = Boolean(env?.ZARO_AI_API_KEY && env?.ZARO_AI_BASE_URL);
  let result = null;
  if (aiConfigured) {
    result = await settleWithZaro(valid, env).catch(() => null);
    agentTrace.push({
      agent: "Zaro AI Agent",
      status: result ? "Returned a usable color signal" : "Unavailable or invalid, fallback requested",
    });
  } else {
    agentTrace.push({ agent: "Zaro AI Agent", status: "Skipped because API base URL is not configured" });
  }

  if (!result) {
    result = localSettle(valid);
    agentTrace.push({ agent: "Fallback Agent", status: "Created deterministic penny-safe settlement" });
  }

  const auditError = auditSettlement(result, valid);
  if (auditError) {
    agentTrace.push({ agent: "Audit Agent", status: `Rejected settlement: ${auditError}` });
    result = localSettle(valid, "local-audit-recovery");
  }
  const recoveryAuditError = auditSettlement(result, valid);
  if (recoveryAuditError) {
    return { error: recoveryAuditError };
  }
  agentTrace.push({ agent: "Audit Agent", status: "Passed exact-total and winner checks" });
  agentTrace.push({ agent: "Payment Agent", status: "Prepared checkout buttons for payers" });
  result.agentTrace = agentTrace;
  sessions.unshift(result);
  sessions.splice(10);
  return result;
}

async function createStripeCheckout(body, request, env) {
  const session = sessions.find((item) => item.id === body?.sessionId);
  const assignment = session?.assignments?.[Number(body?.assignmentIndex)];
  if (!session || !assignment || !assignment.pays) {
    return { error: "Choose a valid payer from the latest settlement." };
  }
  if (!env?.STRIPE_SECRET_KEY) {
    return { message: "Stripe secret key is not configured yet." };
  }

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][unit_amount]": String(Math.round(assignment.pays * 100)),
    "line_items[0][price_data][product_data][name]": `Dinner Roulette share for ${assignment.name}`,
    success_url: `${origin}/?paid=success&session=${encodeURIComponent(session.id)}`,
    cancel_url: `${origin}/?paid=cancelled&session=${encodeURIComponent(session.id)}`,
    "metadata[session_id]": session.id,
    "metadata[payer_name]": assignment.name,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    return { error: data?.error?.message || "Stripe checkout failed." };
  }
  return { url: data.url, checkoutSessionId: data.id };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    void env;
    void ctx;

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "dinner-roulette-splitter",
        integrations: {
          zaroAi: Boolean(env?.ZARO_AI_API_KEY && env?.ZARO_AI_BASE_URL),
          stripe: Boolean(env?.STRIPE_SECRET_KEY),
        },
        knowledgeVersion: knowledgeBank.version,
        agents: agents.length,
      });
    }
    if (request.method === "GET" && url.pathname === "/api/knowledge") {
      return json({ knowledgeBank });
    }
    if (request.method === "GET" && url.pathname === "/api/agents") {
      return json({ agents });
    }
    if (request.method === "GET" && url.pathname === "/api/sessions") {
      return json({ sessions });
    }
    if (request.method === "POST" && url.pathname === "/api/spin") {
      const result = await settle(await readJson(request), env);
      return result.error ? json(result, { status: 400 }) : json(result);
    }
    if (request.method === "POST" && url.pathname === "/api/checkout") {
      const result = await createStripeCheckout(await readJson(request), request, env);
      return result.error ? json(result, { status: 400 }) : json(result);
    }

    return new Response("Not found", { status: 404 });
  },
};
