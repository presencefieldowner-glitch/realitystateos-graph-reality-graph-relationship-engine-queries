# Reality Graph: relationships and queries

The reality graph: nodes, edges, temporal, spatial and trust dimensions, and its query language.

## What is in this repository

- `006_REALITY_GRAPH/`

## Where it comes from

Extracted from the RealityStateOS monorepo (commit `6ad4100`) with each module kept at its original path. Each module folder has its own `README.md` stating what is real and what is documented as not yet built, and its own `package.json` (or Python tests for LakeTiticaca).

## Dependencies on other modules

These modules import siblings by relative path from the monorepo layout, so this repository does not build on its own. It needs the following folders from the monorepo placed alongside:

- `003_FOUNDATION/CoreTypes/`
- `003_FOUNDATION/EntityModel/`
- `012_STORAGE/dist/`

This extraction has not been built or tested on its own in this layout; the module test results quoted in each module README were produced inside the monorepo.

## License

Proprietary. Copyright (c) 2026 Joseph Michael Rounsaville. All rights reserved. See `LICENSE.md` and `OWNERSHIP.md`. Being publicly viewable does not grant any license to use, copy, modify or distribute this code.
