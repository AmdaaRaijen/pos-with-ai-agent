# Graph Report - POS  (2026-10-24)

## Corpus Check
- 66 files · ~23,028 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 378 nodes · 849 edges · 25 communities (13 shown, 12 thin omitted)
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
- ref_types
- Kasir
- i
- Keuangan.svelte
- lib/components/PeriodFilter.svelte
- Transaksi.svelte
- lib/types.ts
- Riwayat.svelte
- Inventory.svelte
- CLAUDE.md
- tsconfig.json
- app.d.ts
- Rekap.svelte
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
8. `riwayat()` - 13 edges
9. `pengaturan()` - 13 edges
10. `addDays()` - 12 edges

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

## Communities (25 total, 12 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.11
Nodes (53): addDays(), BULAN, currentSessionDate(), DEFAULT_EMONEY, DEFAULT_SESSION, HARI, isPastOrToday(), isSingle() (+45 more)

### Community 1 - "assistant.ts"
Cohesion: 0.08
Nodes (36): dayLabel(), rp(), timeLabel(), aiConfig(), Args, ask(), AskResult, buildPatch() (+28 more)

### Community 2 - "telegram/+server.ts"
Cohesion: 0.08
Nodes (43): ref_app, ref_node_crypto, @supabase/supabase-js, handle(), PUBLIC, normalizePhone(), Pending, Turn (+35 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (39): dependencies, @fontsource-variable/geist, phosphor-svelte, @supabase/supabase-js, devDependencies, svelte, svelte-check, @sveltejs/adapter-auto (+31 more)

### Community 5 - "ref_types"
Cohesion: 0.25
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

### Community 12 - "lib/types.ts"
Cohesion: 0.08
Nodes (18): @sveltejs/kit, optional, variables, cart, CartItem, atWib(), EmoneyConfig, emoneyFee() (+10 more)

### Community 14 - "Inventory.svelte"
Cohesion: 0.15
Nodes (8): addCustom(), emoneyItems, goods, multi, percent, siblings, taken, toggle()

### Community 16 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): $app/tsconfig, compilerOptions, strict, extends, include

### Community 19 - "Rekap.svelte"
Cohesion: 0.20
Nodes (3): rp(), total, valid

### Community 20 - "Detail.svelte"
Cohesion: 0.20
Nodes (3): rp(), total, when

## Knowledge Gaps
- **95 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 144 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CartLine` connect `lib/types.ts` to `data.ts`, `assistant.ts`?**
  _High betweenness centrality (0.356) - this node is a cross-community bridge._
- **Why does `@sveltejs/kit` connect `lib/types.ts` to `data.ts`, `telegram/+server.ts`, `package.json`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11073446327683616 - nodes in this community are weakly interconnected._
- **Should `assistant.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08097165991902834 - nodes in this community are weakly interconnected._
- **Should `telegram/+server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07918552036199095 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05121951219512195 - nodes in this community are weakly interconnected._