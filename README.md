# gawk-cli

The [gawk.dev](https://gawk.dev) live AI-ecosystem feed in your terminal.

```bash
npx github:Neelagiri65/gawk-cli            # the curated wire, right now
npx github:Neelagiri65/gawk-cli models     # OpenRouter top-weekly rankings
npx github:Neelagiri65/gawk-cli tools      # tool health, vendor-declared
npx github:Neelagiri65/gawk-cli sdk        # SDK adoption from registry counters
```

Flags: `--limit N` · `--type TOOL_ALERT` · `--json` (raw API response, verbatim) · `--no-color`.

## Trust contract

Same as the dashboard: **every number traces to a public source.** Each card prints its source name, age, and URL. The CLI is a thin client over gawk's public read API — it derives nothing beyond arithmetic on numbers it also shows, and if a source is quiet or down you get honest quiet, never invention.

Zero dependencies. Node ≥ 18. No auth, no tracking (usage is counted server-side as anonymous aggregates only — hashed, never identities).

Installed globally (`npm i -g gawk-cli`), the command is `gawk-cli` — deliberately not `gawk`, which belongs to GNU awk on your system.
