const sessions = [];

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
        --ink: #f8fafc;
        --muted: #aab4c3;
        --line: rgba(255,255,255,.14);
        --panel: rgba(15, 23, 42, .78);
        --panel-strong: rgba(9, 14, 27, .92);
        --red: #ef4444;
        --blue: #38bdf8;
        --green: #22c55e;
        --gold: #fbbf24;
        --shadow: 0 24px 70px rgba(0,0,0,.35);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * { box-sizing: border-box; }
      html { min-width: 320px; background: #070a12; }
      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        background:
          radial-gradient(circle at 12% 14%, rgba(239,68,68,.24), transparent 28rem),
          radial-gradient(circle at 82% 10%, rgba(56,189,248,.2), transparent 25rem),
          linear-gradient(135deg, #080b14 0%, #14120f 46%, #07130d 100%);
      }

      button, input, select { font: inherit; }
      button { border: 0; cursor: pointer; }
      .shell { width: min(1180px, calc(100% - 28px)); margin: 0 auto; padding: 28px 0 34px; }
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
        inset: auto -12% -42% 34%;
        height: 74%;
        background: conic-gradient(from -24deg, var(--red) 0 33%, var(--blue) 0 66%, var(--green) 0 100%);
        border-radius: 999px;
        filter: blur(38px);
        opacity: .34;
      }
      .eyebrow { color: var(--gold); font-weight: 800; letter-spacing: 0; text-transform: uppercase; font-size: .78rem; }
      h1 { margin: 12px 0 12px; font-size: clamp(2.25rem, 6vw, 5.7rem); line-height: .92; letter-spacing: 0; max-width: 820px; }
      .hero p { margin: 0; color: #d8dee9; max-width: 640px; font-size: 1.05rem; line-height: 1.6; position: relative; z-index: 1; }
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
      .wheel-wrap { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 24px; align-items: center; }
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
        background: conic-gradient(var(--red) 0 120deg, var(--blue) 120deg 240deg, var(--green) 240deg 360deg);
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
      .legend { display: grid; gap: 10px; margin-top: 18px; }
      .chip { display: inline-flex; align-items: center; gap: 9px; color: var(--muted); }
      .dot { width: 13px; height: 13px; border-radius: 50%; display: inline-block; }
      .result-card {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255,255,255,.06);
        padding: 18px;
        min-height: 180px;
      }
      .result-card strong { font-size: clamp(2rem, 5vw, 4.5rem); line-height: 1; display: block; text-transform: capitalize; }
      .result-card p { color: var(--muted); line-height: 1.5; margin: 12px 0 0; }
      .breakdown { display: grid; gap: 10px; margin-top: 16px; }
      .row {
        display: grid;
        grid-template-columns: minmax(90px, 1fr) 88px 95px 86px;
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
      .pill.blue { background: var(--blue); }
      .pill.green { background: var(--green); }
      .status { color: var(--muted); min-height: 1.3em; margin-top: 12px; }
      .history { margin-top: 16px; color: var(--muted); font-size: .9rem; line-height: 1.5; }
      .error { color: #fecdd3; }

      @media (max-width: 920px) {
        header, main, .wheel-wrap { grid-template-columns: 1fr; }
        .hero { min-height: 360px; }
      }
      @media (max-width: 560px) {
        .shell { width: min(100% - 20px, 1180px); padding-top: 10px; }
        .hero, .control, .panel { padding: 16px; }
        .grid, .player { grid-template-columns: 1fr; }
        .wheel-stage { width: min(282px, 100%); height: auto; aspect-ratio: 1; }
        .row { grid-template-columns: 1fr 72px; }
        .row.header { display: none; }
        .row span:nth-child(3), .row span:nth-child(4) { color: var(--muted); font-size: .86rem; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <section class="hero">
          <div>
            <div class="eyebrow">Roulette bill night</div>
            <h1>Dinner Roulette Splitter</h1>
            <p>Enter the bill, add the table, let everyone pick red, blue, or green, then spin. Matching diners skip tonight's bill. Green winners also bank three future bill passes.</p>
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
            <h2>Spin table</h2>
            <button class="primary" id="spin" type="button">Spin now</button>
          </div>
          <div class="wheel-wrap">
            <div>
              <div class="wheel-stage" aria-label="Roulette wheel">
                <div class="pointer"></div>
                <div id="wheel" class="wheel"></div>
              </div>
              <div class="legend">
                <span class="chip"><span class="dot" style="background:var(--red)"></span>Red: matching diners pay 0</span>
                <span class="chip"><span class="dot" style="background:var(--blue)"></span>Blue: matching diners pay 0</span>
                <span class="chip"><span class="dot" style="background:var(--green)"></span>Green: pay 0 plus 3 future passes</span>
              </div>
            </div>
            <div>
              <div class="result-card" id="resultCard">
                <strong>Ready</strong>
                <p>Add the dinner table and spin. If nobody matches the color, everyone splits the bill evenly.</p>
              </div>
              <p class="status" id="apiStatus"></p>
            </div>
          </div>
          <div id="breakdown" class="breakdown"></div>
          <div id="history" class="history"></div>
        </section>
      </main>
    </div>

    <script>
      const colors = ["red", "blue", "green"];
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
      let rotation = 0;

      function money(value) {
        return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
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
            '<label>Pick <select class="pick"><option value="red">Red</option><option value="blue">Blue</option><option value="green">Green</option></select></label>';
          row.querySelector(".pick").value = colors[index % colors.length];
          playersEl.appendChild(row);
        }
        tableMetaEl.textContent = count + " seated";
        statusEl.textContent = "Table is ready. Pick colors, then spin.";
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
        const target = { red: 60, blue: 180, green: 300 }[color];
        rotation += 1440 + (360 - target);
        wheelEl.style.transform = "rotate(" + rotation + "deg)";
      }

      function renderResult(data) {
        const winnerText = data.winners.length
          ? data.winners.map((winner) => winner.name).join(", ") + " matched " + data.landedColor + "."
          : "Nobody matched, so everyone pays.";
        resultCardEl.innerHTML =
          '<strong style="color:var(--' + data.landedColor + ')">' + data.landedColor + '</strong>' +
          '<p>' + winnerText + ' Total collected: ' + money(data.totalAllocated) + ' of ' + money(data.bill) + '.</p>';

        breakdownEl.innerHTML =
          '<div class="row header"><span>Diner</span><span>Pick</span><span>Status</span><span>Pays</span></div>' +
          data.assignments.map((item) =>
            '<div class="row"><span>' + item.name + '</span><span class="pill ' + item.color + '">' + item.color + '</span><span>' +
            item.status + (item.futureCredits ? " +" + item.futureCredits + " future" : "") +
            '</span><span>' + money(item.pays) + '</span></div>'
          ).join("");

        historyEl.textContent = "Session " + data.id + " • " + data.payers.length + " payer(s), " + data.winners.length + " winner(s).";
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
  if (cleaned.some((player) => !["red", "blue", "green"].includes(player.color))) {
    return { error: "Every diner must pick red, blue, or green." };
  }
  return { bill: roundCurrency(bill), players: cleaned };
}

function settle(body) {
  const valid = validate(body);
  if (valid.error) return valid;

  const landedColor = ["red", "blue", "green"][Math.floor(Math.random() * 3)];
  const winners = valid.players.filter((player) => player.color === landedColor);
  const payers = winners.length === 0
    ? valid.players
    : valid.players.filter((player) => player.color !== landedColor);
  const shares = splitBillExactly(valid.bill, payers.length);
  const payerShares = new Map(payers.map((player, index) => [player.name + index, shares[index]]));
  let payerIndex = 0;

  const assignments = valid.players.map((player) => {
    const won = player.color === landedColor;
    if (won) {
      return {
        ...player,
        pays: 0,
        status: landedColor === "green" ? "green winner" : "winner",
        futureCredits: landedColor === "green" ? 3 : 0,
      };
    }
    const pays = payerShares.get(player.name + payerIndex) ?? shares[payerIndex] ?? 0;
    payerIndex += 1;
    return { ...player, pays, status: "pays", futureCredits: 0 };
  });

  const result = {
    id: crypto.randomUUID().slice(0, 8),
    bill: valid.bill,
    landedColor,
    winners: assignments.filter((item) => item.pays === 0 && item.color === landedColor),
    payers: assignments.filter((item) => item.pays > 0),
    assignments,
    totalAllocated: roundCurrency(assignments.reduce((sum, item) => sum + item.pays, 0)),
    createdAt: new Date().toISOString(),
  };
  sessions.unshift(result);
  sessions.splice(10);
  return result;
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
      return json({ ok: true, service: "dinner-roulette-splitter" });
    }
    if (request.method === "GET" && url.pathname === "/api/sessions") {
      return json({ sessions });
    }
    if (request.method === "POST" && url.pathname === "/api/spin") {
      const result = settle(await readJson(request));
      return result.error ? json(result, { status: 400 }) : json(result);
    }

    return new Response("Not found", { status: 404 });
  },
};
