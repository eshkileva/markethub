# Leaf-scoped catalogs Implementation Plan

> Inline execution. Spec: `docs/superpowers/specs/2026-08-25-leaf-catalogs-design.md`. Do not commit unless asked.

**Goal:** Dictionaries keyed by leaf slug (`cars`, `moto`, …).

**Architecture:** `catalog_brands.kind` becomes the leaf slug. Remap `auto`/`phone`, drop mixed `computer`, seed split fallbacks.

## Global Constraints

- Do not copy cars.json into moto
- Electronics/appliances stay enums
- Do not commit unless asked

### Task 1: Shared kinds + parseKind TDD
### Task 2: Seed sources + service seed by leaf
### Task 3: Attribute dictionary slugs + migrate SQL + db:seed
### Task 4: Tests, typecheck, curl cars vs moto
