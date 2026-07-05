import test from "node:test";
import assert from "node:assert/strict";
import {
  formatFeedCard, formatModelRow, formatSdkRow, formatToolRow,
  rankDelta, sdkSeries, severityCode, timeAgo,
} from "../lib/format.js";

const NOW = Date.parse("2026-07-05T20:00:00Z");

test("timeAgo buckets minutes/hours/days", () => {
  assert.equal(timeAgo("2026-07-05T19:41:00Z", NOW), "19m ago");
  assert.equal(timeAgo("2026-07-05T08:00:00Z", NOW), "12h ago");
  assert.equal(timeAgo("2026-07-01T20:00:00Z", NOW), "4d ago");
  assert.equal(timeAgo("garbage", NOW), "");
});

test("severity maps to colour tiers", () => {
  assert.equal(severityCode(100), "red");
  assert.equal(severityCode(50), "yellow");
  assert.equal(severityCode(10), "cyan");
});

test("feed card carries headline, source name, url and age — the trust line", () => {
  const out = formatFeedCard({
    type: "TOOL_ALERT", severity: 100,
    headline: "OpenAI API is reporting degraded performance",
    detail: "Upstream status page reports degraded.",
    sourceName: "OpenAI Status (summary)", sourceUrl: "https://status.openai.com",
    timestamp: "2026-07-05T19:40:00Z",
  }, { useColor: false, nowMs: NOW });
  assert.match(out, /\[TOOL_ALERT\] OpenAI API is reporting degraded performance/);
  assert.match(out, /OpenAI Status \(summary\) · 20m ago · https:\/\/status\.openai\.com/);
});

test("rank delta: steady, up, down", () => {
  assert.equal(rankDelta({ rank: 1, previousRank: 1 }), "→");
  assert.equal(rankDelta({ rank: 19, previousRank: 24 }), "↑5");
  assert.equal(rankDelta({ rank: 24, previousRank: 19 }), "↓5");
  assert.equal(rankDelta({ rank: 3 }), "→");
});

test("model row shows rank, name, price per MTok", () => {
  const out = formatModelRow({ rank: 1, previousRank: 1, shortName: "DeepSeek V4 Flash", pricing: { promptPerMTok: 0.28 } });
  assert.match(out, /#1 {2}.*DeepSeek V4 Flash.*\$0\.28\/MTok/);
});

test("tool row shows declared status verbatim and discloses active incidents as vendor-reported", () => {
  assert.match(formatToolRow("claude-code", { status: "operational", activeIncidents: [] }), /claude-code\s+operational$/);
  assert.match(formatToolRow("openai-api", { status: "degraded", activeIncidents: [{}, {}] }), /degraded · 2 active incidents \(as vendor reports\)/);
});

test("sdk series: pct derived only from two shown endpoints; no data → honest label", () => {
  const s = sdkSeries({ latest: { count: 3834172 }, days: [{ date: "2026-06-06", count: 5198910 }] });
  assert.equal(s.from, 5198910);
  assert.equal(s.to, 3834172);
  assert.equal(Math.round(s.pct), -26);
  assert.match(formatSdkRow({ id: "x", registry: "npm", days: [], latest: {} }), /no series data/);
});
