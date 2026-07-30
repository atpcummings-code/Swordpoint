# Swordpoint Army Builder — PRD

## Problem Statement
Single-page React web app for building Swordpoint: Dark Age wargaming army rosters. Fully client-side — NO backend DB, NO server logic, NO auth (explicit credit-saving constraint).

## Architecture
- 100% client-side React (App.js single core file + App.css).
- Data source: client-side fetch from GitHub raw JSON (dark_ages_armies.json). Graceful fallback to embedded MOCK_DATA if fetch fails or JSON is invalid (the live remote file is currently malformed JSON, so app runs on sample data).
- PDF export via native window.print() with a print-only clean summary stylesheet.

## Core Requirements (static)
- Army dropdown selector (populated by armyName). Switching army fully clears roster + allies + resets calcs.
- Two-column dark dashboard: Left = catalog by category; Right = active roster with sticky Total/Max header.
- Adjustable MaxPointsLimit (default 2000).
- Unit base +/- with strict min/max clamping via disabled buttons.
- Skirmisher rule override: hard-clamp maxBases to 6; auto-drop bases to 6 when triggered via equipment.
- Optional equipment toggles updating pts/base, Defence, Cohesion, and active Special Rules.
- Allied contingents: inline checkboxes per alliedArmyKeys; checking shows non-General allied units; unchecking purges those instances; disable extra checkboxes past maxAlliedArmiesAllowed.
- Roster utilities: Duplicate, Move Up/Down, Remove.
- Validation engine: over-points, >1 General, allied-max, skirmisher base guard, count + percentage category constraints (percentage relative to MaxPointsLimit). Emerald (valid) / Amber (warnings) status badge.
- Client-side PDF export.

## Implemented (2026-07-30)
- All core requirements above built and verified via browser screenshots.
- Verified: add units, live points, equipment toggle stats/rules, General>1 warning, allies checkbox + disabled second faction, allied non-General unit rendering, allied points counting toward allies category, status badge emerald/amber.
- 3 sample factions in fallback data: Early Medieval Welsh, Vikings, Anglo-Danish (cross-referenced as allies).

## Backlog / Future
- P1: If remote JSON gets fixed, verify live-data path renders correctly.
- P2: Save/load rosters to localStorage.
- P2: Search/filter within catalog.
