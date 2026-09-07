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

## Implemented (2026-06 session, PDF export layout tweaks v2)
- PDF header: kept two-row header; renamed "Pts Total" → "Total"; Unit & Category headers left-aligned, all columns from Bases onward centre-aligned.
- Column content: Unit & Category cells left-aligned; every other column (Bases/Atk/Def/Coh/per-base points/options/total/unit points) centre-aligned (Unit Points changed from right → centre).
- Sub-profile rows: keep the 16px indent; below each sub-profile's stats row, Special Rules and Equipment now print as full-width (`colSpan=10`) bold rows in the same "Special Rules: … / Equipment: …" format as non-sub-profile units, flowing across the page.
- Verified live via revealed print-summary.

## Implemented (2026-06 session, PDF category grouping)
- PDF export now groups units by category, in the same order as the Army Validation Report (`categoryReport`), with an uppercase bold category-name header row above each group. Empty categories render no header/rows. Units with a categoryId not present in the report are appended in a trailing group under that id. Extracted `renderUnitRows` helper in `PrintSummary` and iterate `groups` in the tbody.
- Verified live: Commanders group (Over King) then Tenants group (Mixed Foot + sub-profiles, Tenant Cavalry) in report order; empty categories omitted from the unit table.

## Implemented (2026-06 session, Army Break Point / BP)
- New per-unit Break Points via `unitBreakPoints(inst, calc)` (module-level). Only ACTIVE (toggled-on) rules count (base special rules + equipped-option rules + visible sub-profile rules). Categories are mutually exclusive so first-match cascade: (1) has Open Order/Close Order/Wagon/Wagon Tabor → 2 BP if PTS/Unit ≤150 else 3; (2) Skirmishers (calc.isSkirm) AND bases ≥4 → 1; (3) type Light Artillery/Multi-barrelled Artillery/Mortars AND bases ≥2 → 2 if ≤150 else 3; else 0.
- Army totals in App: `totalBreakPoints` = sum of unit BP; `armyBreakPoint` = floor(sum/2); `breakPointsToBreak` = sum − armyBreakPoint.
- Unit card: added a "BP" `Stat` column between C and PTS/UNIT (main row shows the value; sub-profile rows reserve the column with a blank). Narrowed `Stat` width 68→56px so the extra column fits without overflow (applies to all card stat columns consistently).
- Roster Summary: added Total Break Points / Army Break Point / Break Points to Army Break between Max Points Limit and Total/Limit; widened the summary box 360→460px.
- Verified live via Load-Army: Close Order≤150→2, Open Order>150→3, Skirmish(4)→1, Light Artillery(2)→2, plain→0, sub-profile(Open Order)→2 (blank on sub rows); summary 10/5/5. No card overflow.

## Implemented (2026-06 session, BP/summary layout tweaks)
- Unit card columns: renamed "Pts/Options" → "Options"; renamed BP column to "BPs" and moved it between TOTAL and D (both main and sub-profile rows; sub-profile BPs stays blank).
- Roster Summary: widened box to 620px and its green bottom border is bottom-aligned with the Supplement/Army dropdowns (parent row uses items-stretch; verified all three bottoms = same y). Moved Total/Limit to the right of the Break-Points column; reordered the three BP lines to Total Break Points → Break Points to Army Break → Army Break Point.
- Verified live (Load-Army): columns/labels correct, summary 5/3/2, bottoms aligned at px 202.

## Implemented (2026-06 session, Roster Summary anti-shift + centring)
- BP value spans given fixed width `w-7` + `tabular-nums` (2-digit reserve, right-aligned) and the BP block a fixed `w-[236px]`, so values updating from 0 cause no text/layout shift.
- Total/Limit: running total wrapped in a fixed `min-w:4ch` right-aligned `tabular-nums` span (reserves 4 digits) with `whitespace-nowrap` on "/ limit"; column is `shrink-0` so adding units never shifts neighbours.
- Break Points block centred: summary row now has three direct `justify-between` children (Max Points | BP block | Total/Limit), all `shrink-0`, giving approximately equal left/right spacing around the centred BP block; three rows stay aligned (fixed block + value widths).
- Verified live: before/after adding units, bp-block (x1195.5,w236), total-points (x1485,w137) and value spans (w28) unchanged; values 4/2/2, total 100/1000.

## Implemented (2026-06 session, PDF export v3)
- PDF columns now: Unit | Category | Atk | Def | Coh | Bases | Points/Base | Points/Options | Total/Base | BP | Unit Points (11 cols). Added BP column between Total/Base and Unit Points (value on main row, blank on sub-profile rows); moved Bases to between Coh and Points/Base.
- Header block adds a Break Points row (Total Break Points · Break Points to Army Break · Army Break Point) and a "Supplement name: <name>" line below the army name (same 12px style as Total Points); PrintSummary now receives `totalBreakPoints/armyBreakPoint/breakPointsToBreak/supplementName` (supplement from `data.supplement`).
- Tightened padding: stat-header rows (2px), and the Special Rules ↔ Equipment rows on both unit and sub-profile (near-zero inter-row gap). Atk/Def/Coh values bolded on unit and sub-profile name rows.
- Verified live via revealed print-summary.

## Implemented (2026-06 session, PDF supplement name from supplements.json)
- PDF header supplement name is now resolved from the already-loaded `supplementsMeta` (fetched from supplements.json on startup): new `selectedSupplementName` memo matches the currently selected supplement by its data file (`selectedSupplementUrl` minus BASE_DATA_URL) to the meta entry and uses its `name`; falls back to name-match then `data.supplement`. Passed to `PrintSummary`.
- Verified live: selecting the Genghis Khan supplement shows "Supplement name: Genghis Khan" in the PDF header.

## Implemented (2026-06 session, PDF page-break control)
- PDF print: each unit's rows (main + sub-profiles + Special Rules/Equipment + separator) are wrapped in their own `<tbody style="break-inside:avoid; page-break-inside:avoid">` so a unit never splits across printed pages. Each category header is its own tbody with break-inside + break-after avoid (so a header isn't orphaned at a page bottom). Visual layout unchanged; verified render (multiple tbodies, columns intact).

## Fixed (2026-06 session, duplication carries stale hidden options)
- Bug: duplicating a unit dropped over-limit equipment (maxUnits/maxEquipmentCount) from the clone, but options that were `hiddenUntilEnabled:"hidden"` and only revealed by that now-dropped equipment stayed selected — and since `computeUnit` costs equipped options regardless of hidden state, the clone kept phantom points/stats (e.g. Charlemagne Freeman Cavalry: Light Armour maxUnits 2 → 3rd duplicate correctly disabled Light Armour but kept Shock Cavalry active).
- Fix: after the limit-based removal in `duplicateUnit`, iterate to a fixpoint pruning any equipped `hiddenUntilEnabled:"hidden"` option that is no longer revealed by a still-equipped option's `enableHidden` (handles reveal chains).
- Verified live (MOCK repro, Light Armour maxUnits 2 + hidden Shock Cavalry): duplicating a 3rd unit dropped Light Armour AND Shock Cavalry (hidden, unequipped); clone total 30 vs 48 on originals.

## Fixed (2026-06 session, header two-column no-collapse)
- Header no longer stacks the Roster Summary below the left controls for long army names. Removed `flex-wrap` from the header row and the dropdowns row (now `flex-nowrap`), added `min-w-0` to the left column so it can shrink, and changed the Army `SelectTrigger` from `min-w-[280px]` to `w-[280px] max-w-[280px]` so long names truncate with an ellipsis (shadcn trigger's `line-clamp-1`). Summary box stays `w-[620px] shrink-0` on the right.
- Verified at 1360px with the long Welsh name: Save/Load box and Summary share the same row, summary right of the left stack, army name ellipsised.

## Implemented (2026-06 session, Roster Summary spacing + army name revert)
- Roster Summary inner row changed from `justify-between gap-6` to `justify-center gap-4` so the three columns (Max Points / Break Points / Total-Limit) sit ~1/3 of the previous spacing apart.
- Middle Break-Points block converted to a 2-column CSS grid (`gridTemplateColumns: 'max-content 1.75rem'`, `columnGap: 3ch`) so each value sits ~3 characters after the (longest) label and all three values stay right-aligned (verified identical right edge). Fixed value column width keeps 2-digit values from shifting.
- Reverted the Army dropdown to `min-w-[280px]` (no max/truncation) so full army names display; header stays two-column via the earlier `flex-nowrap` + `min-w-0`.

## Implemented (2026-06 session, Roster Summary alignment)
- Wrapped the summary header + content rows in a `w-fit` container (content-width) and left-packed the content (`justify-start`). The header row is `w-full justify-between` inside that wrapper. Result: "ROSTER SUMMARY" left-aligns with the Max Points column (now `items-start`), and the StatusBadge right-aligns with the Total/Limit column (now `items-end`, `justify-end`). Box padding reduced p-3→p-2.
- Because the badge is right-anchored inside the content-width wrapper (right edge fixed by the Total/Limit column, which is wider than the badge), it grows leftward when its text changes and never shifts right / moves layout.
- Verified live (pixel): ROSTER SUMMARY left == Max Points label left (1026); badge right == Total/Limit right (~1519).

## Implemented (2026-06 session, Roster Summary right-align)
- Roster Summary box: added `items-end` so the content `w-fit` wrapper hugs the right side (content right edge now ~8px from box border = matches the p-2 left padding, so right padding == left padding). Added `ml-auto` so the box is flush-right within the header's right column.
- Verified live: Total/Limit right edge ~10px inside box right; ROSTER SUMMARY↔Max Points and badge↔Total/Limit alignments preserved.

## Implemented (2026-06 session, Roster Summary width fit)
- Changed the summary box from fixed `w-[620px]` to `w-fit` so it shrinks to its content: left and right padding are now symmetric (both ~10px incl. border). Box stays flush-right (`ml-auto`) with prior alignments intact.

## Fixed (2026-06 session, Roster Summary top-row height shift)
- The "Empty roster" badge had no border while "Valid"/"Warnings" had a 1px border (+2px height), shifting the box on toggle. Added `border border-transparent` to the empty badge so all states are identical height, and reserved `min-h-[30px]` on the summary top row. Verified: box height 138px / top y=64 unchanged across Empty→Valid→Warnings.

## Implemented (2026-06 session, armyValidation equipmentUnitCount)
- New `armyValidation` rule `type: "equipmentUnitCount"` with `{ left:{unitIds,equipment}, expression, ratio, right:{unitIds,equipment} }`. For each side it counts units (from unitIds) that have at least one of the `equipment` items ENABLED (base or selected optional; sub-profile equipment included); a unit with multiple matches counts once; disabled/unselected equipment is ignored. Compares leftCount `expression` (rightCount × ratio); expressions: lessThan/lessThanOrEqual/greaterThan/greaterThanOrEqual/equalTo. On failure pushes a `critical` (red) validation error. Handled at the top of the armyValidation loop in the warnings memo.
- Verified live (temp MOCK rule): left "Bow/Sling" units = 2 (one unit had both Bow+Sling, counted once) vs right "Javelin" = 1 → error shown; adding a 2nd Javelin unit cleared it.

## Fixed (2026-06 session, equipmentUnitCount base equipment on both sides)
- Hardened `equipmentUnitCount` counting: `unitHasEquip` now explicitly aggregates base equipment (`inst.baseEquipment`), enabled optional equipment (`inst.equipped` + `calc.equipment`), and visible sub-profile equipment for BOTH left and right sides, and matches names case-insensitively/trim-normalized (fixes right-side base equipment being missed due to name-case/whitespace mismatches).
- Verified live (temp MOCK rule, rule used lowercase "javelin"): right-side unit whose ONLY match was base equipment "Javelin" was correctly counted (right = 1), error rendered as red critical.

## Fixed (2026-06 session, equipmentUnitCount not firing — plural mismatch)
- Root cause: equipment name matching was exact, so real data with plural weapon names (e.g. "Bows"/"Slings"/"Javelins") never matched singular rule tokens ("Bow"/"Sling"/"Javelin") — a side counted 0 and the constraint silently passed.
- Fix: made matching plural-tolerant (strips a trailing "s" on both the enabled equipment and the rule token, alongside case/trim normalization) and accept alternate side keys (`unitIds|units|ids`, `equipment|gear|weapons`). Base + enabled-optional + visible sub-profile equipment still checked for both sides.
- Verified live: data "Bows/Slings/Javelins" (plural) with rule tokens "Bow/Sling/Javelin" (singular) → left=2, right=1, `lessThanOrEqual` ratio 1 → red error fires correctly.

## Fixed (2026-06 session, equipmentUnitCount uses effective equipment)
- `unitHasEquip` now counts against each unit's EFFECTIVE equipment only: `calc.equipment` (base equipment with `equipmentAdded` merged in and `equipmentRemoved` stripped for selected optional equipment) plus visible sub-profile effective equipment. Raw `inst.baseEquipment` and selected option NAMES are no longer used, so removed items don't count and added items do. Case-insensitive + plural-tolerant matching retained.
- Verified live: a unit with base Spear + selected "Add Bow" (equipmentAdded Bow) is counted for "Bow"; a unit with base Bow + selected "Drop Bow" (equipmentRemoved Bow) is excluded.

## Implemented (2026-06 session, armyValidation equipmentBasesCount)
- New `armyValidation` rule `type: "equipmentBasesCount"` with `{ left:{unitIds,equipment}, expression, ratio, right:{unitIds,equipment} }`. Matches INDIVIDUAL roster units on each side by unitId AND effective-equipment match (same case-insensitive/plural-tolerant `calc.equipment` + visible sub-profile equipment logic as `equipmentUnitCount`). A unit's "base count" = `calc.mainBases` (sums visible sub-unit bases for combinedFormation units, else `inst.bases`).
- For each matched LEFT unit, its bases are compared against EACH matched RIGHT unit's bases × ratio via the expression (lessThan/lessThanOrEqual/greaterThan/greaterThanOrEqual/equalTo). If it fails against ANY right unit it is flagged: an amber warning appears on its own roster card AND a red critical entry is pushed to the Army Validation summary. The card/summary message lists ALL failing right units (user choice b), e.g. "Noble Cavalry (3 bases with Light Armour) must be no more than 0.5× the bases of Spear units (Light Cavalry: 3 → limit 1.5)."
- Skipped entirely when either side has zero matching units. Fully reactive.
- Impl: a dedicated `equipmentBasesCount` useMemo returns `{ summary, byUnit }`; `summary` is spread into the `warnings` memo, `byUnit[instanceId]` is threaded to `RosterRow` via new `extraWarnings` prop and appended to its `requireWarnings` amber block.
- Verified live (temp franks rule, noble_cavalry Light Armour ≤ 0.5× light_cavalry Spear bases): at noble 3 / light 3 → card + summary error fired; raising light to 6 (limit 3) cleared both. Temp seeds removed; App.js compiles clean.

## Implemented (2026-06 session, armyValidation fixed value)
- `armyValidation` rules now accept a fixed `value` field as an alternative to `compareWith`. When `value` is present, the combined count of the rule's `ids` (units when `countBy:"units"`, else summed bases) is compared directly against that number via the `expression`. Full expression range supported (lessThan, lessThanOrEqual, greaterThan, greaterThanOrEqual, equalTo — added `equalTo` alias to the EXPR map alongside existing `equal`). Failure pushes a warning to the army validation summary: "<names> <units|bases> (N) must be <label> <value>." Skipped when the left count is 0.
- The real-time catalog +Add blocking (`blockedAddIds`) also honours `value`: for lessThan/lessThanOrEqual value-rules the threshold is the literal `value` (was previously mis-treated as compareWith×ratio = 0, which wrongly disabled Add).
- Verified live (temp franks rules): bases `lessThanOrEqual 4` fired at 5 bases; units `greaterThanOrEqual 2` fired at 1 and cleared at 2; `equalTo 3` fired at 1 and cleared at 3; zero-count sides skipped. Temp seeds removed; App.js compiles clean.

## Implemented (2026-06 session, unit maxPerPointsLimit)
- New per-unit rule `maxPerPointsLimit: { pointsThreshold, rounding }`. Max copies of the unit = `armyMaxPoints / pointsThreshold` rounded by `rounding` ("floor" default, or "ceil") — uses the FIXED army points limit, not the running total. Module-level helper `maxPerPointsCap(rule, maxPoints)`.
- Carried onto roster instances via `makeInstance`. Validated alongside `maxCountAllowed` in the warnings memo: a red critical error fires when a unit's roster count exceeds the cap, e.g. "You have added 3 units of 'Warriors', but a maximum of 1 is allowed (1 per 333 pts of the 500 pts army limit)." Also gates the catalog +Add (`blockedAddIds`) at the cap and shows a `(Max: have of cap)` badge on the catalog card. Fully reactive to the MAX POINTS LIMIT field.
- Verified live (temp franks rules): floor 333 → cap 3 at 1000 / 1 at 500; ceil 333 → cap 4 at 1000 / 2 at 500; +Add blocked at cap; lowering max points to 500 fired the summary error. Temp seeds removed; App.js compiles clean.

## Implemented (2026-06 session, hide restricted allied units)
- Allied units restricted by a category's `_allyUnitFilter` (`onlyUnits`/`excludesUnits`) are now filtered OUT of the allied unit list entirely instead of being rendered greyed-out/blocked. Only selectable units appear (the filter is applied via `.filter((u) => !isRestricted(u.id))` before mapping, and `isRestricted` was removed from the CatalogUnit `blocked` prop).
- Verified live (real data, Franks → Late Imperial Roman ally which excludes foederati/catafractii_clibanarii/legionaries): the 3 excluded units are no longer rendered while the 7 available LIR units show normally.

## Implemented (2026-06 session, allied commanders count toward main limit)
- The Commanders count-category validation now includes allied units whose SOURCE category is "Commanders". `makeInstance` records `sourceCategory` (the unit's original category before the Allies categoryOverride). In both the warnings memo and `categoryReport`, when the category is a commander category the count `n` adds allied roster units where `sourceArmyKey` is set, `categoryId !== cat.id`, and `isCommanderCat(sourceCategory)`. Combined main + allied commanders must not exceed the main army's commander limit.
- Points are unaffected: allied commanders still carry `categoryId = Allies`, so their points count against the Allies % budget, not the main army — the commander limit remains a pure count rule.
- Verified live (Franks, temp commander max 1, ally = Late Imperial Roman Legate type "Commander"/cat "Commanders"): 1 main + 1 allied commander → "Commanders: allows at most 1 unit choice(s) — currently 2." and the report showed "2 choices"; Legate's 15 pts appeared under the Allies budget only. Temp seed removed; App.js compiles clean.

## Bug fix (2026-06 session, per-category maxAlliedArmiesAllowed)
- `maxAlliedArmiesAllowed` was enforced globally (summing `checkedAllies.length` across all categories against a single `maxAllies`). Now enforced INDEPENDENTLY per category: the validation memo iterates `army.categories`, counts only `checkedAllies` entries prefixed `${cat.id}::`, and compares against that category's own `cat.maxAlliedArmiesAllowed`. The ally-checkbox disabling in `CatalogCategory` likewise counts only the current category's selections against `cat.maxAlliedArmiesAllowed` (was using global `checkedAllies.length >= maxAllies`).
- Verified live (pagan_rus: Mercenaries limit 1 + Allies limit 1): picking 1 in each raised NO error and neither category disabled the other; a 2nd pick within the same category was correctly disabled.

## Bug fix (2026-06 session, floor fractional armyValidation ratios)
- The `compareWith` ratio rule computed `threshold = rightSum * ratio` un-rounded, so `0.5 × 1 = 0.5` wrongly required 1 unit. Now `threshold = Math.floor(rightSum * ratio)` in both the validation memo and the `+Add` blocking (`blockedAddIds`). So 0.5 × 1 hoplite = 0 (no requirement); 0.5 × 2 = 1 (one spearmen required).
- Verified live (Classical Armies → Early Rome, real rule: spearmen ≥ 0.5× hoplites countBy units): 1 hoplite → no error; 2 hoplites → "…must be at least 0.5× … (2) = 1"; adding 1 spearmen cleared it.

## Implemented (2026-06 session, optional-equipment minUnits)
- `minUnits` was NOT previously supported on optional equipment (only `maxUnits`/`maxEquipmentCount`, which is enforced by disabling the checkbox at the cap). Added `minUnits` validation: in the warnings memo, roster units are grouped by `unitId`; for each option with `minUnits`, if the number of that unit type's instances with the option selected is below `minUnits`, a warning is pushed: "'<option>' must be selected on at least N <Unit> — currently X." (`readOption` already preserves the field via `...e`.)
- Verified live (temp Franks Warriors "Javelins" minUnits 2): 0 selected → warning "currently 0"; 1 selected → "currently 1"; 2 selected → cleared. Temp seed removed; App.js compiles clean.

## Bug fix (2026-06 session, countBy:"bases" sub-profile tally)
- armyValidation `countBy:"bases"` (and the `+Add` blocking tally) summed raw `i.bases`, which is 0 for sub-profile/combinedFormation units (real counts live in `subBases`), so those units contributed 0 to the base tally. Fixed by building `basesByUnit`/`basesByUnitId` from `computed` using `calc.mainBases` (sum of all VISIBLE sub-profile bases). Added `computed` to `blockedAddIds` deps.
- Verified live (temp Franks combined-warriors rule, countBy bases): the combined unit reported "bases (2)" (Elite 1 + Warriors 1) instead of 0, and grew to "bases (4)" after adding sub-profile bases. Temp seed removed; App.js compiles clean.

## Implemented (2026-06 session, conditional allied army display)
- Allied army entries (`alliedArmyKeys`) now support an optional `conditions` object: `requiresUnits` (+`requiresUnitsLogic` "OR"/"AND", default "AND") shows the ally only when those roster unit ids are present; `excludesIfUnits` (+`excludesIfUnitsLogic` "OR"/"AND", default "AND") hides the ally when those unit ids are present. Absent `conditions` → always shown.
- `normalizeData` captures the per-key rules into `category._allyConditions[key]`; module helper `allyConditionsMet(cond, rosterCounts)` evaluates them; `CatalogCategory` hides the checkbox when unmet (a currently-checked ally stays visible so it can still be deselected — avoids stranding allied units).
- Verified live (temp Franks LIR ally, requires OR [warriors/elite], excludes OR [duke_or_king]): hidden on empty roster; shown after adding Warriors; hidden again after adding Duke or King. Temp seed removed; App.js compiles clean.

## Implemented (2026-06 session, unit-level basesComparison)
- New per-unit rule `basesComparison: { expression, compareWith }`. Each instance of the unit must satisfy `expression` (greaterThan/greaterThanOrEqual/lessThan/lessThanOrEqual/equalTo) when its base count (`calc.mainBases`) is compared against EACH individual instance of every unit id in `compareWith`. Failing against any instance → an amber per-card warning naming the conflicting unit(s) and both base counts, e.g. "Warriors (5 bases) must have no more than the bases of Elite Warriors (3 bases)." Skipped when no `compareWith` instances are in the roster.
- Impl: `makeInstance` carries `basesComparison`; a `basesComparisonWarnings` useMemo returns an instanceId→messages map, merged with `equipmentBasesCount.byUnit` into the RosterRow `extraWarnings` prop.
- Verified live (temp Franks Warriors ≤ Elite Warriors bases): 3≤3 no warning; warriors raised to 5 → warning fired; removing Elite Warriors → skipped (no warning). Temp seed removed; App.js compiles clean.

## Implemented (2026-06 session, requires array + countPerUnit)
- Extended the unit-level `requires` rule: `normalizeRequires` now accepts `unitIds` (array) in addition to legacy `unitId` (string/array), an array `name` (joined with " or " for messages, falls back to unit ids), and a new `countPerUnit` field. `countPerUnit` scales the requirement per instance of the requiring unit — N instances need `N × countPerUnit` units total from `unitIds` (any combination). Legacy `unitId`+`count` (fixed minimum) and `perUnit` (ratio) still work unchanged.
- Consumers updated: `blockedAddIds` blocks +Add when `(instances+1) × countPerUnit > have`; `requireHints` tooltip shows "Needs Nx <names> for each <unit> (need X, have Y)"; and the warnings memo now emits a non-self requires summary warning ("'<unit>' requires N × <names> per unit — M in the roster need X, but only Y present." or the fixed-count variant).
- Verified live (temp Franks Light Cavalry requires 2× [Warriors/Elite Warriors] per unit): +Add blocked at 0 warriors, enabled at 2, re-blocked after adding 1 LC (needs 4); removing a warriors produced the exact warning. Temp seed removed; App.js compiles clean.

## Implemented (2026-06 session, pointsRatio countOffset)
- Added optional `countOffset` (positive/negative integer) to the `pointsRatio` category constraint. `pointsRatioMax` now computes `(maxPoints/pointsThreshold)*countPerThreshold`, rounds per `rounding`, then adds `countOffset`, still clamped to a minimum of 1. Absent `countOffset` → unchanged behaviour. Flows through all consumers (category badge, full-set detection, count validation).
- Verified: pure-function math (base 4 → +2=6, −1=3, −10 clamps to 1, absent=4) and live UI (temp Franks Skirmishers pointsRatio 1/250 down +2 → badge "max 6 choices (1 per 250 pts)"). Temp seed removed; App.js compiles clean.

## Implemented (2026-06 session, pointsRatio countOffset display)
- The Army Composition table now shows the `countOffset` for `pointsRatio` categories: appends " + N" for positive and " - N" for negative offsets, e.g. "max 5 choices (1 per 250 pts + 1)" / "max 3 choices (1 per 250 pts - 1)". No offset → unchanged.
- Verified live (temp Franks Skirmishers +1, Cavalry -1): both rendered correctly. Temp seed removed; App.js compiles clean.

## Code review fixes (2026-06 session)
Applied the safe, non-structural items from the code-review report:
- Empty catch blocks (supplements catalog load + per-supplement allied fetch) now log via `console.warn` while keeping graceful fallback.
- Replaced array-index React keys with content-based/stable keys in: validation panel list, per-card requireWarnings, combined-formation `<option>` list, and the print Validation Notes list.
DELIBERATELY SKIPPED (with rationale):
- Component/file splitting (App/RosterRow) and breaking up `computeUnit`/`normalizeData`/`PrintSummary`/`CatalogCategory`: violates the standing single-file `App.js` mandate and carries high regression risk on the working validation engine.
- Bulk "missing hook dependencies" (e.g. line ~1745 "add a, add, allowed …"): these are loop-local variables inside the memos, not real deps — adding them would be out-of-scope/incorrect; the report is auto-generated and noisy here.
- `use-toast.js` `[state]` dep: standard shadcn boilerplate; altering risks a re-subscribe loop.
- "Expensive" JSX filter+map (allied lists): tiny arrays rendered only when an ally is active; can't hoist a hook into a `.map` body — false positive.
Verified: compiles clean; live smoke test (Franks + add Warriors) renders roster, validation report, and warnings correctly.

## Code review fixes round 2 (2026-06 session)
- Applied #6 (line 3004): the inline `extraWarnings={[...]}` array (new per row each render) is now built once via a memoized `extraWarningsByInstance` map merging `equipmentBasesCount.byUnit` + `basesComparisonWarnings`; RosterRow receives `extraWarningsByInstance[instanceId]`. Verified card warnings still surface (temp basesComparison test).
- #7 index.js console: report is inaccurate — `index.js` contains no console statement (nothing to remove).
- #7 App.js console.warn (1308/1336): kept. These were added last turn to satisfy the previous report's CRITICAL "empty catch blocks" finding; removing them would reintroduce silent failures. The two reports contradict each other here; graceful-fallback logging is the better engineering choice.
- Re-affirmed skips (single-file mandate + auto-gen linter noise): splitting App/RosterRow, decomposing computeUnit/normalizeData/CatalogCategory/CatalogUnit/PrintSummary, bulk "missing deps" (loop-local vars), use-toast `[state]` dep, and small allied filter+map "perf" false-positives.

## Build fix (2026-06 session, Netlify ESLint exhaustive-deps)
- Line 1289: `const armies = data?.armies || {}` → `useMemo(() => data?.armies || {}, [data])` so the reference is stable and downstream memos (allyArmies etc.) don't churn.
- Line 1733 (`allUnitDefs` memo): removed redundant `armies` dep (body only uses `army` + `allyArmies`).
- Line 2673 (`warnings` memo): removed unused deps `armies`, `alliesCategory`, `maxAllies` (not referenced in body since per-category allied logic replaced the globals).
- Verified: `CI=true yarn build` compiles successfully with zero ESLint warnings/errors → Netlify build unblocked.

## ESLint v10 upgrade (2026-06 session)
- Upgraded standalone `eslint` 9.23.0 → **10.10.0** and `@eslint/js` → **10.0.1** (Node 20.20.2 satisfies v10's ^20.19 requirement). This drops ESLint 9's deprecated transitive deps (`@humanwhocodes/config-array`, `@humanwhocodes/object-schema`) in favour of `@eslint/config-array`/`@eslint/object-schema` — clearing the npm deprecation warnings.
- Added `frontend/eslint.config.js` (flat config, mandatory in v10; eslintrc removed). Uses `@eslint/js` recommended + wires `eslint-plugin-react-hooks` rules; browser/es2021/node/jest globals; ignores build/dist/node_modules/etc. New v10 recommended rules (`no-useless-assignment`, `preserve-caught-error`) set to "warn" so CLI runs clean (`npx eslint src/App.js` → 0 errors, exit 0).
- BUILD SAFETY: the Netlify/craco build lints via react-scripts' OWN nested ESLint 8.57.1 (eslint-config-react-app + `plugin:react-hooks/recommended` in craco.config.js), independent of the top-level ESLint — so the v10 bump does not affect the build. Verified `CI=true yarn build` compiles successfully; frontend healthy (200).
- Left `eslint-plugin-react/jsx-a11y/import` (peer ^9) and `eslint-plugin-react-hooks@5.2.0` unchanged: they're consumed by the build's nested ESLint 8, and react-hooks' eslintrc `recommended` config is required by the craco build (upgrading risks breaking it). yarn emits benign peer-range warnings for these under eslint 10 (non-fatal; functionality intact).

## Bug fix (2026-06 session, Skirmishers badge styling)
- The Skirmishers special-rule badge rendered amber (`border-amber-700/50 bg-amber-500/10 text-amber-300`) via an `isSkirmRule(r)` conditional in the roster card's Special Rules lists (both the sub-profile block and the base block). Removed the conditional so it uses the standard slate badge styling like every other rule, regardless of source (base equipment, optional equipment, sub-profile rulesAdded, etc.). Verified live with Franks Skirmishers.

## Backlog / Future
- P1: If remote JSON gets fixed, verify live-data path renders correctly.
- P2: Save/load rosters to localStorage.
- P2: Search/filter within catalog.
- Note: advanced rules verified via node logic tests; demo entries seeded in MOCK_DATA (Welsh, incl. Teulu Foot subProfiles) since remote data is the primary source. Sub-profile UI/PDF rendering not yet visually verified (demo only reachable via fallback data).
