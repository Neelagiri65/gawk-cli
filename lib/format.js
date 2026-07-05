// Pure formatters — no I/O, tested with node --test.
// Trust contract carried to the terminal: every line shows its source,
// nothing is derived beyond arithmetic on numbers that are themselves shown.

const C = {
  reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m",
  cyan: "\x1b[36m", yellow: "\x1b[33m", red: "\x1b[31m", green: "\x1b[32m",
};

export function paint(useColor) {
  return (code, s) => (useColor ? `${C[code]}${s}${C.reset}` : s);
}

export function timeAgo(iso, nowMs) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const m = Math.max(0, Math.round((nowMs - t) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function severityCode(sev) {
  if (sev >= 90) return "red";
  if (sev >= 50) return "yellow";
  return "cyan";
}

export function formatFeedCard(card, { useColor = false, nowMs = Date.now() } = {}) {
  const p = paint(useColor);
  const tag = p(severityCode(card.severity ?? 0), `[${card.type}]`);
  const src = [card.sourceName, timeAgo(card.timestamp, nowMs), card.sourceUrl]
    .filter(Boolean).join(" · ");
  const detail = card.detail && card.detail !== card.headline ? `${card.detail}\n  ` : "";
  return `${tag} ${p("bold", card.headline)}\n  ${detail}${p("dim", src)}`;
}

export function rankDelta(row) {
  if (row.previousRank == null || row.previousRank === row.rank) return "→";
  const d = row.previousRank - row.rank;
  return d > 0 ? `↑${d}` : `↓${-d}`;
}

export function formatModelRow(row, { useColor = false } = {}) {
  const p = paint(useColor);
  const delta = rankDelta(row);
  const deltaP = delta.startsWith("↑") ? p("green", delta) : delta.startsWith("↓") ? p("red", delta) : p("dim", delta);
  const price = row.pricing?.promptPerMTok != null ? `$${row.pricing.promptPerMTok}/MTok` : "";
  return `#${String(row.rank).padEnd(3)} ${deltaP.padEnd(useColor ? 14 : 3)} ${(row.shortName ?? row.name ?? row.slug).padEnd(28)} ${p("dim", price)}`;
}

export function formatToolRow(id, tool, { useColor = false } = {}) {
  const p = paint(useColor);
  const declared = tool.status ?? "unknown";
  const mark = declared === "operational" ? p("green", "●") : declared === "unknown" ? p("dim", "●") : p("yellow", "●");
  const incidents = (tool.activeIncidents ?? []).length;
  const inc = incidents ? ` · ${incidents} active incident${incidents > 1 ? "s" : ""} (as vendor reports)` : "";
  return `${mark} ${id.padEnd(14)} ${declared}${inc}`;
}

export function sdkSeries(pkg) {
  const days = pkg.days ?? [];
  const first = days.find((d) => d?.count != null);
  const latest = pkg.latest?.count ?? null;
  if (!first || latest == null || first.count === 0) return null;
  const pct = ((latest - first.count) / first.count) * 100;
  return { from: first.count, fromDate: first.date, to: latest, pct };
}

export function formatSdkRow(pkg, { useColor = false } = {}) {
  const p = paint(useColor);
  const s = sdkSeries(pkg);
  const name = `${pkg.label ?? pkg.id} (${pkg.registry})`.padEnd(30);
  if (!s) return `${name} ${p("dim", "no series data")}`;
  const arrow = s.pct > 0 ? p("green", `+${s.pct.toFixed(0)}%`) : s.pct < 0 ? p("red", `${s.pct.toFixed(0)}%`) : "0%";
  return `${name} ${s.from.toLocaleString("en-GB")} → ${s.to.toLocaleString("en-GB")}/day  ${arrow} ${p("dim", `since ${s.fromDate}`)}`;
}
