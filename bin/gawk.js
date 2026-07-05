#!/usr/bin/env node
// gawk — the gawk.dev live AI-ecosystem feed in your terminal.
// Thin client over the public read API. No auth, no tracking, no new
// logic: the CLI shows what gawk.dev serves, sources attached.

import {
  formatFeedCard, formatModelRow, formatSdkRow, formatToolRow, paint,
} from "../lib/format.js";

const BASE = process.env.GAWK_BASE_URL || "https://gawk.dev";
const args = process.argv.slice(2);
const cmd = args.find((a) => !a.startsWith("-")) ?? "wire";
const flag = (name) => args.includes(name);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};
const useColor = !flag("--no-color") && !process.env.NO_COLOR && process.stdout.isTTY;
const p = paint(useColor);

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { "user-agent": "gawk-cli" } });
  if (!res.ok) throw new Error(`gawk.dev ${path} responded ${res.status}`);
  return res.json();
}

function footer(asOf) {
  const when = asOf ? ` · as of ${asOf}` : "";
  console.log(p("dim", `\nevery number traces to its source${when} · gawk.dev`));
}

const commands = {
  async wire() {
    const feed = await get("/api/feed");
    if (flag("--json")) return console.log(JSON.stringify(feed, null, 2));
    const limit = Number(opt("--limit", "12"));
    const type = opt("--type", null);
    let cards = feed.cards ?? [];
    if (type) cards = cards.filter((c) => c.type === type.toUpperCase());
    if (cards.length === 0) return console.log(p("dim", "quiet — no cards right now (honest quiet, not an error)"));
    for (const card of cards.slice(0, limit)) console.log(formatFeedCard(card, { useColor }) + "\n");
    if (cards.length > limit) console.log(p("dim", `… ${cards.length - limit} more (--limit ${cards.length})`));
    footer(feed.generatedAt);
  },
  async models() {
    const m = await get("/api/v1/models");
    if (flag("--json")) return console.log(JSON.stringify(m, null, 2));
    const limit = Number(opt("--limit", "10"));
    console.log(p("bold", `OpenRouter rankings (${m.ordering})\n`));
    for (const row of (m.rows ?? []).slice(0, limit)) console.log(formatModelRow(row, { useColor }));
    footer(m.generatedAt);
  },
  async tools() {
    const s = await get("/api/v1/status");
    if (flag("--json")) return console.log(JSON.stringify(s, null, 2));
    console.log(p("bold", "Tool health — declared status, as each vendor reports it\n"));
    for (const [id, tool] of Object.entries(s.data ?? {})) console.log(formatToolRow(id, tool, { useColor }));
    footer();
  },
  async sdk() {
    const s = await get("/api/v1/sdk");
    if (flag("--json")) return console.log(JSON.stringify(s, null, 2));
    console.log(p("bold", "SDK adoption — registry download counters\n"));
    for (const pkg of s.packages ?? []) console.log(formatSdkRow(pkg, { useColor }));
    footer();
  },
  help() {
    console.log(`gawk — the live AI-ecosystem feed in your terminal

usage: gawk [command] [flags]

commands
  wire      curated feed cards (default)
  models    OpenRouter top-weekly rankings
  tools     tool health, vendor-declared
  sdk       SDK adoption from registry counters

flags
  --limit N     max items (wire: 12, models: 10)
  --type TYPE   filter wire by card type (e.g. TOOL_ALERT, NEWS)
  --json        raw API response, verbatim
  --no-color    plain output (NO_COLOR env also respected)

every number traces to its source · https://gawk.dev`);
  },
};

const run = commands[cmd] ?? commands.help;
run().catch((e) => {
  console.error(`gawk: ${e.message} (nothing shown is better than something invented)`);
  process.exit(1);
});
