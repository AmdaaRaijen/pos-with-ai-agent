# Graph Report - POS  (2026-10-24)

## Corpus Check
- 66 files · ~22,842 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 375 nodes · 837 edges · 27 communities (14 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2eb4f809`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data.ts
- assistant.ts
- telegram/+server.ts
- package.json
- auth.ts
- ref_types
- Kasir
- i
- Keuangan.svelte
- Transaksi.svelte
- lib/money.ts
- Inventory.svelte
- CLAUDE.md
- tsconfig.json
- Rekap.svelte
- app.d.ts
- #lib/money.ts
- Detail.svelte
- lib/toast.svelte.ts
- $app/forms

## God Nodes (most connected - your core abstractions)
1. `db()` - 29 edges
2. `must()` - 28 edges
3. `wibDate()` - 19 edges
4. `getData()` - 15 edges
5. `@sveltejs/kit` - 13 edges
6. `listProducts()` - 13 edges
7. `keuangan()` - 13 edges
8. `pengaturan()` - 13 edges
9. `cart` - 11 edges
10. `addDays()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Catatan teknis` --references--> `hashPassword()`  [INFERRED]
  README.md → src/lib/server/auth.ts
- `range()` --calls--> `wibDate()`  [EXTRACTED]
  src/lib/server/assistant.ts → src/lib/money.ts
- `load()` --calls--> `getData()`  [EXTRACTED]
  src/routes/inventory/+page.ts → src/lib/api.ts
- `load()` --calls--> `getData()`  [EXTRACTED]
  src/routes/keuangan/+page.ts → src/lib/api.ts
- `load()` --calls--> `getData()`  [EXTRACTED]
  src/routes/+page.ts → src/lib/api.ts

## Import Cycles
- None detected.

## Communities (27 total, 13 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.11
Nodes (49): addDays(), currentSessionDate(), isPastOrToday(), isSingle(), periodOf(), sessionRange(), wibDate(), recapDate() (+41 more)

### Community 1 - "assistant.ts"
Cohesion: 0.09
Nodes (30): rp(), timeLabel(), Args, AskResult, buildPatch(), ChatMessage, DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL (+22 more)

### Community 2 - "telegram/+server.ts"
Cohesion: 0.13
Nodes (26): ref_app, normalizePhone(), aiConfig(), ask(), chat(), runPending(), systemPrompt(), getWhitelist() (+18 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, @fontsource-variable/geist, phosphor-svelte, @supabase/supabase-js, devDependencies, svelte, svelte-check, @sveltejs/adapter-auto (+35 more)

### Community 4 - "auth.ts"
Cohesion: 0.16
Nodes (19): ref_node_crypto, handle(), PUBLIC, attempts, COOKIE, createUser(), findUser(), hashPassword() (+11 more)

### Community 5 - "ref_types"
Cohesion: 0.21
Nodes (10): ref_types, getData(), inventory(), load(), load(), load(), load(), load() (+2 more)

### Community 6 - "Kasir"
Cohesion: 0.20
Nodes (9): Asisten Telegram, Aturan saldo e-money, Barang pendukung dan pengeluaran, Catatan teknis, Isi `.env`, Kasir, Menjalankan, Persetujuan sebelum data berubah (+1 more)

### Community 8 - "i"
Cohesion: 0.14
Nodes (9): src_app, ./$types, ./$types, ./$types, ./$types, ./$types, ./$types, i() (+1 more)

### Community 11 - "Transaksi.svelte"
Cohesion: 0.25
Nodes (3): addEmoney(), tap(), tapTile()

### Community 12 - "lib/money.ts"
Cohesion: 0.08
Nodes (21): cart, CartItem, atWib(), BULAN, dayLabel(), DEFAULT_EMONEY, DEFAULT_SESSION, EmoneyConfig (+13 more)

### Community 14 - "Inventory.svelte"
Cohesion: 0.15
Nodes (8): addCustom(), emoneyItems, goods, multi, percent, siblings, taken, toggle()

### Community 16 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): $app/tsconfig, compilerOptions, strict, extends, include

### Community 17 - "Rekap.svelte"
Cohesion: 0.40
Nodes (3): rp(), total, valid

### Community 20 - "Detail.svelte"
Cohesion: 0.20
Nodes (3): rp(), total, when

## Knowledge Gaps
- **93 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+88 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 142 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CartLine` connect `lib/money.ts` to `data.ts`, `assistant.ts`?**
  _High betweenness centrality (0.354) - this node is a cross-community bridge._
- **Why does `@sveltejs/kit` connect `package.json` to `data.ts`, `telegram/+server.ts`, `auth.ts`, `ref_types`, `lib/money.ts`?**
  _High betweenness centrality (0.209) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _93 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11493506493506493 - nodes in this community are weakly interconnected._
- **Should `assistant.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08669354838709678 - nodes in this community are weakly interconnected._
- **Should `telegram/+server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13306451612903225 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0463768115942029 - nodes in this community are weakly interconnected._