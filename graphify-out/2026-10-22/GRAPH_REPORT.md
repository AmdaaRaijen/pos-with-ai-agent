# Graph Report - POS  (2026-10-22)

## Corpus Check
- 65 files · ~21,927 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 320 nodes · 728 edges · 19 communities (9 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b5ad3edb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data.ts
- assistant.ts
- telegram/+server.ts
- package.json
- auth.ts
- ref_types
- lib/types.ts
- Inventory.svelte
- src_app
- tsconfig.json
- app.d.ts
- lib/toast.svelte.ts

## God Nodes (most connected - your core abstractions)
1. `db()` - 29 edges
2. `must()` - 28 edges
3. `wibDate()` - 17 edges
4. `getData()` - 15 edges
5. `listProducts()` - 13 edges
6. `@sveltejs/kit` - 13 edges
7. `pengaturan()` - 12 edges
8. `cart` - 11 edges
9. `POST()` - 11 edges
10. `getStoreName()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `bagAdvice` --calls--> `wibDate()`  [EXTRACTED]
  src/lib/server/data.ts → src/lib/money.ts
- `stockAdvice` --calls--> `wibDate()`  [EXTRACTED]
  src/lib/server/data.ts → src/lib/money.ts
- `createUser()` --calls--> `db()`  [EXTRACTED]
  src/lib/server/auth.ts → src/lib/server/db.ts
- `createUser()` --calls--> `must()`  [EXTRACTED]
  src/lib/server/auth.ts → src/lib/server/db.ts
- `createSale()` --calls--> `db()`  [EXTRACTED]
  src/lib/server/data.ts → src/lib/server/db.ts

## Import Cycles
- None detected.

## Communities (19 total, 10 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.16
Nodes (35): addDays(), findUser(), archiveProduct(), bagAdvice, createExpense(), createProduct(), dailyStats(), dayRange() (+27 more)

### Community 1 - "assistant.ts"
Cohesion: 0.08
Nodes (39): atWib(), BULAN, dayLabel(), DEFAULT_EMONEY, emoneyFee(), HARI, isPastOrToday(), rp() (+31 more)

### Community 2 - "telegram/+server.ts"
Cohesion: 0.12
Nodes (28): ref_app, normalizePhone(), aiConfig(), ask(), chat(), Pending, runPending(), Turn (+20 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (40): dependencies, @fontsource-variable/geist, phosphor-svelte, @supabase/supabase-js, devDependencies, svelte, svelte-check, @sveltejs/adapter-auto (+32 more)

### Community 4 - "auth.ts"
Cohesion: 0.15
Nodes (19): ref_node_crypto, handle(), PUBLIC, attempts, COOKIE, createUser(), hashPassword(), loginBlocked() (+11 more)

### Community 5 - "ref_types"
Cohesion: 0.25
Nodes (10): ref_types, getData(), periodOf(), load(), load(), load(), load(), load() (+2 more)

### Community 6 - "lib/types.ts"
Cohesion: 0.08
Nodes (18): @sveltejs/kit, optional, variables, cart, CartItem, EmoneyConfig, createSale(), CartLine (+10 more)

### Community 8 - "Inventory.svelte"
Cohesion: 0.06
Nodes (18): addCustom(), emoneyItems, goods, multi, percent, siblings, taken, toggle() (+10 more)

### Community 16 - "tsconfig.json"
Cohesion: 0.33
Nodes (5): $app/tsconfig, compilerOptions, strict, extends, include

## Knowledge Gaps
- **85 isolated node(s):** `ProductInput`, `SaleItem`, `Args`, `AskResult`, `ChatMessage` (+80 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 122 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CartLine` connect `lib/types.ts` to `data.ts`, `assistant.ts`?**
  _High betweenness centrality (0.279) - this node is a cross-community bridge._
- **Why does `@sveltejs/kit` connect `lib/types.ts` to `data.ts`, `telegram/+server.ts`, `package.json`, `auth.ts`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **What connects `ProductInput`, `SaleItem`, `Args` to the rest of the system?**
  _85 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `assistant.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07862679955703211 - nodes in this community are weakly interconnected._
- **Should `telegram/+server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12310606060606061 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04994192799070848 - nodes in this community are weakly interconnected._
- **Should `lib/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07957957957957958 - nodes in this community are weakly interconnected._