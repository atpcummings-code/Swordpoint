import React, { useEffect, useMemo, useState, useRef } from "react";
import "@/App.css";
import {
  Plus,
  Minus,
  Copy,
  ArrowUp,
  ArrowDown,
  Trash2,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Swords,
  Crown,
  Users,
  Flag,
  RefreshCw,
  Save,
  Upload,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  DATA SOURCE                                                        */
/* ------------------------------------------------------------------ */
const DATA_URL =
  "https://raw.githubusercontent.com/atpcummings-code/swordpoint-data/refs/heads/main/dark_ages_armies.json";

/* Supplements — each maps to a remote army-data JSON file */
const BASE_DATA_URL =
  "https://raw.githubusercontent.com/atpcummings-code/swordpoint-data/refs/heads/main/";
const SUPPLEMENTS = [
  { name: "Chariot Armies", file: "chariot_armies.json" },
  { name: "Charlemagne", file: "charlemagne.json" },
  { name: "Classical Armies", file: "classical_armies.json" },
  { name: "Dark Ages Armies", file: "dark_ages_armies.json" },
  { name: "Genghis Khan", file: "genghis_khan.json" },
  { name: "Medieval Armies", file: "medieval_armies.json" },
  { name: "Rise of Rome", file: "rise_of_rome.json" },
  { name: "The Hundred Years War", file: "the_hundred_years_war.json" },
  { name: "To the Ends of the Earth", file: "to_the_ends_of_the_earth.json" },
  { name: "The Wars of the Roses", file: "the_wars_of_the_roses.json" },
].map((s) => ({ ...s, url: BASE_DATA_URL + s.file }));

/* Fallback dataset — used if the remote fetch fails or returns invalid JSON.
   Mirrors the Swordpoint: Dark Age Armies schema. */
const MOCK_DATA = {
  supplement: "Swordpoint: Dark Age Armies",
  armies: {
    early_medieval_welsh: {
      armyName: "Early Medieval Welsh (800 AD - 1063 AD)",
      exclusiveGroups: [["welsh_tenants_spearmen", "welsh_tenants_archers"]],
      unitPoolRatio: [
        {
          sourceIds: ["welsh_teulu_cavalry", "welsh_teulu_foot"],
          targetIds: ["welsh_skirmishers"],
          ratio: 1,
        },
      ],
      armyValidation: [
        {
          unitId: "welsh_skirmishers",
          compareWith: ["welsh_teulu_foot", "welsh_teulu_cavalry"],
          expression: "lessThanOrEqual",
          ratio: 0.5,
        },
      ],
      unitCountValidation: [
        {
          ids: ["welsh_skirmishers"],
          compareWith: ["welsh_teulu_foot"],
          expression: "lessThanOrEqual",
          ratio: 1,
        },
      ],
      pointsPercentageValidation: [
        {
          unitId: ["welsh_skirmishers"],
          percentage: 25,
          expression: "lessThanOrEqual",
        },
      ],
      categories: [
        { id: "commanders", name: "Commanders", constraintType: "count", min: 1, max: 8 },
        { id: "teulu", name: "Teulu", constraintType: "percentage", min: 0, max: 33 },
        { id: "tenants", name: "Tenants", constraintType: "percentage", min: 0, max: 80 },
        { id: "skirmishers", name: "Skirmishers", constraintType: "pointsRatio", pointsThreshold: 250, countPerThreshold: 1, rounding: "down" },
        {
          id: "allies",
          name: "Allied Contingents",
          constraintType: "percentage",
          min: 0,
          max: 15,
          description:
            "You may include one allied contingent. Check an army below to add its non-General units. Allied units count toward this category's points limit.",
          alliedArmyKeys: [{ key: "vikings", disables: ["vikings"], onlyUnits: ["viking_hirdmen", "viking_bondi"] }, { key: "anglo_danish", excludesUnits: ["ad_slingers"] }],
          maxAlliedArmiesAllowed: 2,
        },
        {
          id: "mercenaries",
          name: "Mercenary Contingents",
          constraintType: "percentage",
          min: 0,
          max: 15,
          description:
            "Hire the same armies as mercenaries. Selecting an army here (or as an ally) locks it in the other category.",
          alliedArmyKeys: ["vikings", "anglo_danish"],
          maxAlliedArmiesAllowed: 2,
        },
      ],
      units: [
        {
          id: "welsh_over_king",
          name: "Over King",
          description: "Army general. May ride a horse.",
          category: "commanders",
          type: "General",
          attacks: 3,
          cohesion: 10,
          pointsPerBase: 50,
          minBases: 0,
          maxBases: 1,
          minCountAllowed: 1,
          maxCountAllowed: 1,
          specialRules: ["Army General"],
          optionalEquipment: [],
        },
        {
          id: "welsh_king_or_prince",
          name: "King or Prince",
          description: "A subordinate commander. May ride a horse.",
          category: "commanders",
          type: "General",
          attacks: 3,
          cohesion: 9,
          pointsPerBase: 40,
          minBases: 0,
          maxBases: 1,
          specialRules: [],
          optionalEquipment: [],
        },
        {
          id: "welsh_local_prince",
          name: "Sub-King or Local Prince",
          description: "A minor commander. May ride a horse.",
          category: "commanders",
          type: "other",
          attacks: 2,
          cohesion: 8,
          pointsPerBase: 20,
          minBases: 0,
          maxBases: 1,
          specialRules: [],
          optionalEquipment: [],
        },
        {
          id: "welsh_teulu_cavalry",
          name: "Teulu Cavalry",
          description:
            "Light armour, spear and shield. Superior Fighters. May have javelins (+1).",
          category: "teulu",
          type: "other",
          excludes: ["welsh_skirmishers"],
          defence: 4,
          cohesion: 7,
          pointsPerBase: 20,
          minBases: 3,
          maxBases: 8,
          maxCountAllowed: 2,
          requires: { unitId: "welsh_over_king", count: 1, name: "Over King" },
          specialRules: ["Superior Fighters", "Open Order"],
          optionalEquipment: [
            {
              name: "Javelins",
              pointsModifier: 1,
              rulesAdded: [],
              rulesRemoved: [],
              defenceModifier: 0,
              cohesionModifier: 0,
            },
          ],
        },
        {
          id: "welsh_teulu_foot",
          name: "Teulu Foot",
          description:
            "Spear and shield. Superior Fighters. Open Order. Warband. May have light armour (+2). May ride horses (+2).",
          category: "teulu",
          type: "other",
          defence: 6,
          cohesion: 7,
          pointsPerBase: 15,
          minBases: 2,
          maxBases: 12,
          specialRules: ["Superior Fighters", "Open Order", "Warband"],
          baseEquipment: ["Spear", "Shield"],
          combinedFormation: [
            { label: "25%", disableSubProfiles: ["Champion"] },
            { label: "50%", disableSubProfiles: [] },
          ],
          subProfiles: [
            {
              name: "Warriors",
              attacks: 2,
              defence: 6,
              cohesion: 7,
              minBases: 1,
              maxBases: 10,
              minPercentage: 20,
              baseEquipment: ["Spear", "Shield"],
              specialRules: ["Superior Fighters", "Warband"],
            },
            {
              name: "Champion",
              attacks: 3,
              defence: 6,
              cohesion: 8,
              minBases: 0,
              maxBases: 6,
              minPercentage: 10,
              maxPercentage: 40,
              onBaseAdded: {
                trigger: "oneOrMore",
                apply: [
                  { type: "specialRule", name: "Warlord", target: "all" },
                  { type: "equipment", name: "Banner", target: "self" },
                ],
              },
              baseEquipment: ["Spear", "Shield"],
              specialRules: ["Superior Fighters", "Hero"],
            },
          ],
          optionalEquipment: [
            {
              name: "Champion's Great Weapon",
              pointsModifier: 5,
              targetProfile: "Champion",
              rulesAdded: ["Great Weapon"],
              rulesRemoved: [],
              equipmentAdded: ["Great Weapon"],
              equipmentRemoved: ["Spear"],
              attacksModifier: 1,
              defenceModifier: 0,
              cohesionModifier: 0,
            },
            {
              name: "Light Armour",
              pointsModifier: 2,
              rulesAdded: [],
              rulesRemoved: [],
              equipmentAdded: ["Light Armour"],
              equipmentRemoved: [],
              maxUnits: 1,
              defenceModifier: -1,
              cohesionModifier: 0,
            },
            {
              name: "Throwing Spears",
              pointsModifier: 2,
              rulesAdded: [],
              rulesRemoved: [],
              equipmentAdded: ["Throwing Spears"],
              equipmentRemoved: ["Spear"],
              disables: ["Riding Horses"],
              applyToAllUnits: true,
              defenceModifier: 0,
              cohesionModifier: 0,
            },
            {
              name: "Riding Horses",
              pointsModifier: 2,
              rulesAdded: ["Riding Horses"],
              rulesRemoved: [],
              equipmentAdded: ["Warhorse"],
              equipmentRemoved: [],
              disables: ["Throwing Spears"],
              enableHidden: ["Warhorse Barding"],
              defenceModifier: 0,
              cohesionModifier: 0,
            },
            {
              name: "Warhorse Barding",
              pointsModifier: 1,
              rulesAdded: [],
              rulesRemoved: [],
              equipmentAdded: ["Barding"],
              equipmentRemoved: [],
              hiddenUntilEnabled: "hidden",
              defenceModifier: -1,
              cohesionModifier: 0,
            },
          ],
          allowedSecondaryUnits: [
            {
              unitId: "welsh_att_skirmishers",
              name: "Attached Skirmishers",
              pointsPerBase: 4,
              minRatioPercent: 25,
              maxRatioPercent: 50,
              specialRules: ["Skirmishers"],
            },
            {
              unitId: "welsh_att_archers",
              name: "Attached Archers",
              pointsPerBase: 6,
              minRatioPercent: 33,
              maxRatioPercent: 75,
              specialRules: ["Open Order"],
            },
          ],
        },
        {
          id: "welsh_tenants_cavalry",
          name: "Tenant Cavalry",
          description:
            "Spear and shield. Evade. May be fielded as Skirmishers, replacing spear with javelins (-2).",
          category: "tenants",
          type: "other",
          defence: 5,
          cohesion: 6,
          pointsPerBase: 18,
          minBases: 3,
          maxBases: 8,
          specialRules: ["Evade", "Open Order"],
          optionalEquipment: [
            {
              name: "Skirmishers",
              pointsModifier: -2,
              rulesAdded: ["Skirmishers"],
              rulesRemoved: ["Open Order"],
              defenceModifier: 0,
              cohesionModifier: 0,
            },
          ],
        },
        {
          id: "welsh_tenants_spearmen",
          name: "Tenant Foot Spearmen",
          description: "Spear and shield. Open Order. Warband. May ride horses (+1).",
          category: "tenants",
          type: "other",
          defence: 6,
          cohesion: 5,
          pointsPerBase: 9,
          minBases: 3,
          maxBases: 12,
          requires: { self: true, count: 2, name: "Tenant Foot Spearmen" },
          specialRules: ["Warband", "Open Order"],
          optionalEquipment: [
            {
              name: "Riding Horses",
              pointsModifier: 1,
              rulesAdded: ["Riding Horses"],
              rulesRemoved: [],
              enabledEvery: 2,
              defenceModifier: 0,
              cohesionModifier: 0,
            },
          ],
        },
        {
          id: "welsh_tenants_archers",
          name: "Tenant Foot Archers",
          description:
            "Bow. Open Order. Warband. May be fielded as Skirmishers (-3). May ride horses (+1).",
          category: "tenants",
          type: "other",
          defence: 7,
          cohesion: 5,
          pointsPerBase: 8,
          minBases: 3,
          maxBases: 12,
          specialRules: ["Open Order", "Warband"],
          optionalEquipment: [
            {
              name: "Riding Horses",
              pointsModifier: 1,
              rulesAdded: ["Riding Horses"],
              rulesRemoved: [],
              defenceModifier: 0,
              cohesionModifier: 0,
            },
            {
              name: "Skirmishers",
              pointsModifier: -3,
              rulesAdded: ["Skirmishers"],
              rulesRemoved: ["Open Order"],
              defenceModifier: 0,
              cohesionModifier: 0,
            },
            {
              name: "War Banner",
              pointsModifier: 5,
              rulesAdded: ["War Banner"],
              rulesRemoved: [],
              defenceModifier: 0,
              cohesionModifier: 0,
              // fixed threshold: only if at least 2 Tenant Foot Spearmen are present
              enabledWhenUnitsPresent: {
                unitId: "welsh_tenants_spearmen",
                count: 2,
                name: "Tenant Foot Spearmen",
              },
            },
            {
              name: "Marksman",
              pointsModifier: 3,
              rulesAdded: ["Marksman"],
              rulesRemoved: [],
              defenceModifier: 0,
              cohesionModifier: 0,
              // ratio: 1 Marksman per 2 Tenant Foot Spearmen in the roster
              enabledWhenUnitsPresent: {
                unitId: "welsh_tenants_spearmen",
                count: 2,
                name: "Tenant Foot Spearmen",
                perUnit: true,
              },
            },
          ],
        },
        {
          id: "welsh_skirmishers",
          name: "Skirmishers",
          description: "Javelins. Skirmishers. Inferior Fighters.",
          category: "skirmishers",
          type: "other",
          defence: 7,
          cohesion: 5,
          pointsPerBase: 4,
          minBases: 2,
          maxBases: 6,
          requires: {
            unitId: ["welsh_teulu_foot", "welsh_teulu_cavalry"],
            count: 2,
            name: "Teulu (Foot or Cavalry)",
            perUnit: true,
          },
          specialRules: ["Inferior Fighters", "Skirmishers"],
          optionalEquipment: [],
        },
      ],
    },

    vikings: {
      armyName: "Vikings (790 AD - 1085 AD)",
      categories: [
        { id: "commanders", name: "Commanders", constraintType: "count", min: 1, max: 6 },
        { id: "hird", name: "Hird", constraintType: "percentage", min: 0, max: 60 },
        { id: "bondi", name: "Bondi", constraintType: "percentage", min: 0, max: 75 },
        { id: "skirmishers", name: "Skirmishers", constraintType: "percentage", min: 0, max: 10 },
        {
          id: "allies",
          name: "Allied Contingents",
          constraintType: "percentage",
          min: 0,
          max: 20,
          alliedArmyKeys: ["anglo_danish"],
          maxAlliedArmiesAllowed: 1,
        },
      ],
      units: [
        {
          id: "viking_jarl",
          name: "Jarl",
          description: "Army general. Fights on foot.",
          category: "commanders",
          type: "General",
          attacks: 3,
          cohesion: 10,
          pointsPerBase: 50,
          minBases: 0,
          maxBases: 1,
          specialRules: ["Army General"],
          optionalEquipment: [],
        },
        {
          id: "viking_hersir",
          name: "Hersir",
          description: "A subordinate commander.",
          category: "commanders",
          type: "other",
          attacks: 2,
          cohesion: 8,
          pointsPerBase: 25,
          minBases: 0,
          maxBases: 1,
          specialRules: [],
          optionalEquipment: [],
        },
        {
          id: "viking_hirdmen",
          name: "Hirdmen",
          description:
            "Armoured warriors with Dane axe or spear. Superior Fighters. May be Berserkers (+2).",
          category: "hird",
          type: "other",
          defence: 4,
          cohesion: 8,
          pointsPerBase: 18,
          minBases: 4,
          maxBases: 12,
          specialRules: ["Superior Fighters", "Shieldwall"],
          optionalEquipment: [
            {
              name: "Berserkers",
              pointsModifier: 2,
              rulesAdded: ["Frenzy"],
              rulesRemoved: ["Shieldwall"],
              defenceModifier: 1,
              cohesionModifier: 0,
            },
          ],
        },
        {
          id: "viking_bondi",
          name: "Bondi",
          description: "Freemen with spear and shield. Warband.",
          category: "bondi",
          type: "other",
          defence: 5,
          cohesion: 6,
          pointsPerBase: 8,
          minBases: 4,
          maxBases: 16,
          specialRules: ["Warband", "Shieldwall"],
          optionalEquipment: [],
        },
        {
          id: "viking_bowmen",
          name: "Bowmen Skirmishers",
          description: "Bow. Skirmishers.",
          category: "skirmishers",
          type: "other",
          defence: 7,
          cohesion: 5,
          pointsPerBase: 5,
          minBases: 2,
          maxBases: 6,
          specialRules: ["Skirmishers"],
          optionalEquipment: [],
        },
      ],
    },

    anglo_danish: {
      armyName: "Anglo-Danish (1017 AD - 1071 AD)",
      categories: [
        { id: "commanders", name: "Commanders", constraintType: "count", min: 1, max: 6 },
        { id: "huscarls", name: "Huscarls", constraintType: "percentage", min: 0, max: 50 },
        { id: "fyrd", name: "Fyrd", constraintType: "percentage", min: 0, max: 80 },
        { id: "skirmishers", name: "Skirmishers", constraintType: "percentage", min: 0, max: 10 },
      ],
      units: [
        {
          id: "ad_earl",
          name: "Earl",
          description: "Army general. Fights on foot.",
          category: "commanders",
          type: "General",
          attacks: 3,
          cohesion: 10,
          pointsPerBase: 50,
          minBases: 0,
          maxBases: 1,
          specialRules: ["Army General"],
          optionalEquipment: [],
        },
        {
          id: "ad_thegn",
          name: "Thegn",
          description: "A subordinate commander.",
          category: "commanders",
          type: "other",
          attacks: 2,
          cohesion: 8,
          pointsPerBase: 25,
          minBases: 0,
          maxBases: 1,
          specialRules: [],
          optionalEquipment: [],
        },
        {
          id: "ad_huscarls",
          name: "Huscarls",
          description: "Elite Dane axe warriors. Superior Fighters. Shieldwall.",
          category: "huscarls",
          type: "other",
          defence: 3,
          cohesion: 9,
          pointsPerBase: 22,
          minBases: 4,
          maxBases: 10,
          specialRules: ["Superior Fighters", "Shieldwall"],
          optionalEquipment: [],
        },
        {
          id: "ad_select_fyrd",
          name: "Select Fyrd",
          description: "Spear and shield. Shieldwall. May have light armour (+2).",
          category: "fyrd",
          type: "other",
          defence: 5,
          cohesion: 6,
          pointsPerBase: 9,
          minBases: 4,
          maxBases: 16,
          specialRules: ["Shieldwall"],
          optionalEquipment: [
            {
              name: "Light Armour",
              pointsModifier: 2,
              rulesAdded: [],
              rulesRemoved: [],
              defenceModifier: -1,
              cohesionModifier: 0,
            },
          ],
        },
        {
          id: "ad_slingers",
          name: "Slingers",
          description: "Slings. Skirmishers.",
          category: "skirmishers",
          type: "other",
          defence: 7,
          cohesion: 5,
          pointsPerBase: 4,
          minBases: 2,
          maxBases: 6,
          specialRules: ["Skirmishers"],
          optionalEquipment: [],
        },
      ],
    },
  },
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now());

const isSkirmRule = (r) => /skirmish/i.test(String(r));

/* Army Break Point — per-unit Break Points (BP). Only ACTIVE (toggled-on)
   rules are considered. The Open/Close Order/Wagon, Skirmisher, and Artillery
   categories are mutually exclusive in practice, so the first match wins. */
function unitBreakPoints(inst, calc) {
  const activeRules = new Set(
    [
      ...(calc.rules || []),
      ...((calc.profiles || []).flatMap((p) => p.rules || [])),
    ].map((r) => String(r).trim().toLowerCase())
  );
  const has = (name) => activeRules.has(name.toLowerCase());
  const pts = calc.total;
  const bases = calc.mainBases;
  if (has("Open Order") || has("Close Order") || has("Wagon") || has("Wagon Tabor")) {
    return pts <= 150 ? 2 : 3;
  }
  if (calc.isSkirm && bases >= 4) return 1;
  const type = String(inst.type || "").trim().toLowerCase();
  if (
    ["light artillery", "multi-barrelled artillery", "mortars"].includes(type) &&
    bases >= 2
  ) {
    return pts <= 150 ? 2 : 3;
  }
  return 0;
}

/* Drop any equipped option that is hidden and no longer revealed by another
   equipped option (cascades). Used when a reveal source is deselected. */
function pruneHidden(optionalEquipment, equipped) {
  let cur = [...equipped];
  let changed = true;
  while (changed) {
    changed = false;
    const revealed = new Set(
      cur
        .map((n) => optionalEquipment.find((e) => e.name === n))
        .filter(Boolean)
        .flatMap((e) => e.enableHidden || [])
    );
    const next = cur.filter((name) => {
      const e = optionalEquipment.find((x) => x.name === name);
      return e?.hiddenUntilEnabled !== "hidden" || revealed.has(name);
    });
    if (next.length !== cur.length) {
      cur = next;
      changed = true;
    }
  }
  return cur;
}

/* Coerce values like "+3", "-8", " 5 " to real numbers; leaves null/undefined alone. */
const num = (v) => {
  if (typeof v === "number") return v;
  if (v == null || v === "") return v;
  const n = Number(String(v).trim().replace(/^\+/, ""));
  return Number.isNaN(n) ? v : n;
};

/* Normalize a parsed dataset: coerce string-typed numeric fields so the app's
   math works even when the source JSON wraps numbers in quotes (e.g. "+3"). */
function normalizeData(data) {
  if (!data || !data.armies) return data;
  Object.values(data.armies).forEach((army) => {
    (army.categories || []).forEach((c) => {
      c.min = num(c.min);
      c.max = num(c.max);
      if (c.maxAlliedArmiesAllowed != null) c.maxAlliedArmiesAllowed = num(c.maxAlliedArmiesAllowed);
      if (Array.isArray(c.alliedArmyKeys)) {
        army._allyDisables = army._allyDisables || {};
        c.alliedArmyKeys = c.alliedArmyKeys.map((entry) => {
          if (entry && typeof entry === "object") {
            const key = entry.key ?? entry.armyKey ?? entry.id;
            const dis = Array.isArray(entry.disables)
              ? entry.disables
              : entry.disables
              ? [entry.disables]
              : [];
            if (key && dis.length) army._allyDisables[key] = dis;
            // capture per-ally unit availability filters (onlyUnits / excludesUnits)
            const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
            const only = toArr(entry.onlyUnits);
            const excl = toArr(entry.excludesUnits);
            if (key && (only.length || excl.length)) {
              c._allyUnitFilter = c._allyUnitFilter || {};
              c._allyUnitFilter[key] = { onlyUnits: only, excludesUnits: excl };
            }
            // capture optional supplement source for this allied army
            if (key && entry.supplement) {
              c._allySupplement = c._allySupplement || {};
              c._allySupplement[key] = entry.supplement;
            }
            // capture optional conditional-display rules for this allied army
            if (key && entry.conditions && typeof entry.conditions === "object") {
              c._allyConditions = c._allyConditions || {};
              c._allyConditions[key] = entry.conditions;
            }
            return key;
          }
          return entry;
        });
      }
    });
    (army.units || []).forEach((u) => {
      ["attacks", "defence", "cohesion", "pointsPerBase", "minBases", "maxBases"].forEach((k) => {
        if (u[k] != null) u[k] = num(u[k]);
      });
      (u.optionalEquipment || []).forEach((e) => {
        ["pointsModifier", "defenceModifier", "cohesionModifier"].forEach((k) => {
          if (e[k] != null) e[k] = num(e[k]);
        });
      });
    });
  });
  return data;
}

const isCommanderCat = (id) => String(id).toLowerCase() === "commanders";
const isAlliesCat = (id) => String(id).toLowerCase() === "allies";

/* Make JSON parsing tolerant of JSONC: strips // line + /* block comments and
   trailing commas. String-aware so it never touches // or commas inside quoted
   values (e.g. "https://..." in a description). */
function stripJsonc(text) {
  let out = "";
  let inStr = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inStr) {
      out += c;
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      out += c;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++; // skip closing '/'
      continue;
    }
    out += c;
  }
  // remove trailing commas before } or ]
  return out.replace(/,(\s*[}\]])/g, "$1");
}

/* "pointsRatio": max units in a category = (maxPoints / pointsThreshold) *
   countPerThreshold, rounded per the "rounding" field, then + countOffset
   (optional +/- integer). Never below 1. */
function pointsRatioMax(cat, maxPoints) {
  const threshold = cat.pointsThreshold || 1;
  const per = cat.countPerThreshold ?? 1;
  const raw = (maxPoints / threshold) * per;
  let n = cat.rounding === "up" ? Math.ceil(raw) : Math.floor(raw);
  n += cat.countOffset ?? 0;
  return Math.max(1, n);
}

/* Scale a unit's maxCountAllowed with the army points limit: a base of 2+ gains
   +1 for every full or partial 1000 pts above the initial 1000. A base of 1 (or
   null) never scales. */
function effectiveMaxCount(base, maxPoints) {
  if (base == null || base <= 1) return base;
  const extra = maxPoints > 1000 ? Math.ceil((maxPoints - 1000) / 1000) : 0;
  return base + extra;
}

/* maxPerPointsLimit: max copies of a unit = army max points / pointsThreshold,
   rounded by the rule's `rounding` ("floor" default, or "ceil"). Returns null
   when the rule is absent or malformed. */
function maxPerPointsCap(rule, maxPoints) {
  if (!rule || rule.pointsThreshold == null || rule.pointsThreshold <= 0) return null;
  const raw = maxPoints / rule.pointsThreshold;
  return rule.rounding === "ceil" ? Math.ceil(raw) : Math.floor(raw);
}

/* Conditional-display test for an allied army entry's optional `conditions`:
   - requiresUnits: ally shows only if these unit ids are in the roster
     (requiresUnitsLogic "OR" = any present, default "AND" = all present).
   - excludesIfUnits: ally is hidden if these unit ids are in the roster
     (excludesIfUnitsLogic "OR" = any present hides, default "AND" = all present).
   Absent conditions → always shown. */
function allyConditionsMet(cond, rosterCounts) {
  if (!cond || typeof cond !== "object") return true;
  const present = (id) => (rosterCounts?.[id] || 0) > 0;
  const req = Array.isArray(cond.requiresUnits) ? cond.requiresUnits : [];
  if (req.length) {
    const logic = String(cond.requiresUnitsLogic || "AND").toUpperCase();
    const ok = logic === "OR" ? req.some(present) : req.every(present);
    if (!ok) return false;
  }
  const exc = Array.isArray(cond.excludesIfUnits) ? cond.excludesIfUnits : [];
  if (exc.length) {
    const logic = String(cond.excludesIfUnitsLogic || "AND").toUpperCase();
    const hide = logic === "OR" ? exc.some(present) : exc.every(present);
    if (hide) return false;
  }
  return true;
}

/* Category max-count scaling: the "Commanders" category gets +50% (rounded) to
   its base max when the army points limit is between 2001 and 3000. */
function effectiveCatMax(cat, maxPoints) {
  if (cat.max == null) return cat.max;
  if (isCommanderCat(cat.id) && maxPoints >= 2001 && maxPoints <= 3000) {
    return Math.round(cat.max * 1.5);
  }
  return cat.max;
}



function makeInstance(unit, sourceArmyKey, categoryOverride) {
  const subs = Array.isArray(unit.subProfiles) ? unit.subProfiles.map(readSubProfile) : [];
  // A unit is in "sub-unit bases" mode when any sub-profile defines its own min/max bases.
  const hasSubBases = subs.some((s) => s.minBases != null || s.maxBases != null);
  const sumSubMin = subs.reduce((s, x) => s + (x.minBases ?? 0), 0);
  const sumSubMax = subs.reduce((s, x) => s + (x.maxBases ?? 0), 0);
  return {
    instanceId: uid(),
    unitId: unit.id,
    sourceArmyKey,
    categoryId: categoryOverride || unit.category || (unit.type === "General" ? "commanders" : "other"),
    sourceCategory: unit.category ?? null,
    name: unit.name,
    type: unit.type,
    description: unit.description || "",
    attacks: unit.attacks,
    baseDefence: unit.defence ?? null,
    baseCohesion: unit.cohesion ?? null,
    basePointsPerBase: unit.pointsPerBase || 0,
    minBases: unit.minBases ?? 0,
    maxBases: unit.maxBases ?? 1,
    bases: Math.max(unit.minBases ?? 0, 1),
    specialRules: Array.isArray(unit.specialRules) ? [...unit.specialRules] : [],
    baseEquipment: Array.isArray(unit.baseEquipment) ? [...unit.baseEquipment] : [],
    optionalEquipment: Array.isArray(unit.optionalEquipment) ? unit.optionalEquipment.map(readOption) : [],
    subProfiles: subs,
    combinedFormation: Array.isArray(unit.combinedFormation) && unit.combinedFormation.length ? unit.combinedFormation : null,
    combinedFormationIndex: 0,
    subBases: hasSubBases ? subs.map((s) => (s.minBases != null ? s.minBases : 0)) : null,
    // combined-total clamp: main unit min/max if defined, else the sum of sub-unit limits
    combinedMin: hasSubBases ? (unit.minBases != null ? unit.minBases : sumSubMin) : null,
    combinedMax: hasSubBases ? (unit.maxBases != null ? unit.maxBases : sumSubMax) : null,
    equipped: [],
    allowedSecondaryUnits: Array.isArray(unit.allowedSecondaryUnits) ? unit.allowedSecondaryUnits : [],
    secondaryUnitId: null,
    secondaryRatio: null,
    minCountAllowed: unit.minCountAllowed ?? null,
    maxCountAllowed: unit.maxCountAllowed ?? null,
    maxPerPointsLimit: unit.maxPerPointsLimit ?? null,
    basesComparison: unit.basesComparison ?? null,
    requires: normalizeRequires(unit.requires, unit.id),
  };
}

/* Normalize a unit's "requires" into an array of
   { unitIds, count, countPerUnit, name, perUnit, self }.
   - unitIds: from `unitIds` (array) or legacy `unitId` (string/array); `self` → [selfId].
   - count: legacy fixed minimum (default 1).
   - countPerUnit: new per-instance requirement — this many units from `unitIds` per
     instance of the requiring unit (any combination counts). null when unused.
   - name: friendly label. Accepts an array (matching unitIds order, joined with " or ")
     or a string; falls back to the unit ids. */
function normalizeRequires(req, selfId) {
  if (!req) return [];
  const arr = Array.isArray(req) ? req : [req];
  return arr
    .filter((r) => r && (r.unitIds || r.unitId || r.self))
    .map((r) => {
      const rawIds = r.unitIds ?? r.unitId;
      const unitIds = r.self ? [selfId] : Array.isArray(rawIds) ? rawIds : [rawIds];
      const name = Array.isArray(r.name)
        ? r.name.join(" or ")
        : r.name || (r.self ? "this unit" : unitIds.join(", "));
      return {
        unitIds,
        count: r.count ?? 1,
        countPerUnit: r.countPerUnit ?? null,
        name,
        perUnit: !!r.perUnit,
        self: !!r.self,
      };
    });
}

const GLOBAL_RATIOS = [25, 33, 50, 67, 75];

/* Read a sub-profile's stats, tolerating several key spellings (A/attacks,
   C/combat, D/defence, Coh/cohesion). */
const pickStat = (obj, keys) => {
  for (const k of keys) if (obj[k] != null) return obj[k];
  return null;
};
/* Comparison expressions for sub-profile cross-constraints (compareWithSubProfile).
   Evaluates: this subunit's bases [expr] (target subunit's bases * ratio). */
const SUB_COMPARE_EXPR = {
  lessThanOrEqual: (a, b) => a <= b,
  lessThan: (a, b) => a < b,
  greaterThanOrEqual: (a, b) => a >= b,
  greaterThan: (a, b) => a > b,
  equalTo: (a, b) => a === b,
};

function readSubProfile(sp) {
  const arr = (v) => (Array.isArray(v) ? [...v] : v ? [v] : []);
  const src = sp.stats && typeof sp.stats === "object" ? { ...sp, ...sp.stats } : sp;
  return {
    name: sp.name || sp.profileName || "Profile",
    id: sp.id ?? null,
    onBaseAdded: sp.onBaseAdded || null,
    pointsPerBase: pickStat(sp, ["pointsPerBase", "ppb", "points", "pts"]),
    minBases: pickStat(sp, ["minBases", "minBase"]),
    maxBases: pickStat(sp, ["maxBases", "maxBase"]),
    maxPercentage: pickStat(sp, ["maxPercentage", "maxPct", "maxPercent"]),
    minPercentage: pickStat(sp, ["minPercentage", "minPct", "minPercent"]),
    compareWithSubProfile: sp.compareWithSubProfile || null,
    attacks: pickStat(src, ["attacks", "A", "a"]),
    defence: pickStat(src, ["defence", "defense", "D", "d"]),
    cohesion: pickStat(src, ["cohesion", "C", "c", "Coh", "coh", "combat"]),
    baseEquipment: arr(sp.baseEquipment ?? sp.equipment ?? sp.weapons),
    specialRules: arr(sp.specialRules ?? sp.rules ?? sp.specialRule),
  };
}

/* Normalize an optional-equipment entry, tolerating both the flat schema
   (pointsModifier / defenceModifier / cohesionModifier / attacksModifier) and
   the nested schema (pointsPerBase for cost + statChanges: { defence, ... }). */
/* An option applies to a sub-profile row when it is untargeted, or its
   `targetProfile` (string OR array of strings) names that profile. */
function optionTargetsProfile(e, profileName) {
  if (e.targetProfile == null) return true;
  const list = Array.isArray(e.targetProfile) ? e.targetProfile : [e.targetProfile];
  return list.includes(profileName);
}

function readOption(e) {
  const sc = e.statChanges && typeof e.statChanges === "object" ? e.statChanges : {};
  const g = (obj, keys) => {
    for (const k of keys) if (obj[k] != null) return Number(obj[k]);
    return undefined;
  };
  return {
    ...e,
    pointsModifier:
      e.pointsModifier != null
        ? Number(e.pointsModifier)
        : e.pointsPerBase != null
        ? Number(e.pointsPerBase)
        : 0,
    attacksModifier: e.attacksModifier != null ? Number(e.attacksModifier) : g(sc, ["attacks", "A", "a"]),
    defenceModifier: e.defenceModifier != null ? Number(e.defenceModifier) : g(sc, ["defence", "defense", "D", "d"]),
    cohesionModifier: e.cohesionModifier != null ? Number(e.cohesionModifier) : g(sc, ["cohesion", "C", "c", "Coh", "coh"]),
  };
}

/* Valid ratio options for a secondary unit, inclusive of its min/max bounds */
const ratiosFor = (su) =>
  GLOBAL_RATIOS.filter(
    (r) => r >= (su.minRatioPercent ?? 0) && r <= (su.maxRatioPercent ?? 100)
  );

/* Derive live stats for a roster instance */
function computeUnit(inst) {
  const active = inst.optionalEquipment.filter((e) => inst.equipped.includes(e.name));
  const ppb =
    inst.basePointsPerBase + active.reduce((s, e) => s + (e.pointsModifier || 0), 0);
  const defence =
    inst.baseDefence != null
      ? inst.baseDefence + active.reduce((s, e) => s + (e.defenceModifier || 0), 0)
      : null;
  const cohesion =
    inst.baseCohesion != null
      ? inst.baseCohesion + active.reduce((s, e) => s + (e.cohesionModifier || 0), 0)
      : null;

  let rules = [...inst.specialRules];
  active.forEach((e) => {
    (e.rulesRemoved || []).forEach((r) => {
      rules = rules.filter((x) => x !== r);
    });
    (e.rulesAdded || []).forEach((r) => {
      if (!rules.includes(r)) rules.push(r);
    });
  });

  let equipment = [...inst.baseEquipment];
  active.forEach((e) => {
    (e.equipmentRemoved || []).forEach((x) => {
      equipment = equipment.filter((i) => i !== x);
    });
    (e.equipmentAdded || []).forEach((x) => {
      if (!equipment.includes(x)) equipment.push(x);
    });
  });

  const isSkirm = rules.some(isSkirmRule);

  const hasSubBases =
    Array.isArray(inst.subBases) &&
    (inst.subProfiles || []).some((s) => s.minBases != null || s.maxBases != null);

  /* Per-sub-profile rows. Untargeted (general) active options apply to every
     profile; options with a matching targetProfile apply only to that row.
     Points from every active option are still summed into the unit total. */
  let profiles = (inst.subProfiles || []).map((sp, idx) => {
    const applies = active.filter((e) => optionTargetsProfile(e, sp.name));
    const sum = (key) => applies.reduce((s, e) => s + (e[key] || 0), 0);
    const attacks = sp.attacks != null ? sp.attacks + sum("attacksModifier") : null;
    const defence = sp.defence != null ? sp.defence + sum("defenceModifier") : null;
    const cohesion = sp.cohesion != null ? sp.cohesion + sum("cohesionModifier") : null;
    /* per-profile points: own pts/base (fallback to unit's) + targeted option pts */
    const ptsBase = sp.pointsPerBase != null ? sp.pointsPerBase : inst.basePointsPerBase;
    const ownPts = sp.pointsPerBase != null;
    const ptsOptions = sum("pointsModifier");
    const totalPer = ptsBase + ptsOptions;
    // in sub-unit mode each profile has its own base count; otherwise it shares the unit's
    const pBases = hasSubBases ? (inst.subBases[idx] ?? (sp.minBases ?? 0)) : inst.bases;
    const ptsUnit = totalPer * pBases;
    let pRules = [...sp.specialRules];
    let pEquip = [...sp.baseEquipment];
    applies.forEach((e) => {
      (e.rulesRemoved || []).forEach((r) => (pRules = pRules.filter((x) => x !== r)));
      (e.rulesAdded || []).forEach((r) => !pRules.includes(r) && pRules.push(r));
      (e.equipmentRemoved || []).forEach((x) => (pEquip = pEquip.filter((i) => i !== x)));
      (e.equipmentAdded || []).forEach((x) => !pEquip.includes(x) && pEquip.push(x));
    });
    return {
      name: sp.name,
      id: sp.id,
      origIdx: idx,
      onBaseAdded: sp.onBaseAdded,
      attacks,
      defence,
      cohesion,
      ptsBase,
      ownPts,
      ptsOptions,
      total: totalPer,
      bases: pBases,
      minBases: sp.minBases,
      maxBases: sp.maxBases,
      maxPercentage: sp.maxPercentage,
      minPercentage: sp.minPercentage,
      compareWithSubProfile: sp.compareWithSubProfile,
      ptsUnit,
      rules: pRules,
      equipment: pEquip,
    };
  });

  /* combinedFormation: the selected option hides the named sub-profiles entirely
     (removed from `profiles` before any totals/rules/equipment are derived). */
  let combinedFormationDisabled = [];
  {
    const cf = inst.combinedFormation;
    if (Array.isArray(cf) && cf.length) {
      const opt = cf[Math.min(inst.combinedFormationIndex || 0, cf.length - 1)];
      combinedFormationDisabled = Array.isArray(opt?.disableSubProfiles) ? opt.disableSubProfiles : [];
      if (combinedFormationDisabled.length) {
        const hide = new Set(combinedFormationDisabled);
        profiles = profiles.filter((p) => !hide.has(p.name));
      }
    }
  }

  /* onBaseAdded: when a sub-unit has >= 1 base, add its configured rules/equipment
     to the target sub-unit(s). Recomputed each render, so dropping to 0 bases
     automatically removes them. target: "self" | "all" | <sub-unit name or id>. */
  profiles.forEach((p) => {
    const ob = p.onBaseAdded;
    if (!ob || (p.bases || 0) < 1) return;
    if ((ob.trigger || "oneOrMore") !== "oneOrMore") return;
    (ob.apply || []).forEach((item) => {
      if (!item || !item.name) return;
      const targets =
        item.target === "all"
          ? profiles
          : item.target == null || item.target === "self"
          ? [p]
          : profiles.filter((q) => q.name === item.target || q.id === item.target);
      targets.forEach((t) => {
        if (item.type === "equipment") {
          if (!t.equipment.includes(item.name)) t.equipment.push(item.name);
        } else {
          if (!t.rules.includes(item.name)) t.rules.push(item.name);
        }
      });
    });
  });
  const skirmFromProfiles = profiles.some((p) => p.rules.some(isSkirmRule));
  const isSkirmAll = isSkirm || skirmFromProfiles;
  const effMax = isSkirmAll ? Math.min(inst.maxBases, 6) : inst.maxBases;
  const effMin = isSkirmAll ? 2 : inst.minBases;

  // Secondary attachment
  let secondary = null;
  if (inst.secondaryUnitId && inst.secondaryRatio) {
    const su = (inst.allowedSecondaryUnits || []).find((s) => s.unitId === inst.secondaryUnitId);
    if (su) {
      let secBases = Math.round(inst.bases * (inst.secondaryRatio / 100));
      const secSkirm = (su.specialRules || []).some(isSkirmRule);
      if (secSkirm && secBases > 6) secBases = 6; // Skirmisher clamp
      const secPoints = secBases * (su.pointsPerBase || 0);
      // append secondary rules into the active rules block
      (su.specialRules || []).forEach((r) => {
        if (!rules.includes(r)) rules.push(r);
      });
      secondary = { unit: su, bases: secBases, points: secPoints, isSkirm: secSkirm };
    }
  }

  /* Unit cumulative per-base points. When sub-profiles carry their OWN
     pointsPerBase they are stacked components of one base (e.g. elephant +
     mahout + crew) → sum them. Otherwise (alternative stat-lines that fall back
     to the unit's pts/base) keep the unit-level figure. */
  const subHasOwn = profiles.length > 0 && profiles.some((p) => p.ownPts);
  let ppbBase = inst.basePointsPerBase;
  let ppbOptions = ppb - inst.basePointsPerBase;
  if (subHasOwn) {
    ppbBase = profiles.reduce((s, p) => s + p.ptsBase, 0);
    ppbOptions = profiles.reduce((s, p) => s + p.ptsOptions, 0);
  }
  const ppbTotal = ppbBase + ppbOptions;

  // In sub-unit mode the unit's base count and range are the sum across sub-units,
  // and the total is the sum of each sub-unit's own points.
  const mainBases = hasSubBases ? profiles.reduce((s, p) => s + p.bases, 0) : inst.bases;
  const subDispMin = hasSubBases ? (inst.combinedMin ?? profiles.reduce((s, p) => s + (p.minBases ?? 0), 0)) : effMin;
  const subDispMax = hasSubBases ? (inst.combinedMax ?? profiles.reduce((s, p) => s + (p.maxBases ?? p.bases), 0)) : effMax;

  const total =
    (hasSubBases
      ? profiles.reduce((s, p) => s + p.ptsUnit, 0)
      : ppbTotal * inst.bases) + (secondary ? secondary.points : 0);
  return { ppb, ppbBase, ppbOptions, ppbTotal, defence, cohesion, rules, equipment, isSkirm: isSkirmAll, effMax, effMin, hasSubBases, mainBases, subDispMin, subDispMax, total, active, secondary, profiles };
}

/* ------------------------------------------------------------------ */
/*  APP                                                                */
/* ------------------------------------------------------------------ */
function App() {
  const [data, setData] = useState(null);
  const [source, setSource] = useState("loading"); // 'remote' | 'mock'
  const [loadError, setLoadError] = useState("");
  const [reloading, setReloading] = useState(false);
  const [selectedArmyKey, setSelectedArmyKey] = useState("");
  const [maxPoints, setMaxPoints] = useState(1000);
  const [roster, setRoster] = useState([]);
  const [checkedAllies, setCheckedAllies] = useState([]); // allied army keys enabled
  const [selectedSupplementUrl, setSelectedSupplementUrl] = useState("");
  const [supplementsMeta, setSupplementsMeta] = useState([]); // [{key,name,file}] from supplements.json
  const [externalArmies, setExternalArmies] = useState({}); // armies fetched from other supplements for allies
  const externalCacheRef = useRef({}); // supplementKey -> armies map (fetched once)

  /* --- load data for a supplement url (remote with graceful fallback) --- */
  const loadData = async (url, opts = {}) => {
    if (!url) return;
    setReloading(true);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status + " fetching data file");
      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(stripJsonc(text));
      } catch (pe) {
        throw new Error("Remote file is not valid JSON/JSONC — " + pe.message);
      }
      if (!parsed || !parsed.armies || typeof parsed.armies !== "object")
        throw new Error("Parsed JSON has no valid `armies` object.");
      normalizeData(parsed);
      setData(parsed);
      setSource("remote");
      setLoadError("");
      if (opts.restore) {
        const s = opts.restore;
        setSelectedArmyKey(parsed.armies[s.armyKey] ? s.armyKey : "");
        setCheckedAllies(s.checkedAllies || []);
        setRoster(s.roster || []);
        if (s.maxPoints != null) setMaxPoints(s.maxPoints);
      } else if (opts.keepSelection && parsed.armies[selectedArmyKey]) {
        // keep current army selection on reload
      } else {
        // require an explicit army choice after loading a supplement
        setSelectedArmyKey("");
        setRoster([]);
        setCheckedAllies([]);
      }
    } catch (e) {
      setData(normalizeData(JSON.parse(JSON.stringify(MOCK_DATA))));
      setSource("mock");
      setLoadError(e.message || "Failed to load remote data.");
      if (opts.restore) {
        const s = opts.restore;
        setSelectedArmyKey(s.armyKey || "");
        setCheckedAllies(s.checkedAllies || []);
        setRoster(s.roster || []);
        if (s.maxPoints != null) setMaxPoints(s.maxPoints);
      } else {
        setSelectedArmyKey("");
        setRoster([]);
        setCheckedAllies([]);
      }
    } finally {
      setReloading(false);
    }
  };

  /* --- supplement switch: load its data, reset army + roster --- */
  const handleSupplementChange = (url) => {
    setSelectedSupplementUrl(url);
    setSelectedArmyKey("");
    setRoster([]);
    setCheckedAllies([]);
    setData(null);
    setLoadError("");
    if (url) loadData(url);
  };

  const armies = data?.armies || {};
  const army = selectedArmyKey ? armies[selectedArmyKey] : null;
  // allied armies may live in other supplements; merge external ones (current file wins on key clash)
  const allyArmies = useMemo(() => ({ ...externalArmies, ...armies }), [externalArmies, armies]);
  const supplementNames = useMemo(() => {
    const m = {};
    supplementsMeta.forEach((s) => { if (s && s.key) m[s.key] = s.name || s.key; });
    return m;
  }, [supplementsMeta]);

  // Background load of the supplements catalog on startup.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(BASE_DATA_URL + "supplements.json", { cache: "no-store" });
        if (!res.ok) return;
        const arr = JSON.parse(stripJsonc(await res.text()));
        if (Array.isArray(arr)) setSupplementsMeta(arr);
      } catch (err) {
        console.warn("Supplements catalog load failed (allies without an explicit supplement still work):", err);
      }
    })();
  }, []);

  // Prefetch any supplements referenced by the current army's allied entries.
  useEffect(() => {
    if (!army || !supplementsMeta.length) return;
    const needed = new Set();
    (army.categories || []).forEach((c) =>
      Object.values(c._allySupplement || {}).forEach((sk) => needed.add(sk))
    );
    const toFetch = [...needed].filter((sk) => !externalCacheRef.current[sk]);
    if (!toFetch.length) return;
    let cancelled = false;
    (async () => {
      for (const sk of toFetch) {
        const meta = supplementsMeta.find((s) => s.key === sk);
        if (!meta || !meta.file) continue;
        try {
          const res = await fetch(BASE_DATA_URL + meta.file, { cache: "no-store" });
          if (!res.ok) continue;
          const parsed = JSON.parse(stripJsonc(await res.text()));
          if (parsed && parsed.armies) {
            normalizeData(parsed);
            externalCacheRef.current[sk] = parsed.armies;
          }
        } catch (err) {
          console.warn(`Allied supplement "${sk}" fetch failed (skipped):`, err);
        }
      }
      if (cancelled) return;
      const merged = {};
      Object.values(externalCacheRef.current).forEach((am) => Object.assign(merged, am));
      setExternalArmies(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [army, supplementsMeta]);

  /* --- army switch: full state cleanup to avoid overlap logic bugs --- */
  const handleArmyChange = (key) => {
    setSelectedArmyKey(key);
    setRoster([]);
    setCheckedAllies([]);
  };

  /* --- Save the current roster to a JSON file on the user's device --- */
  const handleSaveArmy = () => {
    if (!army) {
      window.alert("Select an army first before saving.");
      return;
    }
    const name = window.prompt("Enter a name for this army:", data?.armyName || "My Army");
    if (!name) return;
    const payload = {
      _type: "swordpoint-army",
      name,
      supplementUrl: selectedSupplementUrl,
      supplementName: data?.supplement || "",
      armyKey: selectedArmyKey,
      maxPoints,
      checkedAllies,
      roster,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9-_ ]/gi, "_").trim() || "army"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* --- Load a saved army JSON file: restores supplement, army, roster --- */
  const fileInputRef = useRef(null);
  const handleLoadClick = () => fileInputRef.current?.click();
  const handleLoadFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let saved;
      try {
        saved = JSON.parse(reader.result);
      } catch {
        window.alert("Invalid army file — could not parse JSON.");
        return;
      }
      if (!saved || !Array.isArray(saved.roster)) {
        window.alert("This file does not look like a saved Swordpoint army.");
        return;
      }
      setSelectedSupplementUrl(saved.supplementUrl || "");
      if (saved.supplementUrl) {
        setData(null);
        loadData(saved.supplementUrl, { restore: saved });
      } else {
        // no supplement recorded — restore against fallback data
        setData(normalizeData(JSON.parse(JSON.stringify(MOCK_DATA))));
        setSource("mock");
        setSelectedArmyKey(saved.armyKey || "");
        setCheckedAllies(saved.checkedAllies || []);
        setRoster(saved.roster || []);
        if (saved.maxPoints != null) setMaxPoints(saved.maxPoints);
      }
    };
    reader.readAsText(file);
  };

  /* --- roster mutations --- */
  const addUnit = (unit, sourceArmyKey, categoryOverride) => {
    setRoster((prev) => [...prev, makeInstance(unit, sourceArmyKey, categoryOverride)]);
  };

  const updateInst = (instanceId, updater) => {
    setRoster((prev) =>
      prev.map((i) => (i.instanceId === instanceId ? updater(i) : i))
    );
  };

  const changeBases = (instanceId, delta) => {
    updateInst(instanceId, (i) => {
      const { effMax, effMin } = computeUnit(i);
      const lo = Math.max(effMin || 1, 1);
      const next = Math.min(Math.max(i.bases + delta, lo), effMax);
      return { ...i, bases: next };
    });
  };

  /* Adjust bases for a single sub-unit, clamped to its own min/max and its
     optional maxPercentage of the unit's total bases. */
  const changeFormation = (instanceId, index) => {
    updateInst(instanceId, (i) => ({ ...i, combinedFormationIndex: index }));
  };

  const changeSubBases = (instanceId, idx, delta) => {
    updateInst(instanceId, (i) => {
      const subs = i.subProfiles || [];
      const sp = subs[idx];
      if (!sp) return i;
      const arr = Array.isArray(i.subBases)
        ? [...i.subBases]
        : subs.map((s) => (s.minBases != null ? s.minBases : 0));
      const cur = arr[idx] ?? (sp.minBases != null ? sp.minBases : 0);
      const lo = sp.minBases ?? 0;
      const hi = sp.maxBases ?? 999;
      let next = Math.min(Math.max(cur + delta, lo), hi);
      // Exclude sub-profiles hidden by the current combinedFormation selection from
      // total calcs, so the handler matches the visible total used by the +/- buttons.
      const cf = i.combinedFormation;
      const hiddenNames =
        Array.isArray(cf) && cf.length
          ? new Set(cf[Math.min(i.combinedFormationIndex || 0, cf.length - 1)]?.disableSubProfiles || [])
          : new Set();
      const sumVisible = () =>
        arr.reduce(
          (s, v, j) => (hiddenNames.has(subs[j]?.name) ? s : s + (j === idx ? next : v)),
          0
        );
      const totalAfter = sumVisible();
      // combined-total clamp against the main unit's min/max
      if (delta > 0 && i.combinedMax != null && totalAfter > i.combinedMax) next = cur;
      if (delta < 0 && i.combinedMin != null && totalAfter < i.combinedMin) next = cur;
      // per-sub-unit percentage cap
      if (delta > 0 && sp.maxPercentage != null) {
        const after = sumVisible();
        if (after > 0 && (next / after) * 100 > sp.maxPercentage) {
          next = cur; // would breach the percentage cap — reject
        }
      }
      // per-sub-unit percentage floor
      if (delta < 0 && sp.minPercentage != null) {
        const after = sumVisible();
        const prop = after > 0 ? (next / after) * 100 : 0;
        if (prop < sp.minPercentage) {
          next = cur; // would drop below the percentage floor — reject
        }
      }
      // cross-constraint: compareWithSubProfile (this [expr] target*ratio) — never
      // blocks the target's own reduction, only this sub-unit's increment.
      if (delta > 0 && sp.compareWithSubProfile && sp.compareWithSubProfile.name) {
        const cw = sp.compareWithSubProfile;
        const tIdx = subs.findIndex((s) => s?.name === cw.name);
        const fn = SUB_COMPARE_EXPR[cw.expression];
        if (tIdx >= 0 && fn && !hiddenNames.has(cw.name)) {
          const targetBases = arr[tIdx] ?? 0;
          const bound = targetBases * (cw.ratio ?? 1);
          if (!fn(next, bound)) next = cur; // increment would breach — reject
        }
      }
      arr[idx] = next;
      return { ...i, subBases: arr };
    });
  };

  const toggleEquipment = (instanceId, equipName) => {
    setRoster((prev) => {
      const target = prev.find((i) => i.instanceId === instanceId);
      if (!target) return prev;
      const nextOn = !target.equipped.includes(equipName); // desired state after this click
      const def = target.optionalEquipment.find((e) => e.name === equipName);
      const applyAll = !!def?.applyToAllUnits;

      /* Force a single instance into the desired equipped state for equipName,
         reapplying per-unit disables / hidden-pruning / skirmisher clamps. */
      const setState = (i) => {
        const has = i.equipped.includes(equipName);
        let equipped;
        if (nextOn && !has) {
          const item = i.optionalEquipment.find((e) => e.name === equipName);
          const disables = item?.disables || [];
          equipped = [...i.equipped.filter((n) => !disables.includes(n)), equipName];
        } else if (!nextOn && has) {
          equipped = i.equipped.filter((n) => n !== equipName);
        } else {
          return i; // already in desired state
        }
        equipped = pruneHidden(i.optionalEquipment, equipped);
        let next = { ...i, equipped };
        const { isSkirm, effMax, effMin } = computeUnit(next);
        if (isSkirm && next.bases > 6) next = { ...next, bases: 6 };
        if (next.bases > effMax) next = { ...next, bases: effMax };
        if (next.bases < effMin) next = { ...next, bases: effMin };
        return next;
      };

      return prev.map((i) => {
        if (i.instanceId === instanceId) return setState(i);
        // roster-wide sync for options flagged applyToAllUnits
        if (
          applyAll &&
          i.unitId === target.unitId &&
          i.optionalEquipment.some((e) => e.name === equipName)
        ) {
          return setState(i);
        }
        return i;
      });
    });
  };

  const setSecondaryUnit = (instanceId, unitId) => {
    updateInst(instanceId, (i) => {
      if (!unitId) return { ...i, secondaryUnitId: null, secondaryRatio: null };
      const su = (i.allowedSecondaryUnits || []).find((s) => s.unitId === unitId);
      const opts = su ? ratiosFor(su) : [];
      return { ...i, secondaryUnitId: unitId, secondaryRatio: opts[0] ?? null };
    });
  };

  const setSecondaryRatio = (instanceId, ratio) => {
    updateInst(instanceId, (i) => ({ ...i, secondaryRatio: ratio ? Number(ratio) : null }));
  };

  const duplicateUnit = (instanceId) => {
    setRoster((prev) => {
      const idx = prev.findIndex((i) => i.instanceId === instanceId);
      if (idx === -1) return prev;
      const src = prev[idx];
      // count equipment usage across all units of the same id (includes source)
      const usage = {};
      prev.forEach((i) => {
        if (i.unitId === src.unitId)
          i.equipped.forEach((n) => {
            usage[n] = (usage[n] || 0) + 1;
          });
      });
      // drop any equipment on the clone that would exceed its limit
      let cloneEquipped = src.equipped.filter((name) => {
        const opt = src.optionalEquipment.find((e) => e.name === name);
        const lim = opt ? opt.maxEquipmentCount ?? opt.maxUnits : null;
        return !(lim != null && (usage[name] || 0) >= lim);
      });
      // Re-evaluate conditional reveals: a `hiddenUntilEnabled: "hidden"` option
      // may only stay selected if a still-selected option's `enableHidden`
      // reveals it. Iterate to a fixpoint so reveal chains collapse correctly
      // (e.g. Light Armour at maxUnits is dropped → its unlocked Shock Cavalry
      // must also be dropped/hidden on the duplicate).
      const optDefs = src.optionalEquipment || [];
      for (let pass = 0; pass <= optDefs.length; pass++) {
        const revealed = new Set(
          cloneEquipped.flatMap(
            (n) => optDefs.find((e) => e.name === n)?.enableHidden || []
          )
        );
        const pruned = cloneEquipped.filter((n) => {
          const def = optDefs.find((e) => e.name === n);
          if (!def || def.hiddenUntilEnabled !== "hidden") return true;
          return revealed.has(n);
        });
        if (pruned.length === cloneEquipped.length) break;
        cloneEquipped = pruned;
      }
      const clone = {
        ...src,
        equipped: cloneEquipped,
        instanceId: uid(),
      }; // secondaryUnitId + secondaryRatio copied via spread
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  };

  const moveUnit = (instanceId, dir) => {
    setRoster((prev) => {
      const idx = prev.findIndex((i) => i.instanceId === instanceId);
      const swap = idx + dir;
      if (idx === -1 || swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const removeUnit = (instanceId) => {
    setRoster((prev) => prev.filter((i) => i.instanceId !== instanceId));
  };

  /* --- allied army toggle --- */
  const alliesCategory = army?.categories?.find((c) => Array.isArray(c.alliedArmyKeys));
  const maxAllies = alliesCategory?.maxAlliedArmiesAllowed ?? 0;

  /* Ally selection is tracked per-category as composite keys "categoryId::armyKey"
     so the same army can be offered in multiple categories independently. */
  const splitAlly = (composite) => {
    const idx = composite.indexOf("::");
    return idx === -1 ? { categoryId: "", key: composite } : { categoryId: composite.slice(0, idx), key: composite.slice(idx + 2) };
  };

  /* Army keys disabled because a currently-selected ally (in ANY category) lists
     them in its "disables" field — greys them out in every other category. */
  const disabledAllies = useMemo(() => {
    const set = new Set();
    const map = army?._allyDisables || {};
    checkedAllies.forEach((c) => {
      const { key } = splitAlly(c);
      (map[key] || []).forEach((d) => set.add(d));
    });
    return set;
  }, [army, checkedAllies]);

  const toggleAlly = (categoryId, allyKey) => {
    const composite = `${categoryId}::${allyKey}`;
    setCheckedAllies((prev) => {
      if (prev.includes(composite)) {
        // uncheck -> purge roster instances sourced from this ally in this category
        setRoster((r) => r.filter((i) => !(i.sourceArmyKey === allyKey && i.categoryId === categoryId)));
        return prev.filter((k) => k !== composite);
      }
      if (disabledAllies.has(allyKey)) return prev; // blocked by another selection
      return [...prev, composite];
    });
  };

  /* --- computed roster + validation --- */
  const computed = useMemo(
    () => roster.map((i) => ({ inst: i, calc: computeUnit(i) })),
    [roster]
  );
  const totalPoints = computed.reduce((s, c) => s + c.calc.total, 0);
  const totalBreakPoints = computed.reduce(
    (s, c) => s + unitBreakPoints(c.inst, c.calc),
    0
  );
  const armyBreakPoint = Math.floor(totalBreakPoints / 2);
  const breakPointsToBreak = totalBreakPoints - armyBreakPoint;

  // Supplement name for the PDF header: match the currently selected supplement
  // (by its data file) to the entry in supplements.json and use its `name`.
  const selectedSupplementName = useMemo(() => {
    const norm = (s) => String(s || "").trim().toLowerCase();
    const file = selectedSupplementUrl
      ? selectedSupplementUrl.replace(BASE_DATA_URL, "")
      : "";
    let meta = null;
    if (file) meta = supplementsMeta.find((s) => s && norm(s.file) === norm(file));
    if (!meta) {
      const selName = SUPPLEMENTS.find((s) => s.url === selectedSupplementUrl)?.name;
      if (selName) meta = supplementsMeta.find((s) => norm(s.name) === norm(selName));
    }
    return meta?.name || data?.supplement || "";
  }, [selectedSupplementUrl, supplementsMeta, data]);

  /* Count how many roster instances of each unit id have each equipment applied */
  const equipUsage = useMemo(() => {    const m = {};
    roster.forEach((i) => {
      i.equipped.forEach((name) => {
        m[i.unitId] = m[i.unitId] || {};
        m[i.unitId][name] = (m[i.unitId][name] || 0) + 1;
      });
    });
    return m;
  }, [roster]);

  /* Count roster instances per unit id (for unit "requires" checks) */
  const rosterCounts = useMemo(() => {
    const m = {};
    roster.forEach((i) => {
      m[i.unitId] = (m[i.unitId] || 0) + 1;
    });
    return m;
  }, [roster]);

  /* Army-level mutually exclusive unit groups: once any unit in a group is in
     the roster, the +Add button for the other units in that group is disabled. */
  /* All unit definitions available (home + allied armies) and a map of their
     "excludes" lists, used for mutual-exclusion blocking and warnings. */
  const allUnitDefs = useMemo(() => {
    if (!army) return [];
    const defs = [...(army.units || [])];
    (army.categories || []).forEach((cat) => {
      if (Array.isArray(cat.alliedArmyKeys)) {
        cat.alliedArmyKeys.forEach((ak) => {
          if (allyArmies[ak]) defs.push(...(allyArmies[ak].units || []));
        });
      }
    });
    return defs;
  }, [army, armies, allyArmies]);

  const excludesByUnitId = useMemo(() => {
    const asArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    const map = {};
    allUnitDefs.forEach((u) => {
      const ex = asArr(u.excludes);
      if (ex.length) map[u.id] = ex;
    });
    return map;
  }, [allUnitDefs]);

  const blockedAddIds = useMemo(() => {
    const blocked = new Set();
    (army?.exclusiveGroups || []).forEach((group) => {
      if (!Array.isArray(group)) return;
      const present = group.filter((id) => (rosterCounts[id] || 0) > 0);
      if (present.length > 0) {
        group.forEach((id) => {
          if (!present.includes(id)) blocked.add(id);
        });
      }
    });
    // mutual "excludes": if a unit is in the roster, every id it excludes is
    // blocked; conversely, any unit that excludes a roster unit is blocked too.
    const rosterIds = new Set(roster.map((i) => i.unitId));
    Object.entries(excludesByUnitId).forEach(([uid, ex]) => {
      const uidInRoster = rosterIds.has(uid);
      ex.forEach((x) => {
        if (uidInRoster) blocked.add(x); // uid present -> block what it excludes
        if (rosterIds.has(x)) blocked.add(uid); // excluded unit present -> block uid
      });
    });
    // maxCountAllowed: block +Add once a unit's roster count reaches its cap
    // (cap scales with the army points limit; base of 1 stays fixed).
    allUnitDefs.forEach((u) => {
      if (u.maxCountAllowed != null && (rosterCounts[u.id] || 0) >= effectiveMaxCount(u.maxCountAllowed, maxPoints)) {
        blocked.add(u.id);
      }
      if (u.maxPerPointsLimit != null) {
        const cap = maxPerPointsCap(u.maxPerPointsLimit, maxPoints);
        if (cap != null && (rosterCounts[u.id] || 0) >= cap) blocked.add(u.id);
      }
    });
    // requires: block +Add while a unit's prerequisite is unmet in the roster.
    // fixed -> need >= count of the required ids; ratio (perUnit) -> adding one
    // more must stay within floor(have / count). "self" rules never block.
    allUnitDefs.forEach((u) => {
      if (!u.requires) return;
      normalizeRequires(u.requires, u.id).forEach((r) => {
        if (r.self) return;
        const have = r.unitIds.reduce((s, id) => s + (rosterCounts[id] || 0), 0);
        if (r.countPerUnit != null) {
          const needed = ((rosterCounts[u.id] || 0) + 1) * r.countPerUnit;
          if (have < needed) blocked.add(u.id);
        } else if (r.perUnit) {
          const permitted = Math.floor(have / r.count);
          if ((rosterCounts[u.id] || 0) + 1 > permitted) blocked.add(u.id);
        } else if (have < r.count) {
          blocked.add(u.id);
        }
      });
    });
    // unitPoolRatio: target units are blocked once no unlock slots remain
    // (target count >= floor(source count / ratio)).
    const asArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    (army?.unitPoolRatio || []).forEach((rule) => {
      const src = asArr(rule.sourceIds ?? rule.sources ?? rule.source);
      const tgt = asArr(rule.targetIds ?? rule.targets ?? rule.target);
      const ratio = rule.ratio || 1;
      const srcCount = src.reduce((s, id) => s + (rosterCounts[id] || 0), 0);
      const tgtCount = tgt.reduce((s, id) => s + (rosterCounts[id] || 0), 0);
      const allowed = Math.floor(srcCount / ratio);
      if (tgtCount >= allowed) tgt.forEach((id) => blocked.add(id));
    });
    // armyValidation (lessThanOrEqual / lessThan): block +Add for the rule's
    // `ids` when adding one would breach the constraint against `compareWith`
    // (× ratio). Supports countBy:"units" (entry counts) and default bases.
    // Sub-profile units: use calc.mainBases (sum of visible sub-profile bases).
    const basesByUnitId = {};
    computed.forEach(({ inst, calc }) => {
      basesByUnitId[inst.unitId] =
        (basesByUnitId[inst.unitId] || 0) + (calc.mainBases != null ? calc.mainBases : inst.bases);
    });
    (army?.armyValidation || []).forEach((rule) => {
      if (!rule || (rule.expression !== "lessThanOrEqual" && rule.expression !== "lessThan"))
        return;
      const leftIds = Array.isArray(rule.ids)
        ? rule.ids
        : rule.ids
        ? [rule.ids]
        : [rule.unitId ?? rule.id].filter(Boolean);
      if (leftIds.length === 0) return;
      const ratio = rule.ratio != null ? rule.ratio : 1;
      const compareWith = asArr(rule.compareWith);
      const useUnits = rule.countBy === "units";
      const srcMap = useUnits ? rosterCounts : basesByUnitId;
      const leftTotal = leftIds.reduce((s, id) => s + (srcMap[id] || 0), 0);
      // Fixed-value rules block against the literal value; ratio rules against compareWith×ratio.
      const threshold =
        rule.value != null
          ? rule.value
          : Math.floor(compareWith.reduce((s, id) => s + (srcMap[id] || 0), 0) * ratio);
      const test = rule.expression === "lessThan" ? (a, b) => a < b : (a, b) => a <= b;
      leftIds.forEach((id) => {
        const add = useUnits
          ? 1
          : Math.max(allUnitDefs.find((u) => u.id === id)?.minBases ?? 0, 1);
        if (!test(leftTotal + add, threshold)) blocked.add(id);
      });
    });
    return blocked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [army, rosterCounts, roster, excludesByUnitId, allUnitDefs, maxPoints, computed]);

  /* Human hint for units whose `requires` is currently unmet — used as a
     tooltip on the disabled +Add button so players know what to field first. */
  const requireHints = useMemo(() => {
    const hints = {};
    allUnitDefs.forEach((u) => {
      if (!u.requires) return;
      const msgs = [];
      normalizeRequires(u.requires, u.id).forEach((r) => {
        if (r.self) return;
        const have = r.unitIds.reduce((s, id) => s + (rosterCounts[id] || 0), 0);
        if (r.countPerUnit != null) {
          const needed = ((rosterCounts[u.id] || 0) + 1) * r.countPerUnit;
          if (have < needed) {
            msgs.push(`Needs ${r.countPerUnit}× ${r.name} for each ${u.name} (need ${needed}, have ${have})`);
          }
        } else if (r.perUnit) {
          const permitted = Math.floor(have / r.count);
          if ((rosterCounts[u.id] || 0) + 1 > permitted) {
            msgs.push(`Needs ${r.count}× ${r.name} for each ${u.name} (have ${have})`);
          }
        } else if (have < r.count) {
          msgs.push(`Needs ${r.count}× ${r.name} in the roster first (have ${have})`);
        }
      });
      if (msgs.length) hints[u.id] = msgs.join("; ");
    });
    return hints;
  }, [allUnitDefs, rosterCounts]);

  /* Warnings when two mutually-exclusive units are both in the roster:
     unitId -> [names of conflicting units present in the roster]. */
  const excludeConflicts = useMemo(() => {
    const rosterIds = new Set(roster.map((i) => i.unitId));
    const nameOf = (id) => allUnitDefs.find((u) => u.id === id)?.name || id;
    const out = {};
    rosterIds.forEach((uid) => {
      const conflicts = new Set();
      (excludesByUnitId[uid] || []).forEach((x) => {
        if (rosterIds.has(x)) conflicts.add(nameOf(x));
      });
      Object.entries(excludesByUnitId).forEach(([otherId, ex]) => {
        if (otherId !== uid && rosterIds.has(otherId) && ex.includes(uid)) conflicts.add(nameOf(otherId));
      });
      if (conflicts.size) out[uid] = [...conflicts];
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, excludesByUnitId, allUnitDefs]);


  /* Category ids that have reached their "pointsRatio" max unit count — used to
     hard-block the +Add button for every unit in that category. */
  const catFullIds = useMemo(() => {
    const full = new Set();
    const counts = {};
    roster.forEach((i) => {
      counts[i.categoryId] = (counts[i.categoryId] || 0) + 1;
    });
    (army?.categories || []).forEach((cat) => {
      if (cat.constraintType === "pointsRatio") {
        if ((counts[cat.id] || 0) >= pointsRatioMax(cat, maxPoints)) full.add(cat.id);
      }
    });
    return full;
  }, [army, roster, maxPoints]);

  /* "enabledEvery": an option is only unlocked on every nth unit of a type
     (positions n, 2n, 3n...). Returns instanceId -> Set of LOCKED option names. */
  const enabledEveryLocks = useMemo(() => {
    const result = {};
    const byUnit = {};
    roster.forEach((i) => {
      (byUnit[i.unitId] = byUnit[i.unitId] || []).push(i);
    });
    Object.values(byUnit).forEach((list) => {
      const defs = (list[0].optionalEquipment || []).filter(
        (e) => e.enabledEvery != null && e.enabledEvery > 0
      );
      list.forEach((inst, idx) => {
        const pos = idx + 1; // 1-based position among same unit id
        defs.forEach((def) => {
          const unlocked = pos % def.enabledEvery === 0; // only every nth unit
          if (!unlocked) {
            (result[inst.instanceId] = result[inst.instanceId] || new Set()).add(def.name);
          }
        });
      });
    });
    return result;
  }, [roster]);

  /* "enabledWhenUnitsPresent": an option is only available while enough units of
     a referenced unit id are in the roster.
       - fixed threshold (perUnit absent/false): available only when the referenced
         unit count >= count; otherwise locked on every instance of this unit.
       - ratio (perUnit true): floor(referenced count / count) instances of this
         unit may carry the option (a shared pool); the rest are locked.
     Returns instanceId -> Set of LOCKED option names. */
  const unitsPresentLocks = useMemo(() => {
    const result = {};
    const byUnit = {};
    roster.forEach((i) => {
      (byUnit[i.unitId] = byUnit[i.unitId] || []).push(i);
    });
    const lock = (inst, name) =>
      (result[inst.instanceId] = result[inst.instanceId] || new Set()).add(name);
    Object.values(byUnit).forEach((list) => {
      const defs = (list[0].optionalEquipment || []).filter((e) => e.enabledWhenUnitsPresent);
      defs.forEach((def) => {
        const cfg = def.enabledWhenUnitsPresent;
        const threshold = cfg.count ?? 1;
        const targetCount = rosterCounts[cfg.unitId] || 0;
        if (cfg.perUnit) {
          const allowedSlots = threshold > 0 ? Math.floor(targetCount / threshold) : 0;
          const equippedList = list.filter((i) => i.equipped.includes(def.name));
          // lock the excess equipped instances beyond the allowed pool
          equippedList.slice(allowedSlots).forEach((i) => lock(i, def.name));
          const filled = Math.min(equippedList.length, allowedSlots);
          if (filled >= allowedSlots) {
            // no free slots left: lock the option on any not-yet-equipped instance
            list.forEach((i) => {
              if (!i.equipped.includes(def.name)) lock(i, def.name);
            });
          }
        } else if (targetCount < threshold) {
          list.forEach((i) => lock(i, def.name));
        }
      });
    });
    return result;
  }, [roster, rosterCounts]);

  /* Merge all option-locking sources (enabledEvery + enabledWhenUnitsPresent). */
  const equipLocks = useMemo(() => {
    const merged = {};
    [enabledEveryLocks, unitsPresentLocks].forEach((src) => {
      Object.entries(src).forEach(([id, set]) => {
        merged[id] = merged[id] || new Set();
        set.forEach((n) => merged[id].add(n));
      });
    });
    return merged;
  }, [enabledEveryLocks, unitsPresentLocks]);

  /* Auto-disable any equipped option that has become locked (e.g. after
     deletions/reordering drop the count below a threshold or ratio). */
  useEffect(() => {
    let changed = false;
    const cleaned = roster.map((i) => {
      const locked = equipLocks[i.instanceId];
      if (!locked) return i;
      const nextEquipped = i.equipped.filter((name) => !locked.has(name));
      if (nextEquipped.length !== i.equipped.length) {
        changed = true;
        return { ...i, equipped: nextEquipped };
      }
      return i;
    });
    if (changed) setRoster(cleaned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipLocks]);

  /* "maxEquipmentCount": how many units of a type may carry an option across the
     roster. Flags the excess units (beyond the limit) that currently have it. */
  const maxEquipWarnings = useMemo(() => {
    const result = {}; // instanceId -> [messages]
    const byUnit = {};
    roster.forEach((i) => {
      (byUnit[i.unitId] = byUnit[i.unitId] || []).push(i);
    });
    Object.values(byUnit).forEach((list) => {
      const defs = (list[0].optionalEquipment || []).filter(
        (e) => (e.maxEquipmentCount ?? e.maxUnits) != null
      );
      defs.forEach((def) => {
        const limit = def.maxEquipmentCount ?? def.maxUnits;
        const equippedList = list.filter((i) => i.equipped.includes(def.name));
        if (equippedList.length > limit) {
          equippedList.slice(limit).forEach((i) => {
            (result[i.instanceId] = result[i.instanceId] || []).push(
              `'${def.name}' is applied to ${equippedList.length} ${i.name}, but only ${limit} allowed across the roster.`
            );
          });
        }
      });
    });
    return result;
  }, [roster]);

  /* --- armyValidation: equipmentBasesCount ---
     Compare the bases of INDIVIDUAL roster units on the left side against the
     bases of INDIVIDUAL roster units on the right side, matched by effective
     equipment. For each matched left unit, compare its bases against each
     matched right unit's bases × ratio; if it fails against ANY right unit it
     is flagged on its own card AND in the army validation summary. Skipped if
     either side has no matching units. */
  const equipmentBasesCount = useMemo(() => {
    const summary = [];
    const byUnit = {};
    if (!army) return { summary, byUnit };
    const CMP = {
      lessThan: (a, b) => a < b,
      lessThanOrEqual: (a, b) => a <= b,
      greaterThan: (a, b) => a > b,
      greaterThanOrEqual: (a, b) => a >= b,
      equalTo: (a, b) => a === b,
    };
    const CMP_LABEL = {
      lessThan: "less than",
      lessThanOrEqual: "no more than",
      greaterThan: "greater than",
      greaterThanOrEqual: "at least",
      equalTo: "equal to",
    };
    const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
    const norm = (s) => String(s || "").trim().toLowerCase();
    const singular = (s) => (s.length > 3 && s.endsWith("s") ? s.slice(0, -1) : s);
    const unitHasEquip = (c, equip) => {
      const enabled = new Set();
      [
        ...(c.calc.equipment || []),
        ...((c.calc.profiles || []).flatMap((p) => p.equipment || [])),
      ].forEach((item) => {
        const n = norm(item);
        enabled.add(n);
        enabled.add(singular(n));
      });
      return equip.some((n) => {
        const q = norm(n);
        return enabled.has(q) || enabled.has(singular(q));
      });
    };
    const sideUnitIds = (side) => arr(side && (side.unitIds ?? side.units ?? side.ids));
    const sideEquip = (side) => arr(side && (side.equipment ?? side.gear ?? side.weapons));
    const basesOf = (c) => (c.calc.mainBases != null ? c.calc.mainBases : c.inst.bases);
    const matchSide = (side) => {
      const ids = new Set(sideUnitIds(side));
      const equip = sideEquip(side);
      if (ids.size === 0 || equip.length === 0) return [];
      return computed.filter((c) => ids.has(c.inst.unitId) && unitHasEquip(c, equip));
    };
    (army.armyValidation || []).forEach((rule) => {
      if (!rule || rule.type !== "equipmentBasesCount") return;
      const fn = CMP[rule.expression];
      if (!fn) return;
      const lefts = matchSide(rule.left);
      const rights = matchSide(rule.right);
      if (lefts.length === 0 || rights.length === 0) return;
      const ratio = rule.ratio != null ? rule.ratio : 1;
      const leftEq = sideEquip(rule.left).join("/");
      const rightEq = sideEquip(rule.right).join("/");
      const ratioTxt = ratio === 1 ? "" : `${ratio}× `;
      lefts.forEach((L) => {
        const lb = basesOf(L);
        const failing = rights.filter((R) => !fn(lb, basesOf(R) * ratio));
        if (failing.length === 0) return;
        const detail = failing
          .map((R) => `${R.inst.name}: ${basesOf(R)} → limit ${basesOf(R) * ratio}`)
          .join("; ");
        const msg = `${L.inst.name} (${lb} bases with ${leftEq}) must be ${CMP_LABEL[rule.expression]} ${ratioTxt}the bases of ${rightEq} units (${detail}).`;
        (byUnit[L.inst.instanceId] = byUnit[L.inst.instanceId] || []).push(msg);
        summary.push({ level: "critical", msg });
      });
    });
    return { summary, byUnit };
  }, [army, computed]);

  /* --- unit-level basesComparison ---
     Each instance of a unit carrying this rule must satisfy `expression` when
     its base count is compared against EACH individual instance of every unit
     in `compareWith`. Fails → per-card warning naming the conflicting unit and
     both base counts. Skipped when no compareWith instances are in the roster. */
  const basesComparisonWarnings = useMemo(() => {
    const byUnit = {};
    if (!army) return byUnit;
    const CMP = {
      lessThan: (a, b) => a < b,
      lessThanOrEqual: (a, b) => a <= b,
      greaterThan: (a, b) => a > b,
      greaterThanOrEqual: (a, b) => a >= b,
      equalTo: (a, b) => a === b,
    };
    const LABEL = {
      lessThan: "less than",
      lessThanOrEqual: "no more than",
      greaterThan: "greater than",
      greaterThanOrEqual: "at least",
      equalTo: "equal to",
    };
    const basesOf = (c) => (c.calc.mainBases != null ? c.calc.mainBases : c.inst.bases);
    computed.forEach((L) => {
      const rule = L.inst.basesComparison;
      if (!rule) return;
      const fn = CMP[rule.expression];
      if (!fn) return;
      const ids = new Set(Array.isArray(rule.compareWith) ? rule.compareWith : [rule.compareWith].filter(Boolean));
      if (ids.size === 0) return;
      const others = computed.filter((c) => ids.has(c.inst.unitId) && c.inst.instanceId !== L.inst.instanceId);
      if (others.length === 0) return; // no compareWith instances → no validation
      const lb = basesOf(L);
      const failing = others.filter((R) => !fn(lb, basesOf(R)));
      if (failing.length === 0) return;
      const detail = failing.map((R) => `${R.inst.name} (${basesOf(R)} bases)`).join(", ");
      const msg = `${L.inst.name} (${lb} bases) must have ${LABEL[rule.expression]} the bases of ${detail}.`;
      (byUnit[L.inst.instanceId] = byUnit[L.inst.instanceId] || []).push(msg);
    });
    return byUnit;
  }, [army, computed]);

  // Merge per-instance card warnings once (avoids a fresh inline array per row).
  const extraWarningsByInstance = useMemo(() => {
    const map = {};
    const merge = (src) => {
      Object.entries(src || {}).forEach(([id, msgs]) => {
        (map[id] = map[id] || []).push(...msgs);
      });
    };
    merge(equipmentBasesCount.byUnit);
    merge(basesComparisonWarnings);
    return map;
  }, [equipmentBasesCount, basesComparisonWarnings]);



  const warnings = useMemo(() => {
    if (!army) return [];
    const w = [];

    if (totalPoints > maxPoints) {
      w.push({
        level: "critical",
        msg: `Roster total (${totalPoints} pts) exceeds the Max Points Limit of ${maxPoints} pts.`,
      });
    }

    const generalCount = roster.filter((i) => i.type === "General").length;
    if (generalCount > 1) {
      w.push({
        level: "critical",
        msg: "An army may only contain up to a maximum of 1 General choice inside the Commanders category.",
      });
    }

    // maxAlliedArmiesAllowed is enforced INDEPENDENTLY per category: only allied
    // selections made within a category count toward that category's own limit.
    (army?.categories || []).forEach((cat) => {
      if (!Array.isArray(cat.alliedArmyKeys) || cat.maxAlliedArmiesAllowed == null) return;
      const selected = checkedAllies.filter((k) => k.startsWith(`${cat.id}::`)).length;
      if (selected > cat.maxAlliedArmiesAllowed) {
        w.push({
          level: "critical",
          msg: `${cat.name || cat.id}: only ${cat.maxAlliedArmiesAllowed} allied army(s) may be selected in this category — currently ${selected}.`,
        });
      }
    });

    // Optional-equipment minUnits: for each unit type in the roster, any option
    // with `minUnits` must be selected on at least that many units of the type.
    const rosterByUnit = {};
    roster.forEach((i) => {
      (rosterByUnit[i.unitId] = rosterByUnit[i.unitId] || []).push(i);
    });
    Object.values(rosterByUnit).forEach((list) => {
      (list[0].optionalEquipment || []).forEach((def) => {
        if (def.minUnits == null) return;
        const equippedCount = list.filter((i) => i.equipped.includes(def.name)).length;
        if (equippedCount < def.minUnits) {
          w.push({
            level: "warning",
            msg: `'${def.name}' must be selected on at least ${def.minUnits} ${list[0].name} — currently ${equippedCount}.`,
          });
        }
      });
    });

    computed.forEach(({ inst, calc }) => {
      if (calc.isSkirm && inst.bases > 6) {
        w.push({
          level: "critical",
          msg: `${inst.name} has ${inst.bases} bases — Skirmisher units may not exceed 6 bases.`,
        });
      }
    });

    (army.categories || []).forEach((cat) => {
      const inCat = computed.filter((c) => c.inst.categoryId === cat.id);
      if (cat.constraintType === "count") {
        let n = inCat.length;
        // Commander count also includes allied units whose SOURCE category is
        // "Commanders" (they sit in the Allies category for points purposes, but
        // count toward the main army's commander limit).
        if (isCommanderCat(cat.id)) {
          n += computed.filter(
            (c) =>
              c.inst.sourceArmyKey &&
              c.inst.categoryId !== cat.id &&
              isCommanderCat(c.inst.sourceCategory)
          ).length;
        }
        const catMax = effectiveCatMax(cat, maxPoints);
        if (n < (cat.min ?? 0))
          w.push({
            level: "warning",
            msg: `${cat.name}: requires at least ${cat.min} unit choice(s) — currently ${n}.`,
          });
        if (catMax != null && n > catMax)
          w.push({
            level: "warning",
            msg: `${cat.name}: allows at most ${catMax} unit choice(s) — currently ${n}.`,
          });
      } else if (cat.constraintType === "percentage") {
        const pts = inCat.reduce((s, c) => s + c.calc.total, 0);
        const minPts = ((cat.min ?? 0) / 100) * maxPoints;
        const maxPts = ((cat.max ?? 100) / 100) * maxPoints;
        if (pts < minPts)
          w.push({
            level: "warning",
            msg: `${cat.name}: minimum ${cat.min}% (${Math.round(
              minPts
            )} pts) required — currently ${pts} pts.`,
          });
        if (pts > maxPts)
          w.push({
            level: "warning",
            msg: `${cat.name}: maximum ${cat.max}% (${Math.round(
              maxPts
            )} pts) exceeded — currently ${pts} pts.`,
          });
      } else if (cat.constraintType === "pointsRatio") {
        const n = inCat.length;
        const max = pointsRatioMax(cat, maxPoints);
        if (cat.min != null && n < cat.min)
          w.push({
            level: "warning",
            msg: `${cat.name}: requires at least ${cat.min} unit choice(s) — currently ${n}.`,
          });
        if (n > max)
          w.push({
            level: "warning",
            msg: `${cat.name}: allows at most ${max} unit choice(s) at ${maxPoints} pts — currently ${n}.`,
          });
      }
    });

    /* --- Unit min/max count validation --- */
    const counts = {};
    roster.forEach((i) => {
      counts[i.unitId] = (counts[i.unitId] || 0) + 1;
    });

    // Maximum limit: scan each unique unit id in the roster
    const seenMax = new Set();
    roster.forEach((i) => {
      if (seenMax.has(i.unitId)) return;
      seenMax.add(i.unitId);
      if (i.maxCountAllowed != null) {
        const cap = effectiveMaxCount(i.maxCountAllowed, maxPoints);
        if (counts[i.unitId] > cap) {
          w.push({
            level: "critical",
            msg: `Validation Error: You have added ${counts[i.unitId]} units of '${i.name}', but a maximum of ${cap} is allowed.`,
          });
        }
      }
      if (i.maxPerPointsLimit != null) {
        const cap = maxPerPointsCap(i.maxPerPointsLimit, maxPoints);
        if (cap != null && counts[i.unitId] > cap) {
          w.push({
            level: "critical",
            msg: `Validation Error: You have added ${counts[i.unitId]} units of '${i.name}', but a maximum of ${cap} is allowed (1 per ${i.maxPerPointsLimit.pointsThreshold} pts of the ${maxPoints} pts army limit).`,
          });
        }
      }
    });

    /* --- unitPoolRatio: target units cannot exceed floor(source count / ratio) --- */
    const poolArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    const nameById = {};
    (army.units || []).forEach((u) => (nameById[u.id] = u.name));
    (army.categories || []).forEach((cat) => {
      if (Array.isArray(cat.alliedArmyKeys)) {
        cat.alliedArmyKeys.forEach((ak) => {
          if (allyArmies[ak]) (allyArmies[ak].units || []).forEach((u) => (nameById[u.id] = u.name));
        });
      }
    });
    (army.unitPoolRatio || []).forEach((rule) => {
      const src = poolArr(rule.sourceIds ?? rule.sources ?? rule.source);
      const tgt = poolArr(rule.targetIds ?? rule.targets ?? rule.target);
      const ratio = rule.ratio || 1;
      const srcCount = src.reduce((s, id) => s + (counts[id] || 0), 0);
      const tgtCount = tgt.reduce((s, id) => s + (counts[id] || 0), 0);
      const allowed = Math.floor(srcCount / ratio);
      if (tgtCount > allowed) {
        const tgtNames = tgt.map((id) => nameById[id] || id).join(", ");
        const srcNames = src.map((id) => nameById[id] || id).join(", ");
        w.push({
          level: "critical",
          msg: `Validation Error: ${tgtNames} (${tgtCount}) exceeds the ${allowed} slot(s) unlocked by ${srcNames} (${srcCount}) at a ${ratio}:1 ratio.`,
        });
      }
    });

    // Minimum limit: check every available unit (home + enabled allies) with minCountAllowed > 0
    const availableUnits = [...(army.units || [])];
    (army.categories || []).forEach((cat) => {
      if (Array.isArray(cat.alliedArmyKeys)) {
        cat.alliedArmyKeys.forEach((ak) => {
          if (checkedAllies.includes(`${cat.id}::${ak}`) && allyArmies[ak]) {
            availableUnits.push(...(allyArmies[ak].units || []));
          }
        });
      }
    });
    const seenMin = new Set();
    availableUnits.forEach((u) => {
      if (seenMin.has(u.id)) return;
      seenMin.add(u.id);
      if (u.minCountAllowed != null && u.minCountAllowed > 0) {
        const c = counts[u.id] || 0;
        if (c < u.minCountAllowed) {
          w.push({
            level: "warning",
            msg: `Validation Error: This army must include at least ${u.minCountAllowed} units of '${u.name}' (Current: ${c}).`,
          });
        }
      }
    });

    /* --- self "requires": a unit present in the roster must appear at least
       `count` times (own id). Warning surfaces here, army-wide. --- */
    const seenSelf = new Set();
    roster.forEach((i) => {
      if (seenSelf.has(i.unitId)) return;
      seenSelf.add(i.unitId);
      (i.requires || []).forEach((r) => {
        if (!r.self) return;
        const c = counts[i.unitId] || 0;
        if (c < r.count) {
          w.push({
            level: "warning",
            msg: `Validation Error: This army must include at least ${r.count} units of '${i.name}' (Current: ${c}).`,
          });
        }
      });
    });

    /* --- non-self "requires": prerequisite units that must be present. Legacy
       fixed rules need `count` total; `countPerUnit` rules need that many per
       instance of the requiring unit (any combination from unitIds counts). --- */
    const seenReq = new Set();
    roster.forEach((i) => {
      if (seenReq.has(i.unitId)) return;
      seenReq.add(i.unitId);
      const instances = counts[i.unitId] || 0;
      (i.requires || []).forEach((r) => {
        if (r.self || r.perUnit) return;
        const have = r.unitIds.reduce((s, id) => s + (counts[id] || 0), 0);
        if (r.countPerUnit != null) {
          const required = instances * r.countPerUnit;
          if (have < required) {
            w.push({
              level: "warning",
              msg: `Validation Error: '${i.name}' requires ${r.countPerUnit} × ${r.name} per unit — ${instances} in the roster need ${required}, but only ${have} present.`,
            });
          }
        } else if (have < r.count) {
          w.push({
            level: "warning",
            msg: `Validation Error: '${i.name}' requires at least ${r.count} × ${r.name} in the roster (Current: ${have}).`,
          });
        }
      });
    });

    /* --- basesComparison: compare total bases of units with an option enabled
       against a ratio of the summed bases of the listed compareWith options --- */
    const EXPR = {
      lessThan: { test: (a, b) => a < b, label: "less than" },
      lessThanOrEqual: { test: (a, b) => a <= b, label: "no more than" },
      greaterThan: { test: (a, b) => a > b, label: "greater than" },
      greaterThanOrEqual: { test: (a, b) => a >= b, label: "at least" },
      equal: { test: (a, b) => a === b, label: "equal to" },
      equalTo: { test: (a, b) => a === b, label: "equal to" },
    };
    const byUnitBC = {};
    computed.forEach((c) => {
      (byUnitBC[c.inst.unitId] = byUnitBC[c.inst.unitId] || []).push(c);
    });
    Object.values(byUnitBC).forEach((list) => {
      // count bases of units that carry `name` via optionalEquipment OR baseEquipment
      const basesWith = (name) =>
        list
          .filter(
            (c) => c.inst.equipped.includes(name) || (c.calc.equipment || []).includes(name)
          )
          .reduce((s, c) => s + c.inst.bases, 0);
      (list[0].inst.optionalEquipment || [])
        .filter((e) => e.basesComparison && e.basesComparison.expression)
        .forEach((e) => {
          const bc = e.basesComparison;
          const ratio = bc.ratio != null ? bc.ratio : 1;
          const compareWith = Array.isArray(bc.compareWith) ? bc.compareWith : [];
          const leftTotal = basesWith(e.name);
          const rightSum = compareWith.reduce((s, name) => s + basesWith(name), 0);
          if (leftTotal === 0 && rightSum === 0) return; // nothing relevant in roster
          const threshold = rightSum * ratio;
          const expr = EXPR[bc.expression];
          if (expr && !expr.test(leftTotal, threshold)) {
            w.push({
              level: "warning",
              msg: `Bases with '${e.name}' (${leftTotal}) must be ${expr.label} ${ratio}× the bases with ${compareWith
                .map((q) => `'${q}'`)
                .join(" + ")} (${rightSum}) = ${threshold}.`,
            });
          }
        });
    });

    /* --- armyValidation: compare total bases of a unit id against a ratio of
       the combined total bases of one or more other unit ids ---
       Sub-profile units: sum calc.mainBases (all visible sub-profile bases). */
    const basesByUnit = {};
    computed.forEach(({ inst, calc }) => {
      basesByUnit[inst.unitId] =
        (basesByUnit[inst.unitId] || 0) + (calc.mainBases != null ? calc.mainBases : inst.bases);
    });
    const nameOf = (id) => {
      const all = [...(army.units || [])];
      (army.categories || []).forEach((cat) => {
        if (Array.isArray(cat.alliedArmyKeys)) {
          cat.alliedArmyKeys.forEach((ak) => {
            if (allyArmies[ak]) all.push(...(allyArmies[ak].units || []));
          });
        }
      });
      return all.find((u) => u.id === id)?.name || id;
    };
    (army.armyValidation || []).forEach((rule) => {
      if (!rule) return;
      // equipmentUnitCount: count units (from unitIds) that have at least one of
      // `equipment` enabled (base or optional, selected only) on each side, then
      // compare left vs right*ratio. Each qualifying unit counts once.
      if (rule.type === "equipmentUnitCount") {
        const CMP = {
          lessThan: (a, b) => a < b,
          lessThanOrEqual: (a, b) => a <= b,
          greaterThan: (a, b) => a > b,
          greaterThanOrEqual: (a, b) => a >= b,
          equalTo: (a, b) => a === b,
        };
        const CMP_LABEL = {
          lessThan: "less than",
          lessThanOrEqual: "no more than",
          greaterThan: "greater than",
          greaterThanOrEqual: "at least",
          equalTo: "equal to",
        };
        const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
        const norm = (s) => String(s || "").trim().toLowerCase();
        const singular = (s) => (s.length > 3 && s.endsWith("s") ? s.slice(0, -1) : s);
        const unitHasEquip = (c, equip) => {
          // Use each unit's EFFECTIVE equipment: calc.equipment already applies
          // base equipment + equipmentAdded − equipmentRemoved from selected
          // optional equipment; visible sub-profiles contribute their effective
          // equipment too. (Raw inst.baseEquipment / option names are NOT used,
          // so removed items don't count and added items do.) Case-insensitive,
          // plural-tolerant matching (Javelin ↔ Javelins).
          const enabled = new Set();
          [
            ...(c.calc.equipment || []),
            ...((c.calc.profiles || []).flatMap((p) => p.equipment || [])),
          ].forEach((item) => {
            const n = norm(item);
            enabled.add(n);
            enabled.add(singular(n));
          });
          return equip.some((n) => {
            const q = norm(n);
            return enabled.has(q) || enabled.has(singular(q));
          });
        };
        const sideUnitIds = (side) => arr(side && (side.unitIds ?? side.units ?? side.ids));
        const sideEquip = (side) => arr(side && (side.equipment ?? side.gear ?? side.weapons));
        const countSide = (side) => {
          const ids = new Set(sideUnitIds(side));
          const equip = sideEquip(side);
          if (ids.size === 0 || equip.length === 0) return 0;
          return computed.filter((c) => ids.has(c.inst.unitId) && unitHasEquip(c, equip)).length;
        };
        const fn = CMP[rule.expression];
        if (!fn) return;
        const leftCount = countSide(rule.left);
        const rightCount = countSide(rule.right);
        const ratio = rule.ratio != null ? rule.ratio : 1;
        const threshold = rightCount * ratio;
        if (leftCount === 0 && rightCount === 0) return;
        if (!fn(leftCount, threshold)) {
          const leftEq = sideEquip(rule.left).join("/");
          const rightEq = sideEquip(rule.right).join("/");
          const leftNames = sideUnitIds(rule.left).map((id) => nameOf(id)).join(" + ");
          const rightNames = sideUnitIds(rule.right).map((id) => nameOf(id)).join(" + ");
          w.push({
            level: "critical",
            msg: `Units with ${leftEq} (${leftNames}: ${leftCount}) must be ${CMP_LABEL[rule.expression]} ${ratio}× units with ${rightEq} (${rightNames}: ${rightCount}) = ${threshold}.`,
          });
        }
        return;
      }
      if (!rule.expression) return;
      // left side: an array of ids ("ids") whose bases are summed, or a single id.
      const leftIds = Array.isArray(rule.ids)
        ? rule.ids
        : rule.ids
        ? [rule.ids]
        : [rule.unitId ?? rule.id].filter(Boolean);
      if (leftIds.length === 0) return;
      const ratio = rule.ratio != null ? rule.ratio : 1;
      const compareWith = Array.isArray(rule.compareWith)
        ? rule.compareWith
        : rule.compareWith
        ? [rule.compareWith]
        : [];
      // countBy: "units" counts roster unit entries; default/"bases" sums bases.
      const useUnits = rule.countBy === "units";
      const src = useUnits ? counts : basesByUnit;
      const unitWord = useUnits ? "units" : "bases";
      const leftTotal = leftIds.reduce((s, id) => s + (src[id] || 0), 0);
      // Fixed-value comparison: when `value` is present, compare the left count
      // of units/bases directly against that number (alternative to compareWith).
      if (rule.value != null) {
        if (leftTotal === 0) return;
        const exprV = EXPR[rule.expression];
        if (exprV && !exprV.test(leftTotal, rule.value)) {
          w.push({
            level: "warning",
            msg: `${leftIds.map((id) => nameOf(id)).join(" + ")} ${unitWord} (${leftTotal}) must be ${exprV.label} ${rule.value}.`,
          });
        }
        return;
      }
      const rightSum = compareWith.reduce((s, id) => s + (src[id] || 0), 0);
      if (leftTotal === 0 && rightSum === 0) return;
      // Floor the required count for fractional ratios: e.g. 0.5 × 1 = 0 required,
      // only 0.5 × 2 = 1 becomes an actual requirement.
      const threshold = Math.floor(rightSum * ratio);
      const expr = EXPR[rule.expression];
      if (expr && !expr.test(leftTotal, threshold)) {
        w.push({
          level: "warning",
          msg: `${leftIds.map((id) => nameOf(id)).join(" + ")} ${unitWord} (${leftTotal}) must be ${expr.label} ${ratio}× the ${unitWord} of ${compareWith
            .map((id) => nameOf(id))
            .join(" + ")} (${rightSum}) = ${threshold}.`,
        });
      }
    });

    /* --- unitCountValidation: compare the combined unit count of the "ids"
       either against a fixed "count", or against a ratio of the "compareWith"
       units when no "count" is provided. --- */
    const asArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
    (army.unitCountValidation || []).forEach((rule) => {
      if (!rule) return;
      const leftIds = asArr(rule.ids ?? rule.left ?? rule.leftUnitIds ?? rule.leftIds);
      if (leftIds.length === 0) return;
      const leftCount = leftIds.reduce((s, id) => s + (counts[id] || 0), 0);
      const expr = EXPR[rule.expression] || EXPR.lessThanOrEqual;
      const leftLabel = leftIds.map((id) => nameOf(id)).join(" + ");

      if (rule.count != null) {
        // fixed comparison against a number
        if (leftCount === 0) return;
        if (!expr.test(leftCount, rule.count)) {
          w.push({
            level: "warning",
            msg: `Unit count for ${leftLabel} (${leftCount}) must be ${expr.label} ${rule.count}.`,
          });
        }
        return;
      }

      // ratio comparison against the compareWith units
      const rightIds = asArr(rule.compareWith ?? rule.right ?? rule.rightUnitIds ?? rule.rightIds);
      if (rightIds.length === 0) return;
      const ratio = rule.ratio != null ? rule.ratio : 1;
      const rightCount = rightIds.reduce((s, id) => s + (counts[id] || 0), 0);
      if (leftCount === 0 && rightCount === 0) return;
      const threshold = rightCount * ratio;
      if (!expr.test(leftCount, threshold)) {
        w.push({
          level: "warning",
          msg: `Unit count for ${leftLabel} (${leftCount}) must be ${expr.label} ${ratio}× the count of ${rightIds
            .map((id) => nameOf(id))
            .join(" + ")} (${rightCount}) = ${threshold}.`,
        });
      }
    });

    /* --- pointsPercentageValidation: compare the combined points of the listed
       unit ids against a percentage of the army points limit --- */
    const pointsByUnit = {};
    computed.forEach(({ inst, calc }) => {
      pointsByUnit[inst.unitId] = (pointsByUnit[inst.unitId] || 0) + calc.total;
    });
    (army.pointsPercentageValidation || []).forEach((rule) => {
      if (!rule) return;
      const ids = asArr(rule.unitId ?? rule.ids ?? rule.unitIds);
      if (ids.length === 0 || rule.percentage == null) return;
      const unitsPts = ids.reduce((s, id) => s + (pointsByUnit[id] || 0), 0);
      if (unitsPts === 0) return;
      const limitPts = (rule.percentage / 100) * maxPoints;
      const expr = EXPR[rule.expression] || EXPR.lessThanOrEqual;
      if (!expr.test(unitsPts, limitPts)) {
        w.push({
          level: "warning",
          msg: `${ids.map((id) => nameOf(id)).join(" + ")} points (${unitsPts}) must be ${expr.label} ${rule.percentage}% of ${maxPoints} pts (${Math.round(
            limitPts
          )}).`,
        });
      }
    });

    equipmentBasesCount.summary.forEach((s) => w.push(s));

    return w;
  }, [army, armies, allyArmies, computed, totalPoints, maxPoints, roster, checkedAllies, alliesCategory, maxAllies, equipmentBasesCount]);

  const isValid = warnings.length === 0 && roster.length > 0;

  /* --- per-category validation report --- */
  const categoryReport = useMemo(() => {
    if (!army) return [];
    return (army.categories || []).map((cat) => {
      const inCat = computed.filter((c) => c.inst.categoryId === cat.id);
      if (cat.constraintType === "count") {
        let n = inCat.length;
        if (isCommanderCat(cat.id)) {
          n += computed.filter(
            (c) =>
              c.inst.sourceArmyKey &&
              c.inst.categoryId !== cat.id &&
              isCommanderCat(c.inst.sourceCategory)
          ).length;
        }
        const catMax = effectiveCatMax(cat, maxPoints);
        const ok = n >= (cat.min ?? 0) && (catMax == null || n <= catMax);
        return {
          id: cat.id,
          name: cat.name,
          ok,
          current: `${n} choice${n === 1 ? "" : "s"}`,
          allowed: `${cat.min}–${catMax} choices`,
        };
      }
      const pts = inCat.reduce((s, c) => s + c.calc.total, 0);
      const minPts = ((cat.min ?? 0) / 100) * maxPoints;
      const maxPts = ((cat.max ?? 100) / 100) * maxPoints;
      const ok = pts >= minPts && pts <= maxPts;
      return {
        id: cat.id,
        name: cat.name,
        ok,
        current: `${pts} pts`,
        allowed: `${Math.round(minPts)}–${Math.round(maxPts)} pts (${cat.min}–${cat.max}%)`,
      };
    });
  }, [army, computed, maxPoints]);

  /* ---------------------------------------------------------------- */
  const armyKeys = Object.keys(armies);

  return (
    <div className="sp-app text-slate-100 pb-16">
      {/* ---------- Top bar ---------- */}
      <header className="no-print border-b border-slate-800/80 bg-[#020617] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <Swords className="text-emerald-400" size={28} />
            <h1
              data-testid="app-title"
              className="font-display text-2xl md:text-3xl font-extrabold tracking-wide text-slate-50"
            >
              Swordpoint Army Builder
            </h1>
          </div>

          {/* Supplement info line — fixed-height slot so header height is stable */}
          {loadError && (
            <div
              data-testid="load-error"
              className="w-full max-w-2xl rounded-md border border-amber-700/50 bg-amber-500/10 text-amber-300 px-3 py-1.5 text-xs font-cond flex items-start gap-2"
            >
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>Remote data unavailable — using sample data. {loadError}</span>
            </div>
          )}

          {/* Left stack (Save/Load + dropdowns) · Roster summary (right) — equal height */}
          <div className="w-full flex items-stretch justify-between gap-6 flex-nowrap">
            <div className="flex flex-col gap-2 min-w-0">
              {/* Save / Load army file box */}
              <div
                data-testid="army-file-box"
                className="rounded-xl border-2 border-emerald-400 p-3 backdrop-blur bg-slate-950/90 w-fit"
              >
                <div className="flex items-center gap-3">
                  <button
                    data-testid="save-army-btn"
                    onClick={handleSaveArmy}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-cond font-semibold px-4 py-2 transition-colors"
                  >
                    <Save size={16} /> Save Army
                  </button>
                  <button
                    data-testid="load-army-btn"
                    onClick={handleLoadClick}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-cond font-semibold px-4 py-2 transition-colors"
                  >
                    <Upload size={16} /> Load Army
                  </button>
                  <button
                    data-testid="export-pdf-btn"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-cond font-semibold px-4 py-2 transition-colors"
                  >
                    <Printer size={16} /> Export PDF
                  </button>
                  <input
                    ref={fileInputRef}
                    data-testid="load-army-input"
                    type="file"
                    accept="application/json,.json"
                    onChange={handleLoadFile}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Supplement + Army dropdowns */}
              <div className="flex items-end gap-6 flex-nowrap min-w-0">
              <div className="flex flex-col items-start gap-1">
                <label htmlFor="supplement-select" className="font-cond uppercase text-xs tracking-widest text-slate-300">
                  Supplement
                </label>
                <Select value={selectedSupplementUrl || undefined} onValueChange={handleSupplementChange}>
                  <SelectTrigger
                    id="supplement-select"
                    data-testid="supplement-select"
                    className="h-auto bg-slate-900 border border-slate-300 rounded-md px-4 py-2 font-cond text-base text-slate-100 data-[placeholder]:text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-w-[260px] cursor-pointer"
                  >
                    <SelectValue placeholder="— Select a supplement —" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[66vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-100">
                    {SUPPLEMENTS.map((s) => (
                      <SelectItem
                        key={s.url}
                        value={s.url}
                        data-testid={`supplement-option-${s.file}`}
                        className="font-cond text-base text-slate-200 focus:bg-slate-800 focus:text-emerald-300 cursor-pointer"
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data && (
                <div className="flex flex-col items-start gap-1">
                  <label htmlFor="army-select" className="font-cond uppercase text-xs tracking-widest text-slate-300">
                    Army
                  </label>
                  <Select value={selectedArmyKey || undefined} onValueChange={handleArmyChange}>
                    <SelectTrigger
                      id="army-select"
                      data-testid="army-select"
                      className="h-auto bg-slate-900 border border-slate-700 rounded-md px-4 py-2 font-cond text-base text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-w-[280px] cursor-pointer"
                    >
                      <SelectValue placeholder="— Select an army —" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[66vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-100">
                      {armyKeys.map((k) => (
                        <SelectItem
                          key={k}
                          value={k}
                          data-testid={`army-option-${k}`}
                          className="font-cond text-base text-slate-200 focus:bg-slate-800 focus:text-emerald-300 cursor-pointer"
                        >
                          {armies[k].armyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            </div>

            {/* Roster summary box — always rendered (hidden until an army is
               selected) so the header height never changes. */}
            <div
              data-testid="header-roster-summary"
              aria-hidden={!army}
              className={`rounded-xl border-2 border-emerald-400 p-2 backdrop-blur bg-slate-950/90 w-fit shrink-0 ml-auto flex flex-col items-end justify-between ${
                army ? "" : "invisible pointer-events-none"
              }`}
            >
              <div className="w-fit">
                <div className="w-full flex items-center justify-between gap-3 min-h-[30px]">
                  <span className="font-cond uppercase text-[11px] tracking-widest text-slate-300">
                    Roster Summary
                  </span>
                  <StatusBadge isValid={isValid} empty={roster.length === 0} />
                </div>

                <div className="mt-2 flex items-end gap-4">
                  <div className="flex flex-col items-start shrink-0">
                    <label
                      htmlFor="max-points"
                      className="font-cond uppercase text-[11px] tracking-widest text-slate-300 mb-1 text-center"
                    >
                      Max Points Limit
                    </label>
                    <input
                      id="max-points"
                      data-testid="max-points-input"
                      type="number"
                      min={0}
                      value={maxPoints}
                      onChange={(e) => setMaxPoints(Math.max(0, Number(e.target.value) || 0))}
                      className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 w-28 font-cond text-lg text-slate-100 text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div
                    data-testid="army-break-point"
                    className="font-cond text-[11px] text-slate-300 shrink-0"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "max-content 1.75rem",
                      columnGap: "3ch",
                      rowGap: "2px",
                      alignItems: "center",
                    }}
                  >
                    <span className="uppercase tracking-widest text-slate-400">Total Break Points</span>
                    <span data-testid="total-break-points" className="font-display text-sm font-bold text-slate-100 text-right tabular-nums">{totalBreakPoints}</span>
                    <span className="uppercase tracking-widest text-slate-400">Break Points to Army Break</span>
                    <span data-testid="break-points-to-break" className="font-display text-sm font-bold text-slate-100 text-right tabular-nums">{breakPointsToBreak}</span>
                    <span className="uppercase tracking-widest text-slate-400">Army Break Point</span>
                    <span data-testid="army-break-point-value" className="font-display text-sm font-bold text-emerald-400 text-right tabular-nums">{armyBreakPoint}</span>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <div className="font-cond uppercase text-[11px] tracking-widest text-slate-300 text-right">
                      Total / Limit
                    </div>
                    <div
                      data-testid="total-points"
                      className={`font-display text-2xl font-extrabold leading-none flex items-baseline justify-end tabular-nums ${
                        totalPoints > maxPoints ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      <span className="inline-block text-right" style={{ minWidth: "4ch" }}>{totalPoints}</span>
                      <span className="text-slate-500 text-lg font-semibold whitespace-nowrap"> / {maxPoints}</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
          </div>
        </div>
      </header>

      {/* ---------- Empty states before an army is chosen ---------- */}
      {!army && (
        <div
          data-testid="builder-placeholder"
          className="no-print max-w-[1400px] mx-auto px-6 mt-16 text-center font-cond text-slate-400"
        >
          {reloading && !data
            ? "Loading supplement…"
            : !selectedSupplementUrl
            ? "Choose a supplement above to begin, then pick an army."
            : "Now select an army to start building your army."}
        </div>
      )}

      {/* ---------- Main two-column dashboard ---------- */}
      {army && (
      <main
        className="no-print max-w-[1400px] mx-auto px-4 md:px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
        style={{ height: "100vh", overflow: "hidden" }}
      >
        {/* ====== LEFT: Army Composition ====== */}
        <section data-testid="catalog-panel" className="min-w-0 pr-3" style={{ height: "100%", overflowY: "auto", scrollbarGutter: "stable" }}>
          <div className="sticky top-0 z-20 pb-2 mb-4">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-800 bg-[#020617]">
              <Users size={18} className="text-slate-400" />
              <h2 className="font-display text-lg font-bold tracking-wide text-slate-200">
                {army?.armyName || "Army Composition"}
              </h2>
            </div>
          </div>

          {/* Category constraints table */}
          <ConstraintsTable categories={army?.categories || []} maxPoints={maxPoints} />

          <div className="space-y-5 mt-5">
            {(army?.categories || []).map((cat) => (
              <CatalogCategory
                key={cat.id}
                cat={cat}
                army={army}
                homeKey={selectedArmyKey}
                armies={allyArmies}
                checkedAllies={checkedAllies}
                maxAllies={maxAllies}
                disabledAllies={disabledAllies}
                onToggleAlly={toggleAlly}
                onAdd={addUnit}
                blockedAddIds={blockedAddIds}
                maxPoints={maxPoints}
                rosterCounts={rosterCounts}
                requireHints={requireHints}
                supplementNames={supplementNames}
                catFull={catFullIds.has(cat.id)}
              />
            ))}
          </div>
        </section>

        {/* ====== RIGHT: Roster ====== */}
        <section data-testid="roster-panel" className="min-w-0 pr-3" style={{ height: "100%", overflowY: "auto", scrollbarGutter: "stable" }}>
          {/* Column header — sticky; opaque bg extends to meet the summary box */}
          <div className="sticky top-0 z-30 pb-4">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-800 bg-[#020617]">
              <Flag size={18} className="text-slate-400" />
              <h2 className="font-display text-lg font-bold tracking-wide text-slate-100">
                Active Army Roster
              </h2>
            </div>
          </div>

          {/* Validation panel — sticky so it stays visible while scrolling */}
          <div className="mb-4 sticky top-[52px] z-20 bg-[#020617] pb-3">
            <ValidationPanel warnings={warnings} isValid={isValid} empty={roster.length === 0} />
          </div>

          {/* Roster list */}
          {roster.length === 0 ? (
            <div
              data-testid="empty-roster"
              className="rounded-xl border border-dashed border-slate-800 p-10 text-center font-cond text-slate-300"
            >
              No units added yet. Pick troops from the catalog to build your army.
            </div>
          ) : (
            <div className="space-y-3">
              {computed.map(({ inst, calc }, idx) => (
                <RosterRow
                  key={inst.instanceId}
                  inst={inst}
                  calc={calc}
                  armies={allyArmies}
                  index={idx}
                  total={roster.length}
                  equipUsage={equipUsage}
                  rosterCounts={rosterCounts}
                  excludeConflict={excludeConflicts[inst.unitId]}
                  extraWarnings={extraWarningsByInstance[inst.instanceId]}
                  enabledEveryLocked={equipLocks[inst.instanceId]}
                  onChangeBases={changeBases}
                  onChangeSubBases={changeSubBases}
                  onChangeFormation={changeFormation}
                  onToggleEquip={toggleEquipment}
                  onDuplicate={duplicateUnit}
                  onMove={moveUnit}
                  onRemove={removeUnit}
                  onSetSecondary={setSecondaryUnit}
                  onSetRatio={setSecondaryRatio}
                />
              ))}
            </div>
          )}

          {/* Category validation report */}
          {roster.length > 0 && (
            <CategoryReport report={categoryReport} />
          )}
        </section>
      </main>
      )}

      {/* ---------- Print-only clean summary ---------- */}
      <PrintSummary
        army={army}
        computed={computed}
        totalPoints={totalPoints}
        maxPoints={maxPoints}
        isValid={isValid}
        warnings={warnings}
        categoryReport={categoryReport}
        totalBreakPoints={totalBreakPoints}
        armyBreakPoint={armyBreakPoint}
        breakPointsToBreak={breakPointsToBreak}
        supplementName={selectedSupplementName}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SUB-COMPONENTS                                                     */
/* ------------------------------------------------------------------ */
function StatusBadge({ isValid, empty }) {
  if (empty)
    return (
      <span
        data-testid="status-badge"
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 text-slate-300 border border-transparent px-3 py-1 font-cond text-sm"
      >
        Empty roster
      </span>
    );
  return isValid ? (
    <span
      data-testid="status-badge"
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-600/40 px-3 py-1 font-cond text-sm font-semibold"
    >
      <ShieldCheck size={15} /> Valid
    </span>
  ) : (
    <span
      data-testid="status-badge"
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-600/40 px-3 py-1 font-cond text-sm font-semibold"
    >
      <AlertTriangle size={15} /> Warnings
    </span>
  );
}

function ValidationPanel({ warnings, isValid, empty }) {
  if (empty) return null;
  if (isValid)
    return (
      <div
        data-testid="validation-panel"
        className="mt-2 rounded-lg border border-emerald-700/40 bg-emerald-500/10 px-4 py-2.5 font-cond text-emerald-300 flex items-center gap-2"
      >
        <ShieldCheck size={16} /> All constraints satisfied — this roster is legal.
      </div>
    );
  return (
    <div data-testid="validation-panel" className="mt-2 space-y-1.5">
      {warnings.map((w, i) => (
        <div
          key={`${w.level}-${w.msg}`}
          data-testid="validation-warning"
          className={`rounded-lg border px-4 py-2 font-cond text-sm flex items-start gap-2 ${
            w.level === "critical"
              ? "border-red-700/50 bg-red-500/10 text-red-300"
              : "border-amber-700/50 bg-amber-500/10 text-amber-300"
          }`}
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{w.msg}</span>
        </div>
      ))}
    </div>
  );
}

function CatalogCategory({ cat, army, homeKey, armies, checkedAllies, maxAllies, disabledAllies, onToggleAlly, onAdd, blockedAddIds, maxPoints, rosterCounts, requireHints, supplementNames, catFull }) {
  const homeUnits = (army?.units || []).filter((u) => u.category === cat.id);
  const isAllies = Array.isArray(cat.alliedArmyKeys);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-display font-bold tracking-wide text-slate-200" style={{ fontSize: "1.25rem" }}>
          {cat.name}
        </h3>
        <span className="font-cond text-[11px] uppercase tracking-widest text-slate-500">
          {cat.constraintType === "percentage"
            ? `${cat.min}–${cat.max}%`
            : cat.constraintType === "pointsRatio"
            ? `max ${pointsRatioMax(cat, maxPoints)} choices`
            : `${cat.min}–${effectiveCatMax(cat, maxPoints)} choices`}
        </span>
      </div>

      {cat.description && (
        <p
          data-testid={`category-description-${cat.id}`}
          className="px-4 pt-3 font-body text-xs text-slate-400 leading-relaxed"
        >
          {cat.description}
        </p>
      )}

      <div className="p-3 space-y-2">
        {/* Home army units */}
        {homeUnits.map((u) => (
          <CatalogUnit key={u.id} unit={u} onAddUnit={onAdd} armyKey={homeKey} blocked={blockedAddIds?.has(u.id) || catFull} rosterCounts={rosterCounts} maxPoints={maxPoints} requireHint={requireHints?.[u.id]} />
        ))}

        {/* Allied selection */}
        {isAllies && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {cat.alliedArmyKeys.map((ak) => {
                const ally = armies[ak];
                if (!ally) return null;
                const checked = checkedAllies.includes(`${cat.id}::${ak}`);
                // Conditional display: honour requiresUnits / excludesIfUnits (per
                // the ally's `conditions`). A selected ally stays visible so it can
                // still be deselected even if its conditions later fail.
                if (!checked && !allyConditionsMet(cat._allyConditions?.[ak], rosterCounts)) return null;
                const blockedByDisable = !checked && disabledAllies?.has(ak);
                const catSelected = checkedAllies.filter((k) => k.startsWith(`${cat.id}::`)).length;
                const catMaxAllies = cat.maxAlliedArmiesAllowed ?? Infinity;
                const disabled =
                  (!checked && catSelected >= catMaxAllies) || blockedByDisable;
                return (
                  <label
                    key={ak}
                    className={`inline-flex items-center gap-2 font-cond text-sm select-none ${
                      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      data-testid={`ally-checkbox-${cat.id}-${ak}`}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onToggleAlly(cat.id, ak)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className={checked ? "text-emerald-300" : "text-slate-300"}>
                      {ally.armyName}
                      {cat._allySupplement?.[ak] && supplementNames?.[cat._allySupplement[ak]] && (
                        <span className="ml-1 text-[11px] uppercase tracking-widest text-slate-500">
                          · {supplementNames[cat._allySupplement[ak]]}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Active allied units (non-General only) */}
            {cat.alliedArmyKeys
              .filter((ak) => checkedAllies.includes(`${cat.id}::${ak}`) && armies[ak])
              .map((ak) => {
                const filter = cat._allyUnitFilter?.[ak];
                // onlyUnits takes precedence; else excludesUnits; else all available
                const isRestricted = (uid) => {
                  if (!filter) return false;
                  if (filter.onlyUnits?.length) return !filter.onlyUnits.includes(uid);
                  if (filter.excludesUnits?.length) return filter.excludesUnits.includes(uid);
                  return false;
                };
                return (
                <div key={ak} className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-2 space-y-2">
                  <div className="font-cond text-xs uppercase tracking-widest text-emerald-400 px-1">
                    {armies[ak].armyName}
                    {cat._allySupplement?.[ak] && supplementNames?.[cat._allySupplement[ak]] && (
                      <span className="ml-1 text-slate-500">· {supplementNames[cat._allySupplement[ak]]}</span>
                    )}
                  </div>
                  {(armies[ak].units || [])
                    .filter((u) => u.type !== "General")
                    .filter((u) => !isRestricted(u.id))
                    .map((u) => (
                      <CatalogUnit key={ak + u.id} unit={u} onAddUnit={onAdd} armyKey={ak} categoryOverride={cat.id} blocked={blockedAddIds?.has(u.id) || catFull} rosterCounts={rosterCounts} maxPoints={maxPoints} requireHint={requireHints?.[u.id]} />
                    ))}
                </div>
                );
              })}
          </div>
        )}

        {homeUnits.length === 0 && !isAllies && (
          <p className="font-cond text-sm text-slate-600 px-1 py-1">No units in this category.</p>
        )}
      </div>
    </div>
  );
}

function CatalogUnit({ unit, onAddUnit, armyKey, categoryOverride, blocked, rosterCounts, maxPoints, requireHint }) {
  // Units with sub-profiles show the summed sub-profile pts/base when the
  // sub-profiles carry their own points; otherwise the top-level pts/base.
  const subs = Array.isArray(unit.subProfiles) ? unit.subProfiles.map(readSubProfile) : [];
  const displayPtsBase =
    subs.length && subs.some((s) => s.pointsPerBase != null)
      ? subs.reduce((sum, s) => sum + (s.pointsPerBase != null ? s.pointsPerBase : unit.pointsPerBase || 0), 0)
      : unit.pointsPerBase;
  // dynamic count-limit badge shown after the unit name
  let limitBadge = null;
  if (unit.maxCountAllowed != null) {
    const have = rosterCounts?.[unit.id] || 0;
    limitBadge = `(Max: ${have} of ${effectiveMaxCount(unit.maxCountAllowed, maxPoints)})`;
  } else if (unit.maxPerPointsLimit != null) {
    const cap = maxPerPointsCap(unit.maxPerPointsLimit, maxPoints);
    if (cap != null) limitBadge = `(Max: ${rosterCounts?.[unit.id] || 0} of ${cap})`;
  } else if (unit.minCountAllowed != null && unit.minCountAllowed > 0) {
    limitBadge = `(Min: ${unit.minCountAllowed}+)`;
  }
  return (
    <div title={requireHint || undefined} className={`rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5 flex items-start justify-between gap-3 transition-all duration-150 ${blocked ? "opacity-50" : "hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-500/10"}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {unit.type === "General" && <Crown size={14} className="text-amber-400 shrink-0" />}
          <span className="font-body font-semibold text-slate-100 truncate">{unit.name}</span>
          {limitBadge && (
            <span data-testid={`unit-limit-badge-${unit.id}`} className="font-cond text-sm text-slate-400 shrink-0">
              {limitBadge}
            </span>
          )}
        </div>
        <p className="font-body text-xs text-slate-300 mt-0.5">{unit.description}</p>
        {requireHint && (
          <div
            data-testid={`unit-require-hint-${unit.id}`}
            title={requireHint}
            className="mt-1 inline-flex items-center gap-1 font-cond text-[11px] text-amber-300"
          >
            <AlertTriangle size={12} className="shrink-0" />
            <span>{requireHint}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-1.5 font-cond text-[11px] text-slate-400">
          <span className="text-emerald-400 font-semibold">{displayPtsBase} pts/base</span>
          <span>· {unit.minBases}–{unit.maxBases} bases</span>
          {unit.defence != null && <span>· Def {unit.defence}</span>}
          {unit.attacks != null && <span>· Atk {unit.attacks}</span>}
          {unit.cohesion != null && <span>· Coh {unit.cohesion}</span>}
        </div>
      </div>
      <button
        data-testid={`add-unit-${unit.id}`}
        disabled={blocked}
        onClick={() => onAddUnit(unit, armyKey, categoryOverride)}
        className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-cond font-semibold text-sm px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
      >
        <Plus size={14} /> Add
      </button>
    </div>
  );
}

function RosterRow({
  inst,
  calc,
  armies,
  index,
  total,
  equipUsage,
  rosterCounts,
  excludeConflict,
  extraWarnings,
  enabledEveryLocked,
  onChangeBases,
  onChangeSubBases,
  onChangeFormation,
  onToggleEquip,
  onDuplicate,
  onMove,
  onRemove,
  onSetSecondary,
  onSetRatio,
}) {
  const allyName =
    inst.sourceArmyKey && armies[inst.sourceArmyKey]
      ? armies[inst.sourceArmyKey].armyName
      : null;
  const atMin = inst.bases <= (calc.effMin || 1);
  const atMax = inst.bases >= calc.effMax;
  const bp = unitBreakPoints(inst, calc);

  const requireWarnings = [];
  (inst.requires || []).forEach((r) => {
    if (r.self) return; // self-requirement is shown in army-wide validation
    const have = (r.unitIds || []).reduce((s, id) => s + (rosterCounts?.[id] || 0), 0);
    if (r.perUnit) {
      const permitted = Math.floor(have / r.count);
      const thisCount = rosterCounts?.[inst.unitId] || 0;
      if (thisCount > permitted) {
        requireWarnings.push(
          `Only ${permitted} × ${inst.name} permitted (1 per ${r.count} ${r.name}) — currently ${thisCount} in the roster.`
        );
      }
    } else if (have < r.count) {
      requireWarnings.push(
        `Requires at least ${r.count} × ${r.name} in the roster (currently ${have}).`
      );
    }
  });

  if (excludeConflict && excludeConflict.length > 0) {
    requireWarnings.push(
      `Cannot be fielded alongside ${excludeConflict.join(", ")} — remove one of these units.`
    );
  }

  if (Array.isArray(extraWarnings)) {
    extraWarnings.forEach((msg) => requireWarnings.push(msg));
  }

  // Sub-unit units: warn (do not block) when combined bases fall below the main unit min.
  if (calc.hasSubBases && calc.mainBases < calc.subDispMin) {
    requireWarnings.push(`Minimum ${calc.subDispMin} bases required (currently ${calc.mainBases}).`);
  }
  // Sub-unit percentage rules: recheck every sub-unit's share of the total on every
  // render (i.e. after any base change on any sub-unit), warning on both floor & cap.
  if (calc.hasSubBases && calc.mainBases > 0) {
    calc.profiles.forEach((p) => {
      const prop = (p.bases / calc.mainBases) * 100;
      if (p.minPercentage != null && prop < p.minPercentage) {
        requireWarnings.push(
          `${p.name}: at least ${p.minPercentage}% of bases required (currently ${Math.round(prop)}%).`
        );
      }
      if (p.maxPercentage != null && prop > p.maxPercentage) {
        requireWarnings.push(
          `${p.name}: at most ${p.maxPercentage}% of bases allowed (currently ${Math.round(prop)}%).`
        );
      }
    });
  }
  // Sub-unit cross-constraint: compareWithSubProfile (this [expr] target*ratio).
  if (calc.hasSubBases) {
    calc.profiles.forEach((p) => {
      const cw = p.compareWithSubProfile;
      if (!cw || !cw.name) return;
      const target = calc.profiles.find((q) => q.name === cw.name);
      const fn = SUB_COMPARE_EXPR[cw.expression];
      if (!target || !fn) return;
      const ratio = cw.ratio ?? 1;
      const bound = target.bases * ratio;
      if (!fn(p.bases, bound)) {
        const exprLabel = {
          lessThanOrEqual: "at most",
          lessThan: "fewer than",
          greaterThanOrEqual: "at least",
          greaterThan: "more than",
          equalTo: "exactly",
        }[cw.expression] || cw.expression;
        const ratioTxt = ratio === 1 ? `${cw.name}'s bases` : `${ratio}× ${cw.name}'s bases`;
        requireWarnings.push(
          `${p.name}: must be ${exprLabel} ${ratioTxt} (currently ${p.bases} vs ${cw.name} ${target.bases}).`
        );
      }
    });
  }

  return (
    <div
      data-testid={`roster-row-${inst.instanceId}`}
      className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
    >
      {requireWarnings.length > 0 && (
        <div
          data-testid={`unit-requires-warning-${inst.instanceId}`}
          className="mb-3 rounded-lg border border-amber-700/50 bg-amber-500/10 text-amber-300 px-3 py-2 font-cond text-sm flex items-start gap-2"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            {requireWarnings.map((msg, k) => (
              <span key={`${k}-${msg}`} className="block">
                {msg}
              </span>
            ))}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {inst.type === "General" && <Crown size={15} className="text-amber-400" />}
            <span className="font-display font-bold text-slate-100">{inst.name}</span>
            <span className="font-cond text-[10px] uppercase tracking-widest text-slate-500 bg-slate-800 rounded px-1.5 py-0.5">
              {inst.categoryId}
            </span>
            {inst.sourceArmyKey && armies[inst.sourceArmyKey] && index >= 0 && isAlliesCat(inst.categoryId) && (
              <span className="font-cond text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 rounded px-1.5 py-0.5">
                Allied
              </span>
            )}
          </div>
          {allyName && isAlliesCat(inst.categoryId) && (
            <span className="font-cond text-[11px] text-emerald-500/80">{allyName}</span>
          )}
        </div>

        <div className="flex items-center gap-1 no-print">
          <IconBtn testid={`move-up-${inst.instanceId}`} disabled={index === 0} onClick={() => onMove(inst.instanceId, -1)} title="Move up">
            <ArrowUp size={15} />
          </IconBtn>
          <IconBtn testid={`move-down-${inst.instanceId}`} disabled={index === total - 1} onClick={() => onMove(inst.instanceId, 1)} title="Move down">
            <ArrowDown size={15} />
          </IconBtn>
          <IconBtn testid={`duplicate-${inst.instanceId}`} onClick={() => onDuplicate(inst.instanceId)} title="Duplicate">
            <Copy size={15} />
          </IconBtn>
          <IconBtn testid={`remove-${inst.instanceId}`} danger onClick={() => onRemove(inst.instanceId)} title="Remove">
            <Trash2 size={15} />
          </IconBtn>
        </div>
      </div>

      {inst.description && (
        <p
          data-testid={`unit-description-${inst.instanceId}`}
          className="font-body text-xs text-slate-400 mt-2 w-full"
        >
          {inst.description}
        </p>
      )}

      {/* stats + bases */}
      <div className="mt-3 flex items-end justify-between gap-4">
        {calc.hasSubBases ? (
          <div className="flex items-end gap-2" data-testid={`bases-readonly-${inst.instanceId}`}>
            <div className="text-center min-w-[64px]">
              <div className="font-cond text-[10px] uppercase tracking-widest text-slate-500">
                bases ({calc.subDispMin}–{calc.subDispMax})
              </div>
              <div data-testid={`bases-count-${inst.instanceId}`} className="font-display text-xl font-bold text-slate-100 leading-none">
                {calc.mainBases}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <button
              data-testid={`bases-minus-${inst.instanceId}`}
              disabled={atMin}
              onClick={() => onChangeBases(inst.instanceId, -1)}
              className="w-8 h-8 grid place-items-center rounded-md border border-slate-700 bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-emerald-600"
            >
              <Minus size={15} />
            </button>
            <div className="text-center min-w-[64px]">
              <div className="font-cond text-[10px] uppercase tracking-widest text-slate-500">
                bases ({calc.effMin}–{calc.effMax})
              </div>
              <div data-testid={`bases-count-${inst.instanceId}`} className="font-display text-xl font-bold text-slate-100 leading-none">
                {inst.bases}
              </div>
            </div>
            <button
              data-testid={`bases-plus-${inst.instanceId}`}
              disabled={atMax}
              onClick={() => onChangeBases(inst.instanceId, 1)}
              className="w-8 h-8 grid place-items-center rounded-md border border-slate-700 bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-emerald-600"
            >
              <Plus size={15} />
            </button>
          </div>
        )}

        {/* unified stat columns — same fixed-width grid used by sub-profile rows
            so every column vertically aligns with the header. */}
        <div className="flex items-end gap-2 font-cond text-sm ml-auto">
          <Stat label="Pts/Base" value={calc.hasSubBases ? "–" : calc.ppbBase} w testid={`unit-pts-base-${inst.instanceId}`} />
          <Stat
            label="Options"
            value={calc.hasSubBases ? "–" : calc.ppbOptions}
            w
            testid={`unit-pts-options-${inst.instanceId}`}
          />
          <Stat label="Total" value={calc.hasSubBases ? "–" : calc.ppbTotal} w testid={`unit-pts-total-${inst.instanceId}`} />
          <Stat label="BPs" value={bp} w testid={`unit-bp-${inst.instanceId}`} />
          {calc.profiles?.length ? (
            <>
              <Stat label={isCommanderCat(inst.categoryId) || inst.type === "General" ? "A" : "D"} value={"\u00A0"} w testid={`unit-defence-${inst.instanceId}`} />
              <Stat label="C" value={"\u00A0"} w testid={`unit-cohesion-${inst.instanceId}`} />
            </>
          ) : (
            <>
              {isCommanderCat(inst.categoryId) || inst.type === "General" ? (
                <Stat label="A" value={inst.attacks ?? "-"} w testid={`unit-attacks-${inst.instanceId}`} />
              ) : (
                <Stat label="D" value={calc.defence ?? "-"} w testid={`unit-defence-${inst.instanceId}`} />
              )}
              <Stat label="C" value={calc.cohesion ?? "-"} w testid={`unit-cohesion-${inst.instanceId}`} />
            </>
          )}
          <Stat label="Pts/Unit" value={calc.total} big w testid={`unit-total-${inst.instanceId}`} />
        </div>
      </div>

      {/* sub-profile rows — each profile renders as a distinct row */}
      {calc.profiles?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2" data-testid={`unit-subprofiles-${inst.instanceId}`}>
          {calc.profiles.map((p, idx) => {
            const subTotal = calc.mainBases;
            const pctBlocked =
              p.maxPercentage != null &&
              subTotal + 1 > 0 &&
              ((p.bases + 1) / (subTotal + 1)) * 100 > p.maxPercentage;
            const overCombinedMax = subTotal + 1 > calc.subDispMax;
            const underCombinedMin = subTotal - 1 < calc.subDispMin;
            const pctMinBlocked =
              p.minPercentage != null &&
              (() => {
                const nb = p.bases - 1;
                const nt = subTotal - 1;
                const prop = nt > 0 ? (nb / nt) * 100 : 0;
                return prop < p.minPercentage;
              })();
            const subAtMin = p.bases <= (p.minBases ?? 0) || underCombinedMin || pctMinBlocked;
            // compareWithSubProfile: disable + when incrementing would breach the constraint
            // against another (visible) sub-profile in the same unit.
            let compareBlocked = false;
            if (p.compareWithSubProfile && p.compareWithSubProfile.name) {
              const cw = p.compareWithSubProfile;
              const target = calc.profiles.find((q) => q.name === cw.name);
              const fn = SUB_COMPARE_EXPR[cw.expression];
              if (target && fn) {
                const bound = target.bases * (cw.ratio ?? 1);
                compareBlocked = !fn(p.bases + 1, bound);
              }
            }
            const subAtMax = p.bases >= (p.maxBases ?? Infinity) || pctBlocked || overCombinedMax || compareBlocked;
            return (
            <div
              key={p.name}
              data-testid={`subprofile-${inst.instanceId}-${p.name}`}
              className="rounded-lg border-l-2 border-slate-700 bg-slate-900/40 py-2 pl-3"
            >
              {/* title on its own row, above the stats */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-body font-semibold text-slate-100">{p.name}</span>
                {p.minPercentage != null && (
                  <span className="font-cond text-[10px] uppercase tracking-widest text-slate-500">
                    min {p.minPercentage}%
                  </span>
                )}
                {p.maxPercentage != null && (
                  <span className="font-cond text-[10px] uppercase tracking-widest text-slate-500">
                    max {p.maxPercentage}%
                  </span>
                )}
              </div>
              <div className="flex items-end gap-2 font-cond text-sm">
                {calc.hasSubBases && (
                  <div className="flex items-end gap-1" data-testid={`subprofile-bases-${inst.instanceId}-${p.name}`}>
                    <button
                      data-testid={`sub-bases-minus-${inst.instanceId}-${p.name}`}
                      disabled={subAtMin}
                      title={pctMinBlocked ? `Cannot drop below ${p.minPercentage}% of total bases` : undefined}
                      onClick={() => onChangeSubBases(inst.instanceId, p.origIdx, -1)}
                      className="w-7 h-7 grid place-items-center rounded-md border border-slate-700 bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-emerald-600"
                    >
                      <Minus size={13} />
                    </button>
                    <div className="text-center w-[52px]">
                      <div className="font-cond text-[9px] uppercase tracking-widest text-slate-500">
                        bases {p.minBases ?? 0}–{p.maxBases ?? "∞"}
                      </div>
                      <div data-testid={`sub-bases-count-${inst.instanceId}-${p.name}`} className="font-display text-base font-bold text-slate-100 leading-none">
                        {p.bases}
                      </div>
                    </div>
                    <button
                      data-testid={`sub-bases-plus-${inst.instanceId}-${p.name}`}
                      disabled={subAtMax}
                      title={pctBlocked ? `Cannot exceed ${p.maxPercentage}% of total bases` : overCombinedMax ? `Combined bases cannot exceed ${calc.subDispMax}` : compareBlocked ? `Limited by ${p.compareWithSubProfile.name} base count` : undefined}
                      onClick={() => onChangeSubBases(inst.instanceId, p.origIdx, 1)}
                      className="w-7 h-7 grid place-items-center rounded-md border border-slate-700 bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-emerald-600"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2 ml-auto">
                  <Stat label="Pts/Base" value={p.ptsBase} w sm testid={`subprofile-pts-base-${inst.instanceId}-${p.name}`} />
                  <Stat label="Options" value={p.ptsOptions} w sm testid={`subprofile-pts-options-${inst.instanceId}-${p.name}`} />
                  <Stat label="Total" value={p.total} w sm testid={`subprofile-pts-total-${inst.instanceId}-${p.name}`} />
                  <Stat label="BPs" value={"\u00A0"} w sm testid={`subprofile-bp-${inst.instanceId}-${p.name}`} />
                  {isCommanderCat(inst.categoryId) || inst.type === "General" ? (
                    <Stat label="A" value={p.attacks ?? "-"} w sm testid={`subprofile-attacks-${inst.instanceId}-${p.name}`} />
                  ) : (
                    <Stat label="D" value={p.defence ?? "-"} w sm testid={`subprofile-defence-${inst.instanceId}-${p.name}`} />
                  )}
                  <Stat label="C" value={p.cohesion ?? "-"} w sm testid={`subprofile-cohesion-${inst.instanceId}-${p.name}`} />
                  <Stat label="Pts/Unit" value={p.ptsUnit} big w sm testid={`subprofile-pts-unit-${inst.instanceId}-${p.name}`} />
                </div>
              </div>
              {(p.equipment.length > 0 || p.rules.length > 0) && (
                <div className="mt-2 pt-2 border-t border-slate-800/70 grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-cond text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                      Weapons and Armour
                    </div>
                    <div className="flex flex-wrap gap-1.5" data-testid={`subprofile-equipment-${inst.instanceId}-${p.name}`}>
                      {p.equipment.map((item) => (
                        <span
                          key={`eq-${item}`}
                          className="font-cond text-[11px] rounded px-2 py-0.5 border border-slate-700 bg-slate-800/60 text-slate-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-cond text-[11px] uppercase tracking-widest text-slate-500 mb-2">
                      Special Rules
                    </div>
                    <div className="flex flex-wrap gap-1.5" data-testid={`subprofile-rules-${inst.instanceId}-${p.name}`}>
                      {p.rules.map((r) => (
                        <span
                          key={`rl-${r}`}
                          className={`font-cond text-[11px] rounded px-2 py-0.5 border ${
                            isSkirmRule(r)
                              ? "border-amber-700/50 bg-amber-500/10 text-amber-300"
                              : "border-slate-700 bg-slate-800/60 text-slate-300"
                          }`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* base equipment + special rules — two columns (hidden when sub-profiles exist) */}
      {!calc.profiles?.length && (calc.equipment.length > 0 || calc.rules.length > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-4">
          <div>
            <div className="font-cond text-[11px] uppercase tracking-widest text-slate-500 mb-2">
              Weapons and Armour
            </div>
            <div className="flex flex-wrap gap-1.5" data-testid={`unit-base-equipment-${inst.instanceId}`}>
              {calc.equipment.map((item) => (
                <span
                  key={item}
                  className="font-cond text-[11px] rounded px-2 py-0.5 border border-slate-700 bg-slate-800/60 text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="font-cond text-[11px] uppercase tracking-widest text-slate-500 mb-2">
              Special Rules
            </div>
            <div className="flex flex-wrap gap-1.5" data-testid={`unit-special-rules-${inst.instanceId}`}>
              {calc.rules.map((r) => (
                <span
                  key={r}
                  className={`font-cond text-[11px] rounded px-2 py-0.5 border ${
                    isSkirmRule(r)
                      ? "border-amber-700/50 bg-amber-500/10 text-amber-300"
                      : "border-slate-700 bg-slate-800/60 text-slate-300"
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* equipment */}
      {(inst.optionalEquipment.length > 0 || inst.combinedFormation) && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="font-cond text-[11px] uppercase tracking-widest text-slate-500 mb-2">
            Unit Options
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {inst.combinedFormation && (
              <label
                data-testid={`combined-formation-wrap-${inst.instanceId}`}
                className="inline-flex items-center gap-2 font-cond text-sm select-none text-slate-300"
              >
                <span>Combined Formation %:</span>
                <select
                  data-testid={`combined-formation-${inst.instanceId}`}
                  value={inst.combinedFormationIndex || 0}
                  onChange={(e) => onChangeFormation(inst.instanceId, Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 font-cond text-sm text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {inst.combinedFormation.map((opt, i) => (
                    <option key={opt.label ?? i} value={i}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(() => {
              // Sub-profiles hidden by the current Combined Formation selection —
              // any option targeting one of these must be hidden too (and reappear
              // when the profile is re-enabled). Recomputes on every formation change.
              const cf = inst.combinedFormation;
              const hiddenProfiles =
                Array.isArray(cf) && cf.length
                  ? new Set(
                      cf[Math.min(inst.combinedFormationIndex || 0, cf.length - 1)]
                        ?.disableSubProfiles || []
                    )
                  : new Set();
              const disabledNames = new Set(
                inst.optionalEquipment
                  .filter((e) => inst.equipped.includes(e.name))
                  .flatMap((e) => e.disables || [])
              );
              const revealedNames = new Set(
                inst.optionalEquipment
                  .filter((e) => inst.equipped.includes(e.name))
                  .flatMap((e) => e.enableHidden || [])
              );
              return inst.optionalEquipment.map((eq) => {
                // hidden when ALL its target sub-profile(s) are disabled by the
                // combinedFormation (targetProfile may be a string or an array).
                if (eq.targetProfile != null) {
                  const targets = Array.isArray(eq.targetProfile)
                    ? eq.targetProfile
                    : [eq.targetProfile];
                  if (targets.length && targets.every((n) => hiddenProfiles.has(n)))
                    return null;
                }
                // hidden until revealed by a selected item's enableHidden
                if (eq.hiddenUntilEnabled === "hidden" && !revealedNames.has(eq.name)) return null;
                const on = inst.equipped.includes(eq.name);
                const usedCount = equipUsage?.[inst.unitId]?.[eq.name] || 0;
                const eqLimit = eq.maxEquipmentCount ?? eq.maxUnits;
                const atMaxUnits = eqLimit != null && !on && usedCount >= eqLimit;
                const everyLocked = enabledEveryLocked?.has(eq.name) || false;
                const blocked = (!on && (disabledNames.has(eq.name) || everyLocked)) || atMaxUnits;
                return (
                  <label
                    key={eq.name}
                    className={`inline-flex items-center gap-2 font-cond text-sm select-none ${
                      blocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      data-testid={`equip-${inst.instanceId}-${eq.name.replace(/\s+/g, "-").toLowerCase()}`}
                      checked={on}
                      disabled={blocked}
                      onChange={() => onToggleEquip(inst.instanceId, eq.name)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className={on ? "text-emerald-300" : "text-slate-300"}>
                      {eq.name}
                      <span className="text-slate-500">
                        {" "}
                        ({eq.pointsModifier >= 0 ? "+" : ""}
                        {eq.pointsModifier})
                      </span>
                    </span>
                  </label>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* secondary attachment */}
      {(inst.allowedSecondaryUnits || []).length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="font-cond text-[11px] uppercase tracking-widest text-slate-500 mb-2">
            Combined Unit
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-cond text-[10px] uppercase tracking-widest text-slate-500">
                Attach Secondary Unit
              </label>
              <select
                data-testid={`secondary-select-${inst.instanceId}`}
                value={inst.secondaryUnitId || ""}
                onChange={(e) => onSetSecondary(inst.instanceId, e.target.value || null)}
                className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 font-cond text-sm text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer min-w-[180px]"
              >
                <option value="">None</option>
                {inst.allowedSecondaryUnits.map((su) => (
                  <option key={su.unitId} value={su.unitId}>
                    {su.name}
                  </option>
                ))}
              </select>
            </div>

            {inst.secondaryUnitId && calc.secondary && (
              <div className="flex flex-col gap-1">
                <label className="font-cond text-[10px] uppercase tracking-widest text-slate-500">
                  Ratio
                </label>
                <select
                  data-testid={`secondary-ratio-${inst.instanceId}`}
                  value={inst.secondaryRatio || ""}
                  onChange={(e) => onSetRatio(inst.instanceId, e.target.value || null)}
                  className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 font-cond text-sm text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {ratiosFor(calc.secondary.unit).map((r) => (
                    <option key={r} value={r}>
                      {r}%
                    </option>
                  ))}
                </select>
              </div>
            )}

            {calc.secondary && (
              <div
                data-testid={`secondary-summary-${inst.instanceId}`}
                className="font-cond text-sm text-emerald-300 pb-1"
              >
                +{calc.secondary.bases} × {calc.secondary.unit.name}
                <span className="text-slate-500">
                  {" "}
                  ({calc.secondary.points} pts
                  {calc.secondary.isSkirm ? ", Skirmisher ≤6" : ""})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConstraintsTable({ categories, maxPoints }) {
  if (!categories.length) return null;
  return (
    <div data-testid="constraints-table" className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800">
        <h3 className="font-display font-bold tracking-wide text-slate-200 uppercase" style={{ fontSize: "1.25rem" }}>
          Army Composition
        </h3>
      </div>
      <table className="w-full text-left font-cond text-sm">
        <thead>
          <tr className="text-slate-500 font-body uppercase tracking-widest border-b border-slate-800" style={{ fontSize: "0.9rem" }}>
            <th className="px-4 py-2 font-semibold">Category</th>
            <th className="px-4 py-2 font-semibold">Type</th>
            <th className="px-4 py-2 font-semibold text-right">Limit</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const limit =
              cat.constraintType === "percentage"
                ? `${cat.min}–${cat.max}% (${Math.round(((cat.min ?? 0) / 100) * maxPoints)}–${Math.round(
                    ((cat.max ?? 100) / 100) * maxPoints
                  )} pts)`
                : cat.constraintType === "pointsRatio"
                ? `max ${pointsRatioMax(cat, maxPoints)} choices (${cat.countPerThreshold ?? 1} per ${cat.pointsThreshold} pts${
                    cat.countOffset ? (cat.countOffset > 0 ? ` + ${cat.countOffset}` : ` - ${Math.abs(cat.countOffset)}`) : ""
                  })`
                : `${cat.min}–${effectiveCatMax(cat, maxPoints)} choices`;
            return (
              <tr key={cat.id} className="border-b border-slate-800/60 last:border-0">
                <td className="px-4 py-0 text-slate-200 font-semibold">{cat.name}</td>
                <td className="px-4 py-0 text-slate-400 capitalize">{cat.constraintType}</td>
                <td className="px-4 py-0 text-right text-slate-300">{limit}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CategoryReport({ report }) {
  if (!report.length) return null;
  return (
    <div data-testid="category-report" className="mt-6">
      <h3 className="font-display text-sm font-bold tracking-wide text-slate-300 uppercase mb-2">
        Army Validation Report
      </h3>
      <div className="space-y-2">
        {report.map((r) => (
          <div
            key={r.id}
            data-testid={`category-report-${r.id}`}
            className={`rounded-lg border px-4 py-2.5 flex items-center justify-between gap-3 font-cond text-sm ${
              r.ok
                ? "border-emerald-700/50 bg-emerald-500/10"
                : "border-red-700/50 bg-red-500/10"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {r.ok ? (
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-red-400 shrink-0" />
              )}
              <span className={`font-semibold truncate ${r.ok ? "text-emerald-300" : "text-red-300"}`}>
                {r.name}
              </span>
            </div>
            <div className="text-right shrink-0">
              <div className={r.ok ? "text-emerald-200" : "text-red-200"}>{r.current}</div>
              <div className="text-slate-500 text-[11px]">allowed {r.allowed}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, big, testid, w, sm }) {
  const sizeCls = sm ? "text-[0.9rem]" : big ? "text-2xl" : "text-lg";
  const styleCls = big ? "font-extrabold text-emerald-400" : "font-bold text-slate-200";
  return (
    <div className={`text-center ${w ? "w-[56px] shrink-0" : ""}`}>
      <div className="font-cond text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">{label}</div>
      <div
        data-testid={testid}
        className={`font-display leading-none ${sizeCls} ${styleCls}`}
      >
        {value}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, danger, title, testid }) {
  return (
    <button
      title={title}
      data-testid={testid}
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 grid place-items-center rounded-md border transition-colors disabled:opacity-25 disabled:cursor-not-allowed ${
        danger
          ? "border-slate-700 bg-slate-800 text-red-400 hover:border-red-600 hover:text-red-300"
          : "border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-600 hover:text-emerald-300"
      }`}
    >
      {children}
    </button>
  );
}

function PrintSummary({ army, computed, totalPoints, maxPoints, isValid, warnings, categoryReport = [], totalBreakPoints = 0, armyBreakPoint = 0, breakPointsToBreak = 0, supplementName = "" }) {
  const renderUnitRows = ({ inst, calc }) => {
    const isCommander = isCommanderCat(inst.categoryId) || inst.type === "General";
    const combinedEquipment = calc.equipment;
    const hasProfiles = calc.profiles?.length > 0;
    const bp = unitBreakPoints(inst, calc);
    const boldC = { padding: "3px 4px 0", textAlign: "center", fontWeight: 700 };
    return (
      <tbody key={inst.instanceId} style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
        <tr style={{ verticalAlign: "top" }}>
          <td style={{ padding: "3px 4px 0", fontWeight: 600, textAlign: "left" }}>{inst.name}</td>
          <td style={{ padding: "3px 4px 0", textAlign: "left" }}>{inst.categoryId}</td>
          <td style={boldC}>{hasProfiles ? "-" : isCommander ? inst.attacks ?? "-" : "-"}</td>
          <td style={boldC}>{hasProfiles ? "-" : calc.defence ?? "-"}</td>
          <td style={boldC}>{hasProfiles ? "-" : calc.cohesion ?? "-"}</td>
          <td style={{ padding: "3px 4px 0", textAlign: "center" }}>{calc.mainBases}</td>
          <td style={{ padding: "3px 4px 0", textAlign: "center" }}>{calc.hasSubBases ? "–" : calc.ppbBase}</td>
          <td style={{ padding: "3px 4px 0", textAlign: "center" }}>{calc.hasSubBases ? "–" : calc.ppbOptions}</td>
          <td style={{ padding: "3px 4px 0", textAlign: "center" }}>{calc.hasSubBases ? "–" : calc.ppbTotal}</td>
          <td style={{ padding: "3px 4px 0", textAlign: "center" }}>{bp}</td>
          <td style={{ padding: "3px 4px 0", textAlign: "center", fontWeight: 600 }}>{calc.total}</td>
        </tr>
        {hasProfiles &&
          calc.profiles.map((p) => (
            <React.Fragment key={`pdf-${inst.instanceId}-${p.name}`}>
              <tr style={{ verticalAlign: "top" }}>
                <td style={{ padding: "0 4px 0 16px", fontWeight: 600, textAlign: "left" }}>{p.name}</td>
                <td style={{ padding: "0 4px" }} />
                <td style={{ padding: "0 4px", textAlign: "center", fontWeight: 700 }}>{p.attacks ?? "-"}</td>
                <td style={{ padding: "0 4px", textAlign: "center", fontWeight: 700 }}>{p.defence ?? "-"}</td>
                <td style={{ padding: "0 4px", textAlign: "center", fontWeight: 700 }}>{p.cohesion ?? "-"}</td>
                <td style={{ padding: "0 4px", textAlign: "center" }}>{calc.hasSubBases ? p.bases : "-"}</td>
                <td style={{ padding: "0 4px", textAlign: "center" }}>{p.ptsBase}</td>
                <td style={{ padding: "0 4px", textAlign: "center" }}>{p.ptsOptions}</td>
                <td style={{ padding: "0 4px", textAlign: "center" }}>{p.total}</td>
                <td style={{ padding: "0 4px", textAlign: "center" }}>{"\u00A0"}</td>
                <td style={{ padding: "0 4px", textAlign: "center" }}>{p.ptsUnit}</td>
              </tr>
              {p.rules.length > 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: "0 4px 0 16px", fontSize: "11px", color: "#0f172a" }}>
                    <strong>Special Rules:</strong> {p.rules.join(", ")}
                  </td>
                </tr>
              )}
              {p.equipment.length > 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: "0 4px 1px 16px", fontSize: "11px", color: "#0f172a" }}>
                    <strong>Equipment:</strong> {p.equipment.join(", ")}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        {!hasProfiles && calc.rules.length > 0 && (
          <tr>
            <td colSpan={11} style={{ padding: "0 4px 0", fontSize: "11px", color: "#0f172a" }}>
              <strong>Special Rules:</strong> {calc.rules.join(", ")}
            </td>
          </tr>
        )}
        {!hasProfiles && combinedEquipment.length > 0 && (
          <tr>
            <td colSpan={11} style={{ padding: "0 4px 2px", fontSize: "11px", color: "#0f172a" }}>
              <strong>Equipment:</strong> {combinedEquipment.join(", ")}
            </td>
          </tr>
        )}
        <tr style={{ borderBottom: "1px solid #cbd5e1" }}>
          <td colSpan={11} style={{ padding: 0 }} />
        </tr>
      </tbody>
    );
  };

  // Group units by category, in the army-validation-report order; drop empty
  // categories. Any unit whose categoryId isn't in the report is appended after.
  const nameById = {};
  categoryReport.forEach((r) => (nameById[r.id] = r.name));
  const groups = [];
  const seen = new Set();
  categoryReport.forEach((r) => {
    const units = computed.filter((c) => c.inst.categoryId === r.id);
    if (units.length) {
      groups.push({ id: r.id, name: r.name, units });
      seen.add(r.id);
    }
  });
  computed.forEach((c) => {
    const id = c.inst.categoryId;
    if (seen.has(id)) return;
    seen.add(id);
    groups.push({ id, name: nameById[id] || id, units: computed.filter((x) => x.inst.categoryId === id) });
  });

  return (
    <div className="print-summary" data-testid="print-summary">
      <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "22px", marginBottom: "2px" }}>
        {army?.armyName || "Army Roster"}
      </h1>
      {supplementName ? (
        <div style={{ fontSize: "12px", marginBottom: "2px" }}>
          Supplement name: <strong>{supplementName}</strong>
        </div>
      ) : null}
      <div style={{ fontSize: "12px", marginBottom: "2px" }}>
        Total Points: <strong>{totalPoints}</strong> / {maxPoints} &nbsp;·&nbsp; Status:{" "}
        <strong style={{ color: isValid ? "#059669" : "#b45309" }}>
          {isValid ? "VALID" : "WARNINGS PRESENT"}
        </strong>
      </div>
      <div style={{ fontSize: "12px", marginBottom: "10px" }}>
        Total Break Points: <strong>{totalBreakPoints}</strong> &nbsp;·&nbsp; Break Points to Army
        Break: <strong>{breakPointsToBreak}</strong> &nbsp;·&nbsp; Army Break Point:{" "}
        <strong>{armyBreakPoint}</strong>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ padding: "2px 4px", verticalAlign: "bottom", textAlign: "left" }}>Unit</th>
            <th rowSpan={2} style={{ padding: "2px 4px", verticalAlign: "bottom", textAlign: "left" }}>Category</th>
            <th rowSpan={2} style={{ padding: "2px 4px", verticalAlign: "bottom", textAlign: "center" }}>Atk</th>
            <th rowSpan={2} style={{ padding: "2px 4px", verticalAlign: "bottom", textAlign: "center" }}>Def</th>
            <th rowSpan={2} style={{ padding: "2px 4px", verticalAlign: "bottom", textAlign: "center" }}>Coh</th>
            <th rowSpan={2} style={{ padding: "2px 4px", verticalAlign: "bottom", textAlign: "center" }}>Bases</th>
            <th style={{ padding: "2px 4px 0", textAlign: "center" }}>Points</th>
            <th style={{ padding: "2px 4px 0", textAlign: "center" }}>Points</th>
            <th style={{ padding: "2px 4px 0", textAlign: "center" }}>Total</th>
            <th rowSpan={2} style={{ padding: "2px 4px", verticalAlign: "bottom", textAlign: "center" }}>BP</th>
            <th style={{ padding: "2px 4px 0", textAlign: "center" }}>Unit</th>
          </tr>
          <tr style={{ borderBottom: "2px solid #0f172a" }}>
            <th style={{ padding: "0 4px 2px", textAlign: "center" }}>Base</th>
            <th style={{ padding: "0 4px 2px", textAlign: "center" }}>Options</th>
            <th style={{ padding: "0 4px 2px", textAlign: "center" }}>Base</th>
            <th style={{ padding: "0 4px 2px", textAlign: "center" }}>Points</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <React.Fragment key={`grp-${group.id}`}>
            <tbody style={{ breakInside: "avoid", pageBreakInside: "avoid", breakAfter: "avoid", pageBreakAfter: "avoid" }}>
              <tr>
                <td
                  colSpan={11}
                  style={{
                    padding: "8px 4px 2px",
                    fontFamily: "Cinzel, serif",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "#0f172a",
                    borderBottom: "1px solid #94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {group.name}
                </td>
              </tr>
            </tbody>
            {group.units.map((u) => renderUnitRows(u))}
          </React.Fragment>
        ))}
      </table>

      {/* Army Validation Report */}
      {categoryReport.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ fontFamily: "Cinzel, serif", fontSize: "14px", marginBottom: "4px" }}>
            Army Validation Report
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #0f172a", textAlign: "left" }}>
                <th style={{ padding: "3px" }}>Category</th>
                <th style={{ padding: "3px" }}>Status</th>
                <th style={{ padding: "3px" }}>Current</th>
                <th style={{ padding: "3px" }}>Allowed</th>
              </tr>
            </thead>
            <tbody>
              {categoryReport.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "3px", fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: "3px", fontWeight: 700, color: r.ok ? "#059669" : "#dc2626" }}>
                    {r.ok ? "VALID" : "INVALID"}
                  </td>
                  <td style={{ padding: "3px" }}>{r.current}</td>
                  <td style={{ padding: "3px" }}>{r.allowed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isValid && warnings.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <h3 style={{ fontFamily: "Cinzel, serif", fontSize: "14px" }}>Validation Notes</h3>
          <ul style={{ fontSize: "11px", paddingLeft: "18px" }}>
            {warnings.map((w, i) => (
              <li key={`${w.msg}-${i}`}>{w.msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
