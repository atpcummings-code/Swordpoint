import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

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
      categories: [
        { id: "commanders", name: "Commanders", constraintType: "count", min: 1, max: 8 },
        { id: "teulu", name: "Teulu", constraintType: "percentage", min: 0, max: 33 },
        { id: "tenants", name: "Tenants", constraintType: "percentage", min: 0, max: 80 },
        { id: "skirmishers", name: "Skirmishers", constraintType: "percentage", min: 0, max: 10 },
        {
          id: "allies",
          name: "Allied Contingents",
          constraintType: "percentage",
          min: 0,
          max: 15,
          description:
            "You may include one allied contingent. Check an army below to add its non-General units. Allied units count toward this category's points limit.",
          alliedArmyKeys: ["vikings", "anglo_danish"],
          maxAlliedArmiesAllowed: 1,
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
          defence: 4,
          cohesion: 7,
          pointsPerBase: 20,
          minBases: 3,
          maxBases: 8,
          maxCountAllowed: 2,
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
          minBases: 3,
          maxBases: 8,
          specialRules: ["Superior Fighters", "Open Order", "Warband"],
          optionalEquipment: [
            {
              name: "Light Armour",
              pointsModifier: 2,
              rulesAdded: [],
              rulesRemoved: [],
              defenceModifier: -1,
              cohesionModifier: 0,
            },
            {
              name: "Throwing Spears",
              pointsModifier: 2,
              rulesAdded: [],
              rulesRemoved: [],
              defenceModifier: 0,
              cohesionModifier: 0,
            },
            {
              name: "Riding Horses",
              pointsModifier: 2,
              rulesAdded: ["Riding Horses"],
              rulesRemoved: [],
              defenceModifier: 0,
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
          specialRules: ["Warband", "Open Order"],
          optionalEquipment: [
            {
              name: "Riding Horses",
              pointsModifier: 1,
              rulesAdded: ["Riding Horses"],
              rulesRemoved: [],
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

function makeInstance(unit, sourceArmyKey, categoryOverride) {
  return {
    instanceId: uid(),
    unitId: unit.id,
    sourceArmyKey,
    categoryId: categoryOverride || unit.category || (unit.type === "General" ? "commanders" : "other"),
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
    optionalEquipment: Array.isArray(unit.optionalEquipment) ? unit.optionalEquipment : [],
    equipped: [],
    allowedSecondaryUnits: Array.isArray(unit.allowedSecondaryUnits) ? unit.allowedSecondaryUnits : [],
    secondaryUnitId: null,
    secondaryRatio: null,
    minCountAllowed: unit.minCountAllowed ?? null,
    maxCountAllowed: unit.maxCountAllowed ?? null,
  };
}

const GLOBAL_RATIOS = [25, 33, 50, 67, 75];

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

  const isSkirm = rules.some(isSkirmRule);
  const effMax = isSkirm ? Math.min(inst.maxBases, 6) : inst.maxBases;
  const effMin = isSkirm ? 2 : inst.minBases;

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

  const total = ppb * inst.bases + (secondary ? secondary.points : 0);
  return { ppb, defence, cohesion, rules, isSkirm, effMax, effMin, total, active, secondary };
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
      if (opts.keepSelection && parsed.armies[selectedArmyKey]) {
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
      setSelectedArmyKey("");
      setRoster([]);
      setCheckedAllies([]);
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

  /* --- army switch: full state cleanup to avoid overlap logic bugs --- */
  const handleArmyChange = (key) => {
    setSelectedArmyKey(key);
    setRoster([]);
    setCheckedAllies([]);
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

  const toggleEquipment = (instanceId, equipName) => {
    updateInst(instanceId, (i) => {
      const has = i.equipped.includes(equipName);
      const equipped = has
        ? i.equipped.filter((n) => n !== equipName)
        : [...i.equipped, equipName];
      let next = { ...i, equipped };
      // Skirmisher rule override — clamp bases into [2, 6] when activated
      const { isSkirm, effMax, effMin } = computeUnit(next);
      if (isSkirm && next.bases > 6) next = { ...next, bases: 6 };
      if (next.bases > effMax) next = { ...next, bases: effMax };
      if (next.bases < effMin) next = { ...next, bases: effMin };
      return next;
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
      const clone = {
        ...prev[idx],
        equipped: [...prev[idx].equipped],
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

  const toggleAlly = (allyKey) => {
    setCheckedAllies((prev) => {
      if (prev.includes(allyKey)) {
        // uncheck -> purge every roster instance sourced from this ally
        setRoster((r) => r.filter((i) => i.sourceArmyKey !== allyKey));
        return prev.filter((k) => k !== allyKey);
      }
      return [...prev, allyKey];
    });
  };

  /* --- computed roster + validation --- */
  const computed = useMemo(
    () => roster.map((i) => ({ inst: i, calc: computeUnit(i) })),
    [roster]
  );
  const totalPoints = computed.reduce((s, c) => s + c.calc.total, 0);

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

    if (alliesCategory && checkedAllies.length > maxAllies) {
      w.push({
        level: "critical",
        msg: `This army book only allows selecting a maximum of ${maxAllies} allied army(s) simultaneously.`,
      });
    }

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
        const n = inCat.length;
        if (n < (cat.min ?? 0))
          w.push({
            level: "warning",
            msg: `${cat.name}: requires at least ${cat.min} unit choice(s) — currently ${n}.`,
          });
        if (cat.max != null && n > cat.max)
          w.push({
            level: "warning",
            msg: `${cat.name}: allows at most ${cat.max} unit choice(s) — currently ${n}.`,
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
      if (i.maxCountAllowed != null && counts[i.unitId] > i.maxCountAllowed) {
        w.push({
          level: "critical",
          msg: `Validation Error: You have added ${counts[i.unitId]} units of '${i.name}', but a maximum of ${i.maxCountAllowed} is allowed.`,
        });
      }
    });

    // Minimum limit: check every available unit (home + enabled allies) with minCountAllowed > 0
    const availableUnits = [...(army.units || [])];
    (army.categories || []).forEach((cat) => {
      if (Array.isArray(cat.alliedArmyKeys)) {
        cat.alliedArmyKeys.forEach((ak) => {
          if (checkedAllies.includes(ak) && armies[ak]) {
            availableUnits.push(...(armies[ak].units || []));
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

    return w;
  }, [army, armies, computed, totalPoints, maxPoints, roster, checkedAllies, alliesCategory, maxAllies]);

  const isValid = warnings.length === 0 && roster.length > 0;

  /* --- per-category validation report --- */
  const categoryReport = useMemo(() => {
    if (!army) return [];
    return (army.categories || []).map((cat) => {
      const inCat = computed.filter((c) => c.inst.categoryId === cat.id);
      if (cat.constraintType === "count") {
        const n = inCat.length;
        const ok = n >= (cat.min ?? 0) && (cat.max == null || n <= cat.max);
        return {
          id: cat.id,
          name: cat.name,
          ok,
          current: `${n} choice${n === 1 ? "" : "s"}`,
          allowed: `${cat.min}–${cat.max} choices`,
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
      <header className="no-print border-b border-slate-800/80 bg-slate-950/70 backdrop-blur sticky top-0 z-30">
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

          {data && (
            <p className="font-cond text-slate-400 text-sm -mt-1 flex items-center gap-2 flex-wrap justify-center">
              <span>{data.supplement || "Army Supplement"}</span>
              <span>·</span>
              <span className={source === "remote" ? "text-emerald-400" : "text-amber-400"}>
                {source === "remote" ? "Live data" : "Offline sample data"}
              </span>
              <button
                data-testid="reload-json-btn"
                onClick={() => loadData(selectedSupplementUrl, { keepSelection: true })}
                disabled={reloading || !selectedSupplementUrl}
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 hover:border-emerald-600 hover:text-emerald-300 text-slate-300 px-2.5 py-0.5 text-xs disabled:opacity-40"
              >
                <RefreshCw size={12} className={reloading ? "animate-spin" : ""} /> Reload JSON
              </button>
            </p>
          )}

          {loadError && (
            <div
              data-testid="load-error"
              className="w-full max-w-2xl rounded-md border border-amber-700/50 bg-amber-500/10 text-amber-300 px-3 py-1.5 text-xs font-cond flex items-start gap-2"
            >
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>Remote data unavailable — using sample data. {loadError}</span>
            </div>
          )}

          {/* Supplement + Army dropdowns */}
          <div className="flex items-end gap-6 mt-1 flex-wrap justify-center">
            <div className="flex flex-col items-start gap-1">
              <label htmlFor="supplement-select" className="font-cond uppercase text-xs tracking-widest text-slate-500">
                Supplement
              </label>
              <select
                id="supplement-select"
                data-testid="supplement-select"
                value={selectedSupplementUrl}
                onChange={(e) => handleSupplementChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-4 py-2 font-cond text-base text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-w-[260px] cursor-pointer"
              >
                <option value="">— Select a supplement —</option>
                {SUPPLEMENTS.map((s) => (
                  <option key={s.url} value={s.url}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {data && (
              <div className="flex flex-col items-start gap-1">
                <label htmlFor="army-select" className="font-cond uppercase text-xs tracking-widest text-slate-500">
                  Army
                </label>
                <select
                  id="army-select"
                  data-testid="army-select"
                  value={selectedArmyKey}
                  onChange={(e) => handleArmyChange(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-md px-4 py-2 font-cond text-base text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-w-[280px] cursor-pointer"
                >
                  <option value="">— Select an army —</option>
                  {armyKeys.map((k) => (
                    <option key={k} value={k}>
                      {armies[k].armyName}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
        <section data-testid="catalog-panel" className="min-w-0" style={{ height: "100%", overflowY: "auto" }}>
          <div className="flex items-center gap-2 mb-4 sticky top-0 z-20 bg-[#020617] py-2">
            <Users size={18} className="text-slate-400" />
            <h2 className="font-display text-lg font-bold tracking-wide text-slate-200">
              {army?.armyName || "Army Composition"}
            </h2>
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
                armies={armies}
                checkedAllies={checkedAllies}
                maxAllies={maxAllies}
                onToggleAlly={toggleAlly}
                onAdd={addUnit}
              />
            ))}
          </div>
        </section>

        {/* ====== RIGHT: Roster ====== */}
        <section data-testid="roster-panel" className="min-w-0" style={{ height: "100%", overflowY: "auto" }}>
          {/* Column header — sticky; opaque bg extends to meet the summary box */}
          <div className="flex items-center gap-2 sticky top-0 z-30 bg-[#020617] pt-2 pb-4">
            <Flag size={18} className="text-slate-400" />
            <h2 className="font-display text-lg font-bold tracking-wide text-slate-100">
              Active Army Roster
            </h2>
          </div>

          {/* Roster summary box + validation — fixed (sticky) so they don't scroll */}
          <div className="mb-4 sticky top-[52px] z-20 bg-[#020617] pb-3">
            <div className="rounded-xl border-2 border-emerald-400 p-4 backdrop-blur bg-slate-950/90">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="font-cond uppercase text-[11px] tracking-widest text-slate-500">
                  Roster Summary
                </span>
                <StatusBadge isValid={isValid} empty={roster.length === 0} />
              </div>

              <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
                <div className="flex flex-col">
                  <label
                    htmlFor="max-points"
                    className="font-cond uppercase text-[11px] tracking-widest text-slate-500 mb-1"
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
                    className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 w-32 font-cond text-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="text-right">
                  <div className="font-cond uppercase text-[11px] tracking-widest text-slate-500">
                    Total / Limit
                  </div>
                  <div
                    data-testid="total-points"
                    className={`font-display text-3xl font-extrabold leading-none ${
                      totalPoints > maxPoints ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {totalPoints}
                    <span className="text-slate-500 text-xl font-semibold"> / {maxPoints}</span>
                  </div>
                </div>

                <button
                  data-testid="export-pdf-btn"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-cond font-semibold px-5 py-2 transition-colors"
                >
                  <Printer size={16} /> Export Roster to PDF
                </button>
              </div>
            </div>

            {/* Validation panel */}
            <ValidationPanel warnings={warnings} isValid={isValid} empty={roster.length === 0} />
          </div>

          {/* Roster list */}
          {roster.length === 0 ? (
            <div
              data-testid="empty-roster"
              className="rounded-xl border border-dashed border-slate-800 p-10 text-center font-cond text-slate-500"
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
                  armies={armies}
                  index={idx}
                  total={roster.length}
                  onChangeBases={changeBases}
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
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 text-slate-400 px-3 py-1 font-cond text-sm"
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
          key={i}
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

function CatalogCategory({ cat, army, homeKey, armies, checkedAllies, maxAllies, onToggleAlly, onAdd }) {
  const homeUnits = (army?.units || []).filter((u) => u.category === cat.id);
  const isAllies = Array.isArray(cat.alliedArmyKeys);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-display text-base font-bold tracking-wide text-slate-200">
          {cat.name}
        </h3>
        <span className="font-cond text-[11px] uppercase tracking-widest text-slate-500">
          {cat.constraintType === "percentage"
            ? `${cat.min}–${cat.max}%`
            : `${cat.min}–${cat.max} choices`}
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
          <CatalogUnit key={u.id} unit={u} onAddUnit={onAdd} armyKey={homeKey} />
        ))}

        {/* Allied selection */}
        {isAllies && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {cat.alliedArmyKeys.map((ak) => {
                const ally = armies[ak];
                if (!ally) return null;
                const checked = checkedAllies.includes(ak);
                const disabled = !checked && checkedAllies.length >= maxAllies;
                return (
                  <label
                    key={ak}
                    className={`inline-flex items-center gap-2 font-cond text-sm select-none ${
                      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      data-testid={`ally-checkbox-${ak}`}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onToggleAlly(ak)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <span className={checked ? "text-emerald-300" : "text-slate-300"}>
                      {ally.armyName}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Active allied units (non-General only) */}
            {cat.alliedArmyKeys
              .filter((ak) => checkedAllies.includes(ak) && armies[ak])
              .map((ak) => (
                <div key={ak} className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-2 space-y-2">
                  <div className="font-cond text-xs uppercase tracking-widest text-emerald-400 px-1">
                    {armies[ak].armyName}
                  </div>
                  {(armies[ak].units || [])
                    .filter((u) => u.type !== "General")
                    .map((u) => (
                      <CatalogUnit key={ak + u.id} unit={u} onAddUnit={onAdd} armyKey={ak} categoryOverride={cat.id} />
                    ))}
                </div>
              ))}
          </div>
        )}

        {homeUnits.length === 0 && !isAllies && (
          <p className="font-cond text-sm text-slate-600 px-1 py-1">No units in this category.</p>
        )}
      </div>
    </div>
  );
}

function CatalogUnit({ unit, onAddUnit, armyKey, categoryOverride }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {unit.type === "General" && <Crown size={14} className="text-amber-400 shrink-0" />}
          <span className="font-cond font-semibold text-slate-100 truncate">{unit.name}</span>
        </div>
        <p className="font-body text-xs text-slate-500 mt-0.5 line-clamp-2">{unit.description}</p>
        <div className="flex flex-wrap gap-2 mt-1.5 font-cond text-[11px] text-slate-400">
          <span className="text-emerald-400 font-semibold">{unit.pointsPerBase} pts/base</span>
          <span>· {unit.minBases}–{unit.maxBases} bases</span>
          {unit.defence != null && <span>· Def {unit.defence}</span>}
          {unit.attacks != null && <span>· Atk {unit.attacks}</span>}
          {unit.cohesion != null && <span>· Coh {unit.cohesion}</span>}
        </div>
      </div>
      <button
        data-testid={`add-unit-${unit.id}`}
        onClick={() => onAddUnit(unit, armyKey, categoryOverride)}
        className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-cond font-semibold text-sm px-3 py-1.5 transition-colors"
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
  onChangeBases,
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

  return (
    <div
      data-testid={`roster-row-${inst.instanceId}`}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
    >
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
          {inst.description && (
            <p
              data-testid={`unit-description-${inst.instanceId}`}
              className="font-body text-xs text-slate-400 mt-1 max-w-md"
            >
              {inst.description}
            </p>
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

      {/* stats + bases */}
      <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            data-testid={`bases-minus-${inst.instanceId}`}
            disabled={atMin}
            onClick={() => onChangeBases(inst.instanceId, -1)}
            className="w-8 h-8 grid place-items-center rounded-md border border-slate-700 bg-slate-800 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-emerald-600"
          >
            <Minus size={15} />
          </button>
          <div className="text-center min-w-[64px]">
            <div data-testid={`bases-count-${inst.instanceId}`} className="font-display text-xl font-bold text-slate-100 leading-none">
              {inst.bases}
            </div>
            <div className="font-cond text-[10px] uppercase tracking-widest text-slate-500">
              bases ({calc.effMin}–{calc.effMax})
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

        {/* per-base points breakdown — centred immediately after the bases controls */}
        <div className="flex items-center gap-6 font-cond text-sm">
          <Stat label="Pts/Base" value={inst.basePointsPerBase} testid={`unit-pts-base-${inst.instanceId}`} />
          <Stat
            label="Pts/Options"
            value={calc.ppb - inst.basePointsPerBase}
            testid={`unit-pts-options-${inst.instanceId}`}
          />
          <Stat label="Total" value={calc.ppb} testid={`unit-pts-total-${inst.instanceId}`} />
        </div>

        <div className="flex items-center gap-5 font-cond text-sm">
          {isCommanderCat(inst.categoryId) || inst.type === "General" ? (
            <Stat label="A" value={inst.attacks ?? "-"} testid={`unit-attacks-${inst.instanceId}`} />
          ) : (
            <Stat label="D" value={calc.defence ?? "-"} testid={`unit-defence-${inst.instanceId}`} />
          )}
          <Stat label="C" value={calc.cohesion ?? "-"} testid={`unit-cohesion-${inst.instanceId}`} />
          <Stat label="Pts/Unit" value={calc.total} big testid={`unit-total-${inst.instanceId}`} />
        </div>
      </div>

      {/* equipment */}
      {inst.optionalEquipment.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="font-cond text-[11px] uppercase tracking-widest text-slate-500 mb-2">
            Unit Options
          </div>
          <div className="flex flex-wrap gap-3">
            {inst.optionalEquipment.map((eq) => {
              const on = inst.equipped.includes(eq.name);
              return (
                <label
                  key={eq.name}
                  className="inline-flex items-center gap-2 font-cond text-sm cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    data-testid={`equip-${inst.instanceId}-${eq.name.replace(/\s+/g, "-").toLowerCase()}`}
                    checked={on}
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
            })}
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

      {/* active rules */}
      {calc.rules.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
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
      )}
    </div>
  );
}

function ConstraintsTable({ categories, maxPoints }) {
  if (!categories.length) return null;
  return (
    <div data-testid="constraints-table" className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800">
        <h3 className="font-display text-sm font-bold tracking-wide text-slate-300 uppercase">
          Army Composition
        </h3>
      </div>
      <table className="w-full text-left font-cond text-sm">
        <thead>
          <tr className="text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-800">
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
                : `${cat.min}–${cat.max} choices`;
            return (
              <tr key={cat.id} className="border-b border-slate-800/60 last:border-0">
                <td className="px-4 py-2 text-slate-200 font-semibold">{cat.name}</td>
                <td className="px-4 py-2 text-slate-400 capitalize">{cat.constraintType}</td>
                <td className="px-4 py-2 text-right text-slate-300">{limit}</td>
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

function Stat({ label, value, big, testid }) {
  return (
    <div className="text-center">
      <div className="font-cond text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">{label}</div>
      <div
        data-testid={testid}
        className={`font-display leading-none ${
          big ? "text-2xl font-extrabold text-emerald-400" : "text-lg font-bold text-slate-200"
        }`}
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

function PrintSummary({ army, computed, totalPoints, maxPoints, isValid, warnings, categoryReport = [] }) {
  return (
    <div className="print-summary" data-testid="print-summary">
      <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "22px", marginBottom: "2px" }}>
        {army?.armyName || "Army Roster"}
      </h1>
      <div style={{ fontSize: "12px", marginBottom: "10px" }}>
        Total Points: <strong>{totalPoints}</strong> / {maxPoints} &nbsp;·&nbsp; Status:{" "}
        <strong style={{ color: isValid ? "#059669" : "#b45309" }}>
          {isValid ? "VALID" : "WARNINGS PRESENT"}
        </strong>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #0f172a", textAlign: "left" }}>
            <th style={{ padding: "4px" }}>Unit</th>
            <th style={{ padding: "4px" }}>Category</th>
            <th style={{ padding: "4px" }}>Bases</th>
            <th style={{ padding: "4px" }}>Atk</th>
            <th style={{ padding: "4px" }}>Def</th>
            <th style={{ padding: "4px" }}>Coh</th>
            <th style={{ padding: "4px" }}>Rules</th>
            <th style={{ padding: "4px", textAlign: "right" }}>Points</th>
          </tr>
        </thead>
        <tbody>
          {computed.map(({ inst, calc }) => {
            const isCommander = isCommanderCat(inst.categoryId) || inst.type === "General";
            return (
              <React.Fragment key={inst.instanceId}>
                <tr style={{ verticalAlign: "top" }}>
                  <td style={{ padding: "4px 4px 1px", fontWeight: 600 }}>{inst.name}</td>
                  <td style={{ padding: "4px 4px 1px" }}>{inst.categoryId}</td>
                  <td style={{ padding: "4px 4px 1px" }}>{inst.bases}</td>
                  <td style={{ padding: "4px 4px 1px" }}>{isCommander ? inst.attacks ?? "-" : "-"}</td>
                  <td style={{ padding: "4px 4px 1px" }}>{calc.defence ?? "-"}</td>
                  <td style={{ padding: "4px 4px 1px" }}>{calc.cohesion ?? "-"}</td>
                  <td style={{ padding: "4px 4px 1px" }}>{calc.rules.join(", ")}</td>
                  <td style={{ padding: "4px 4px 1px", textAlign: "right", fontWeight: 600 }}>{calc.total}</td>
                </tr>
                <tr style={{ borderBottom: inst.equipped.length ? "none" : "1px solid #cbd5e1" }}>
                  <td colSpan={8} style={{ padding: "0 4px 5px", fontStyle: "italic", color: "#475569", fontSize: "11px" }}>
                    {inst.description || "-"}
                  </td>
                </tr>
                {inst.equipped.length > 0 && (
                  <tr style={{ borderBottom: "1px solid #cbd5e1" }}>
                    <td colSpan={8} style={{ padding: "0 4px 5px", fontSize: "11px", color: "#0f172a" }}>
                      <strong>Optional Equipment:</strong>{" "}
                      {calc.active.map((e) => e.name).join(", ")}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
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
              <li key={i}>{w.msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
