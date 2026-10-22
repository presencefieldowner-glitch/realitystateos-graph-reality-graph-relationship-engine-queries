# 006_REALITY_GRAPH — Status: Implemented (single-node prototype)

The core graph: nodes, edges, temporal/spatial/trust dimensions — backs `rsos graph node/edge create|show` and `rsos query graph "<pattern>"`.

| File | Provides |
|---|---|
| `realityGraph.ts` | `RealityGraph` — typed node/edge creation on Foundation's `TypedEntity`/`Relationship` (EntityModel explicitly names this module as what it's "built directly on"), persisted via `012_STORAGE`'s `GraphStore`. Temporal dimension = `Relationship.validFrom/validTo`; trust dimension = edge weight; spatial dimension = optional `{lat,lng}` node attribute. |
| `queryLanguage.ts` | A real, minimal Cypher-like pattern parser/matcher: `(a:Type)-[:REL]->(b:Type)`, one hop. Not the full graph query language `cli_commands.md` gestures at — multi-hop/filter support is a follow-up on the same shape. |

Depends on `003_FOUNDATION` (CoreTypes, EntityModel) and `012_STORAGE` (GraphStore) via compiled `dist/` imports.

## Known deviations from spec
- Query language is single-hop only; no filters, no aggregation.
- Relationships are soft-invalidated (`endEdge`), never deleted, matching `EntityModel.endRelationship`'s contract — this is why past-time queries still see ended relationships.

Build/test: `npm install && npm test`.
