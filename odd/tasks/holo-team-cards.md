# Holo Team Cards (Three.js)

Objective: Replace `/equipo` cyber CSS cards with interactive Three.js holographic 3D Pokemon cards; raise code quality and interaction polish.
Branch: `feature/holo-team-cards`
Delivery: ask-on-risk
Test runner: `npm test` / focused component tests when available; `ng build` as structural check

## Specs

- S1: "utilizar la librería threejs para mejorar el apartado de /equipo cuando salga la figura del pokemon que pueda ser una carta holo y en 3D"
- S2: "mejora la calidad de codigo y la interaccion"
- S3 (assumption): Prefer official artwork URL when available for the card face; fall back to `front_default`.
- S4 (assumption): Pointer/tilt interaction + subtle auto-idle; respect `prefers-reduced-motion` with a static/foil-light fallback.
- S5 (assumption): Backend may expose `card_presentation` / artwork fields; frontend must keep working if only `pokemon_sprite` exists.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S1,S3,S4,S5 | delegated frontend-lead | done | `HoloPokemonCardComponent` + `HoloCardScene`; `ng build` OK (lazy `three-module` chunk); team.html trackers removed; artwork resolver + optional `card_presentation` |
| T2 | S2 | delegated frontend-lead | done | Typed `TeamPokemonItem`; `takeUntilDestroyed`; disable double-add; keyboard suggestions; split presentation out of `team.ts` |
| T3 | S5 | delegated backend-lead | done | Backend `card_presentation` + FE seam: POST `/team` sends `pokemon_artwork` |

## Log

- L1: Con los agentes backend-lead y frontend-lead vas a utilizar la librería threejs para mejorar el apartado de /equipo cuando salga la figura del pokemon que pueda ser una carta holo y en 3D, por otro lado mejora la calidad de codigo y la interaccion. Repos: backend_pokemonapp + pokemon-app.
- L2: 2026-11-21 — Frontend T1/T2 implemented on `feature/holo-team-cards`. Deps: `three@^0.187.0`, `@types/three@^0.187.0`. Build: `npx ng build` success; Three.js emitted as lazy chunk `three-module`. Impeccable: PRODUCT.md missing — narrow craft-floor refinement of /equipo cards only (gold/teal foil, not purple mush). Judgment: SKIPPED (nested frontend-lead; inline checklist).
- L3: 2026-11-21 — Seam fix: `team.service.ts` now posts `pokemon_artwork` (official artwork) so backend persists and returns `card_presentation.artwork_url`. Parent spot-check: backend `pytest tests/test_holo_card_presentation.py -q` → 4 passed.
