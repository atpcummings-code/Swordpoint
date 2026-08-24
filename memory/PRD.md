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

## Implemented (2026-06 session)
Advanced rule engine + UI polish (all in App.js, verified via logic unit tests):
- `maxEquipmentCount` for optionalEquipment (shared cap across units of a type).
- `enabledWhenUnitsPresent` (fixed threshold + ratio/perUnit modes) — locks equipment based on referenced unit counts.
- Category `constraintType: "pointsRatio"` — max units = round(maxPoints/pointsThreshold × countPerThreshold), min 1; also hard-blocks the +Add button when the category is full.
- `requires` rule `self` field — army-wide min-count warning for a unit's own id.
- Army-level `unitCountValidation` array (`ids` vs `compareWith`, optional `ratio`, default expr lessThanOrEqual) — count-based warnings.
- Allied `disables` field — selecting an ally disables listed armies across all categories (reversible).
- `armyValidation` bugfix: now reads `id` OR `unitId` (real JSON uses `id`) so bases-ratio rules fire.
- UI: dropdowns moved to header-left; emerald Roster Summary box moved into header-right (fixed w-[520px]); header z-50 + solid bg; column headings restyled (rounded border, transparent outer wrapper, solid inner box, page-bg); scrollbar-gutter + pr-3 on both columns; pronounced catalog hover (emerald border/glow, no shift, no bg change); unit-name font Barlow; category/Army-Composition headings 1.25rem; constraints table header 0.9rem Barlow; brighter unit description (slate-300).
- Both Supplement + Army dropdowns converted to Radix shadcn Select with max-h-[66vh] scrollable menu.

## Implemented (2026-06 session, continued)
Rule-engine + structure additions (App.js, verified via node logic tests):
- `requires.unitId` now accepts an array (combined total of listed ids) for both fixed and ratio modes.
- Army-level `pointsPercentageValidation` (combined unit points vs % of maxPoints, any expression).
- `unitCountValidation` now supports a fixed `count` comparison (falls back to compareWith/ratio when absent).
- Allied `disables` fixed to work across categories via per-category selection state (`checkedAllies` now stores "categoryId::armyKey" composites); handles the pecheneg/magyar cross-category self-disable pattern in real data.
- Unit `excludes` field — mutual exclusion: blocks excluded ids in catalog (and reverse), per-unit warning when both present.
- `armyValidation` left side now accepts `ids` array (combined bases) in addition to single `id`/`unitId`.
- Save/Load Army: JSON download (prompt for name) + import restoring supplement (async loadData restore path), army, roster, allies, maxPoints. Save/Load/Export PDF buttons in left header box.
- Unit `subProfiles` array: each has name + A/C/D/Coh stats (flexible key spellings) + baseEquipment + specialRules; renders as distinct rows in the unit box + PDF (replaces the main stat row). `optionalEquipment.targetProfile` routes an option's stat/rule/equipment changes to the matching sub-profile row while its points still count to the unit total; untargeted options apply to all profiles.
- Header layout overhaul: left stack (Save/Load/Export box + dropdowns) and right Roster Summary box are equal-height (items-stretch); MAX POINTS LIMIT and TOTAL/LIMIT centered over their content; fixed header height; solid column heading boxes flush to top.

## Implemented (2026-06 session, sub-profile layout)
- Sub-profile rows now share an identical fixed-width column grid with the main unit header: `[PTS/BASE] [PTS/OPTIONS] [TOTAL] [D or A] [C] [PTS/UNIT]` (68px columns, right-anchored so columns vertically align). `Stat` gained a `w` prop for the fixed width.
- Per-sub-profile points: each row shows its own PTS/BASE (`sp.pointsPerBase`, else falls back to the unit's pts/base), PTS/OPTIONS (sum of options applying to that profile), TOTAL (base+options per base), and PTS/UNIT (total × bases) — per user's confirmed choices.
- Main header keeps D/C blank for sub-profile units and shows cumulative points. When sub-profiles carry their OWN `pointsPerBase` (stacked components, e.g. elephant+mahout+crew) the unit's cumulative pts/base = SUM of profile pts/base; otherwise (alternative stat-lines falling back to unit pts) it stays the unit-level figure. `computeUnit` now returns `ppbBase/ppbOptions/ppbTotal` and `total` derives from `ppbTotal`.
- Schema tolerance: `readSubProfile` reads stats from a nested `stats: {}` object (remote schema) as well as flat keys; new `readOption` normalizes optional-equipment so both flat (`pointsModifier`, `defenceModifier`) and nested (`pointsPerBase`, `statChanges: {defence}`) schemas work. Applied via `makeInstance`.
- PrintSummary/PDF updated to use cumulative points and list per-profile PTS/BASE/OPTIONS/TOTAL/Points.
- Verified end-to-end on live remote data: Genghis Khan → Early Thematic Byzantine → "War ElephantX" (Elephant 20 / Mahout 5 / Crew 2 → header 27; toggling Howdah → Crew updates Pts/Options 4, D 5→3, header total 31). Column alignment exact.

## Implemented (2026-06 session, applyToAllUnits)
- New `optionalEquipment.applyToAllUnits` flag. When an option with this flag is toggled on/off on any unit, `toggleEquipment` forces the same equipped state across every roster instance of the same `unitId` that offers the option — points and stat changes update roster-wide simultaneously (bidirectional: select syncs on, deselect syncs off). Per-unit disables / hidden-pruning / skirmisher clamps still applied to each affected instance. Preserved through `readOption` (spread). Demo flag added to Welsh "Teulu Foot → Throwing Spears" in MOCK_DATA.
- Verified via UI automation: two Teulu Foot units → enabling on one checks both (90→102 pts), disabling on the other unchecks both (→90 pts).

## Implemented (2026-06 session, allied unit filters)
- `alliedArmyKeys` entries (object form) now support `onlyUnits` and `excludesUnits` arrays. `normalizeData` captures them into `cat._allyUnitFilter[key]`; the catalog disables (greys out, blocks Add) the affected allied units the moment the ally is selected. `onlyUnits` takes precedence over `excludesUnits`; neither present → all units available. Demo seeded on Welsh allies: Vikings `onlyUnits: [viking_hirdmen, viking_bondi]`, Anglo-Danish `excludesUnits: [ad_slingers]`.
- Verified via UI automation: Vikings → only Hirdmen/Bondi enabled (Hersir/Bowmen disabled); Anglo-Danish → only Slingers disabled.

## Implemented (2026-06 session, catalog pts/base for sub-profiles)
- Catalog `CatalogUnit` now shows the summed sub-profile `pointsPerBase` for units that have sub-profiles carrying their own points (mirrors the roster header's cumulative base); units without sub-profiles (or whose sub-profiles have no own points) keep the top-level `pointsPerBase`. Computed at render time via `readSubProfile`.
- Verified live: Genghis Khan → Ghaznavid → "Elephant" catalog card shows 60 pts/base (60+0+0); other units unchanged.

## Implemented (2026-06 session, maxCountAllowed enforcement)
- `maxCountAllowed` now disables a unit's catalog +Add button once its roster count reaches the cap (added to `blockedAddIds` for both home and allied unit defs). The existing army-level validation warning still fires when the cap is exceeded via duplication/other roster changes.
- Verified live: Teulu Cavalry (max 2) and Over King (max 1) Add buttons grey out at the cap; duplicating a 3rd Teulu Cavalry shows "…maximum of 2 is allowed" and flips the status badge to Warnings.

## Implemented (2026-06 session, maxCountAllowed points scaling)
- `effectiveMaxCount(base, maxPoints)` scales a unit's cap: base ≥ 2 gains +1 for every full or partial 1000 pts above the first 1000 (1001–2000 → +1, 2001–3000 → +2, …); base of 1 (or null) never scales. Applied to both the catalog +Add gating (`blockedAddIds`) and the army-level over-limit validation warning; both react to the MAX POINTS LIMIT field.
- Verified live: at 2000 pts Teulu Cavalry (base 2) caps at 3 while Over King (base 1) stays 1; at 2001 the cap rises to 4; dropping back to 1000 re-disables Add and shows the "maximum of 2" warning.

## Implemented (2026-06 session, catalog limit badges)
- Catalog `CatalogUnit` shows a dynamic limit badge right after the unit name: `(Max: X of Y)` where X = current roster count and Y = points-scaled `effectiveMaxCount`; or `(Min: Y+)` for min-only units; nothing when neither is set (max takes priority when both exist). Styled `font-cond text-sm text-slate-400` (slightly smaller than the name, same colour as the bottom stats). Updates in real time via `rosterCounts` + `maxPoints` props threaded through `CatalogCategory`.
- Verified live: Teulu Cavalry `(Max: 0 of 2)` → `(Max: 1 of 2)` on add → `(Max: 1 of 3)` at 2000 pts; Over King `(Max: 0 of 1)`.

## Implemented (2026-06 session, Commanders category scaling)
- `effectiveCatMax(cat, maxPoints)`: the "Commanders" count category gets +50% to its base max (rounded to nearest whole) when the army points limit is 2001–3000; unchanged otherwise and for other categories. Applied to the catalog category header, the top Army-Composition constraints table, the over-max validation warning, and the category validation report — all reactive to MAX POINTS LIMIT.
- Verified live: Welsh Commanders 1–8 → 1–12 at 2500 pts (8×1.5), back to 1–8 at 3001.

## Implemented (2026-06 session, unitPoolRatio)
- Army-level `unitPoolRatio: [{ sourceIds, targetIds, ratio }]`. Target units unlock at `floor(total source count / ratio)`. When no slots remain (targetCount ≥ allowed) every target unit's catalog +Add is disabled (`blockedAddIds`); exceeding the allowance surfaces a critical army-validation warning ("… exceeds the N slot(s) unlocked by … at a R:1 ratio"). Field names flexible (sourceIds/sources/source, targetIds/targets/target). Demo seeded on Welsh: Teulu Cavalry+Foot unlock Skirmishers 1:1.
- Verified live: Skirmishers Add disabled at 0 source, enabled after +1 Teulu, disabled once the slot is used; duplicating to 2 Skirmishers with 1 Teulu produced the exceed warning.

## Implemented (2026-06 session, requires gates catalog Add)
- A unit's `requires` rule now also disables its catalog +Add while unmet (added to `blockedAddIds`). Fixed mode: blocked until the roster holds ≥ `count` of the required id(s). Ratio (`perUnit`) mode: blocked unless adding one more stays within `floor(have / count)`. `self` requirements never block (army-wide min only). Uses `normalizeRequires` on the raw unit def.
- Verified live: Teulu Cavalry (requires 1× Over King) Add disabled until Over King present; Skirmishers (1 per 2 Teulu) disabled at 0–1 Teulu, enabled at 2; Tenants Spearmen (self-requires) not blocked. (Note: Teulu Cavalry also `excludes` Skirmishers, so a foot+cavalry mix disables Skirmishers via the exclusion rule — expected.)

## Implemented (2026-06 session, requirement hints)
- Disabled catalog units now show a small amber hint (with warning icon) beneath the description explaining the unmet `requires`: fixed → "Needs N× Name in the roster first (have H)"; ratio → "Needs N× Name for each <Unit> (have H)". Also set as a hover `title` tooltip on the card. Computed in a `requireHints` memo and threaded through `CatalogCategory`; disappears the instant the requirement is satisfied.
- Verified live: Teulu Cavalry shows "Needs 1× Over King …" and clears after an Over King is added; Skirmishers shows "Needs 2× Teulu (Foot or Cavalry) …".

## Implemented (2026-06 session, sub-unit base counts)
- Sub-profiles can now define `minBases`/`maxBases` (and optional `maxPercentage`), turning a unit into "sub-unit bases" mode. In this mode: the main unit row drops its −/+ (display-only base count = sum of sub-unit bases, with a "Bases X–Y" range = sum of sub mins–maxes); each sub-unit gets its own −/+ on its stats row (title moved to its own row above), clamped to its own min/max; the unit's Pts/Unit is the sum of each sub-unit's (per-base total × its bases). `computeUnit` returns `hasSubBases/mainBases/subDispMin/subDispMax` and per-profile `bases`. New `changeSubBases` handler enforces min/max + the percentage cap (disables + when adding would breach). `subBases` persists via Save/Load. Fallback: sub-profile units without min/max keep the main −/+ unchanged (title still moves to its own row).
- Demo seeded on Welsh Teulu Foot: Warriors 2–10, Champion 1–2 (maxPercentage 34) → main "Bases 3–12".
- Verified live: main shows summed bases + range (no −/+); Warriors/Champion −/+ respect min/max; Champion + blocked at 34% cap until Warriors grow, then blocked again at its maxBases 2; per-sub-unit and unit totals recompute correctly.

## Implemented (2026-06 session, combined sub-unit base clamp)
- The main unit's `minBases`/`maxBases` now clamp the SUM of all sub-unit bases (in addition to each sub-unit's own min/max and any maxPercentage). `makeInstance` stores `combinedMin`/`combinedMax` (unit min/max if defined, else the sum of sub-unit limits); `computeUnit` exposes them via `subDispMin`/`subDispMax` and the "Bases X–Y" display. A sub-unit's + is disabled when the combined total would exceed `combinedMax`; its − is disabled when the combined total would drop below `combinedMin`. `changeSubBases` enforces the same. All constraints apply simultaneously.
- Verified live (Welsh Teulu Foot: unit 3–8, Warriors 2–10, Champion 1–2 @34%): + halts at combined 8 even with individual room left; − halts at combined 3; per-sub min/max/% still respected.

## Implemented (2026-06 session, dash out main pts for sub-unit units)
- When any sub-unit defines min/max bases (`hasSubBases`), the main unit row's PTS/BASE, PTS/OPTIONS and TOTAL now render "–" instead of computed values (PTS/UNIT still shows the cumulative sum); sub-unit rows keep their own calculated values. Units without sub-unit min/max are unchanged. Applied to both the roster UI and the PDF export.
- Verified live: Teulu Foot shows –/–/– with PTS/UNIT 45; Over King & Teulu Cavalry compute normally.

## Implemented (2026-06 session, onBaseAdded sub-unit trigger)
- New sub-profile field `onBaseAdded: { trigger:"oneOrMore", apply:[{ type:"specialRule"|"equipment", name, target:"self"|"all"|<subunit name/id> }] }`. When a sub-unit's base count is ≥ 1 the listed rules/equipment are added to the targeted sub-unit(s); computed as a derived pass in `computeUnit`, so dropping to 0 bases automatically removes them. Captured via `readSubProfile`.
- Demo seeded on Welsh Teulu Foot / Champion (min 0): +1 base adds "Warlord" to all sub-units and "Banner" to Champion; back to 0 removes both. Verified live.

## Implemented (2026-06 session, sub-unit minimum warning)
- For sub-unit units, the unit card now shows a warning ("Minimum X bases required (currently Y).") when the combined sub-unit base total is below the main unit's min. Added to the existing per-card `requireWarnings` amber block (same styling as other card warnings). Warning-only — never blocks Save/continue — and clears automatically once the total meets/exceeds the min.
- Verified live: Teulu Foot (unit min 6, sub mins sum 2) shows the warning at 2, updates through 3/4/5, clears at 6.

## Implemented (2026-06 session, sub-unit minPercentage)
- Added `minPercentage` on sub-profiles (aliases minPct/minPercent), mirroring `maxPercentage`. A sub-unit's bases must be ≥ that % of the unit's total bases. Enforcement (option b): the sub-unit's − button is disabled when reducing would breach the floor (also enforced in `changeSubBases`), AND a card warning shows "<name>: at least X% of bases required (currently Y%)." that clears when restored. A "MIN X%" badge shows next to the sub-unit title.
- Verified live: Warriors minPercentage 50 → − disabled at 50% boundary; warning at 40%; clears back at 50%.

## Fixed (2026-06 session, sub-unit percentage recalc)
- Added a per-render `maxPercentage` card warning (mirroring the existing `minPercentage` one) so violations are detected on every base-count change across ALL sub-units — including when reducing one sub-unit pushes another over its cap. Message: "<name>: at most X% of bases allowed (currently Y%)." Both floor and cap are re-evaluated each render.
- Verified live: Warriors 3 / Champion 2 (Champion 40%) → no warning; reducing Warriors to 2 (Champion 50%) → warning fires immediately.

## Implemented (2026-06 session, cross-supplement allies)
- Background-load `supplements.json` ([{key,name,file}]) on app startup into `supplementsMeta`.
- `alliedArmyKeys` entries accept an optional `supplement` key (captured in `cat._allySupplement`). When present, that supplement's file is fetched (cached in `externalCacheRef`) and its armies merged into `externalArmies`; allied unit lookups use a combined `allyArmies` map (current supplement wins on key clash, external used otherwise). No `supplement` → falls back to the current supplement (existing behaviour).
- Allies UI shows the supplement name ("· <name>") next to the allied army name in both the checkbox list and the active allied-units header.
- Verified: supplements.json fetched at startup; fallback allies still render (regression, real data). NOTE: the cross-supplement fetch + name suffix are code-verified only — no live army currently sets the `supplement` field, so it couldn't be exercised end-to-end.

## Implemented (2026-06 session, combinedFormation)
- Optional unit field `combinedFormation: [{ label, disableSubProfiles }]`. Renders a "Combined Formation %:" dropdown as the FIRST item in the Unit Options row (same style/size as option controls). First option auto-selected on load; selecting an option hides the named sub-profiles (filtered out of `computeUnit.profiles` before any totals/rules/equipment/onBaseAdded/percentage logic, so hidden sub-profiles have zero impact) and re-enables others. `makeInstance` stores `combinedFormation`/`combinedFormationIndex` (persists via Save/Load); `changeFormation` handler updates the index. Units without the field are unchanged.
- Verified live (Teulu Foot: 25%→hide Champion, 50%→show): default hides Champion, unit total = Warriors-only (15), toggling reveals/hides correctly.

## Fixed (2026-06 session, combinedFormation + button)
- Bug: for units with a `combinedFormation` dropdown, a sub-unit's `+` button did nothing when the combined VISIBLE sub-unit bases were exactly one below the main unit max. Root cause: `changeSubBases` summed ALL sub-profiles (including ones hidden by the current formation selection) when checking `combinedMax`, so the handler rejected an increment that the render-side button logic (which sums only visible profiles) allowed.
- Fix: `changeSubBases` now builds a `hiddenNames` set from the active `combinedFormation` option's `disableSubProfiles` and excludes those profiles from `sumVisible()`, so the combined-total clamp, maxPercentage cap and minPercentage floor all use the same visible total shown in the UI (matches `computeUnit.mainBases`, which already filters hidden profiles).
- Status: code fix applied and consistent across handler + render; USER opted to verify the outcome themselves.

## Fixed (2026-06 session, combinedFormation subunit + index bug)
- Bug (Genghis Khan → Test Army → "Combined Formation Spearmen"/`korean_spearmen_cf`): with the Combined Formation dropdown at 25%, "Mixed Spear/Bowmen" showed 1 base (should be 0) and its + button did nothing.
- Root cause 1: `makeInstance` initialized `subBases` for sub-profiles WITHOUT a `minBases` key to 1 (`s.minBases != null ? s.minBases : 1`) — but the display/`computeUnit` treat a missing minBases as 0. Fixed the default to 0 in `makeInstance` (line ~841) and the `changeSubBases` fallback (and `computeUnit` pBases fallback).
- Root cause 2 (the "+ does nothing"): `computeUnit` FILTERS out sub-profiles hidden by the active `combinedFormation` (line ~1032), then the roster render maps the FILTERED `calc.profiles` with a fresh `idx` and passed that to `changeSubBases`, which indexes the FULL `subProfiles`/`subBases` arrays. When an earlier profile is hidden (25% hides "Bowmen", full idx 1), the visible "Mixed" (filtered idx 1) resolved to the hidden "Bowmen" — so the click mutated a hidden profile and nothing changed on screen. Fixed by tagging each profile with `origIdx` (its index in the full subProfiles list) and using `p.origIdx` in the +/- onClick handlers.
- Verified live: 25% → Mixed 0→1, then Spearmen→6 lets Mixed→2 (2/8=25%); 50% → Bowmen increments correctly. Both index directions confirmed.

## Implemented (2026-06 session, compareWithSubProfile)
- New optional sub-profile field `compareWithSubProfile: { name, expression, ratio }` — a hard cross-constraint between one sub-unit's base count and another sub-unit in the SAME unit. Evaluated as `this.bases [expression] (target.bases * ratio)`; expressions: `lessThanOrEqual | lessThan | greaterThanOrEqual | greaterThan | equalTo` (via `SUB_COMPARE_EXPR`). Parsed in `readSubProfile`, carried through `computeUnit` per-profile object.
- The source sub-unit's `+` is disabled when incrementing would breach the constraint (also enforced as a backstop in `changeSubBases`); the TARGET sub-unit's `−` is never disabled by this rule (its own min/percentage limits still apply). Hidden (combinedFormation) targets are skipped. A `+` tooltip explains the block. A per-card amber warning shows whenever the constraint is currently violated (e.g. after reducing the target): "<name>: must be <label> <ratio>× <target>'s bases (currently X vs <target> Y)."
- Verified live via a Load-Army import on MOCK data (Archers ≤ 0.5× Spearmen): + disabled at 2/4, unlocks after Spearmen→6, Archers→3 then re-locks; reducing Spearmen to 2 keeps its − free and surfaces the violation warning + Warnings badge.

## Implemented (2026-06 session, hide options for hidden sub-profiles)
- Bug: unit options whose `targetProfile` matched a sub-profile hidden by the active `combinedFormation` (`disableSubProfiles`) still appeared in the UNIT OPTIONS section.
- Fix: in the Unit Options render (RosterUnit), compute the `hiddenProfiles` set from `combinedFormation[combinedFormationIndex].disableSubProfiles` and skip any option where `eq.targetProfile` ∈ that set (exact-name match). Reappears when the sub-profile is re-enabled; recomputes immediately on dropdown change (driven by `combinedFormationIndex` state). No points leakage since `computeUnit` already only applies option stats to visible profiles.
- Verified live (Genghis Khan → Test Army → Combined Formation Spearmen): 25% hides the Bowmen-targeted option; 50% re-shows it and hides Rear-Row-targeted options; switching back reverts instantly.

## Implemented (2026-06 session, armyValidation countBy)
- New optional `countBy` field on `armyValidation` rules. `countBy: "units"` compares the number of roster unit ENTRIES for the rule's ids (using the existing per-unit `counts` map); omitted or `"bases"` keeps the original base-summing behaviour. Warning message says "units" or "bases" accordingly.
- Verified live via a temporary MOCK rule (Tenant Cavalry ≤ 1× Tenant Foot Spearmen, countBy units): with 2 cavalry entries (6 bases) + 1 spearmen entry the warning reported "units (2) ... units (1)" — confirming entry counting, not bases. Temp rule removed after verification.

## Implemented (2026-06 session, armyValidation real-time +Add blocking)
- For `armyValidation` rules with `expression` `lessThanOrEqual`/`lessThan`, the catalog "+ Add" button for every unit in the rule's `ids` is now disabled in real time whenever adding one more would breach the constraint against `compareWith × ratio`; it re-enables as soon as the constraint would hold again (e.g. after adding a `compareWith` unit). Added to the `blockedAddIds` useMemo so it reacts to roster/count changes.
- Works for both `countBy: "units"` (predicted +1 entry) and default bases (predicted += the unit's starting bases, `max(minBases,1)`). With no compareWith present the ids are blocked (threshold 0), matching the intent.
- Verified live (temp MOCK rule, Tenant Cavalry ≤ 1× Tenant Foot Spearmen, countBy units): empty→Cavalry disabled; +Spearmen→enabled; +Cavalry→disabled; +Spearmen→enabled. Temp rule removed; App.js compiles clean.

## Implemented (2026-06 session, targetProfile array support)
- `optionalEquipment.targetProfile` now accepts a string OR an array of strings. When an array, the option's points/stats/rules/equipment apply to every named sub-profile (via new `optionTargetsProfile` helper used in `computeUnit`). Single-string behaviour unchanged. The combinedFormation option-hiding rule now hides an option only when ALL of its target sub-profiles are hidden (single string = hide when that one is hidden).
- Verified live (Load-Army MOCK): Shield `["Spearmen","Archers"]` applied +2 pts/+1 def to both those rows but not Skirmishers; Javelin `"Skirmishers"` (string) applied only to Skirmishers. App.js compiles clean.

## Implemented (2026-06 session, PDF export layout redesign)
- PDF/print export (`PrintSummary`): (1) removed the unit description row entirely; (2) redesigned the table header into two tight rows — Unit/Category/Bases/Atk/Def/Coh remain single (rowSpan 2); "Pts/Base"→"Points"/"Base", "Pts/Options"→"Points"/"Options", "Total"→"Pts Total"/"Base", trailing "Points"→"Unit"/"Points" (split labels centred); (3) sub-profile units now print the main unit line, then each VISIBLE sub-profile as its own full row in the same columns (bases, A/D/C, per-base points/options/total, unit points), with that sub-profile's own equipment + special rules beneath its name.
- Verified live (revealed print-summary): descriptions gone, two-row header correct, Over King prints normally, Mixed Foot shows Spearmen + Archers rows with per-row stats and equipment/rules (array-targeted "Large Shield" appears on both). App.js compiles clean.

## Backlog / Future
- P1: If remote JSON gets fixed, verify live-data path renders correctly.
- P2: Save/load rosters to localStorage.
- P2: Search/filter within catalog.
- Note: advanced rules verified via node logic tests; demo entries seeded in MOCK_DATA (Welsh, incl. Teulu Foot subProfiles) since remote data is the primary source. Sub-profile UI/PDF rendering not yet visually verified (demo only reachable via fallback data).
