// data.js
// Seeded synthetic Catalyst roster + compliance status rules.
//
// SCOPE BOUNDARY — READ THIS FIRST:
// This data model tracks training logistics ONLY.
// Schema contains: id, name, spotName, rcId, completionDate, expiryDate, status.
// There are NO fields for incidents, concerns, case notes, allegations,
// or any Catalyst-conduct information. This is enforced structurally —
// the schema does not allow such data, not merely omit it from display.
//
// Training validity: 12-month renewal cycle from completionDate.
// Assumption: real renewal cadence should be confirmed against EduSpots'
// actual "Keeping Spots Safe" policy before this is used in production.

// ── Seeded PRNG (mulberry32) ────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0xED057);  // fixed seed → reproducible demo

// ── Name parts for synthetic Catalyst names ─────────────────────────────────
// Names are invented composites — not real individuals.
const FIRST_NAMES = [
  "Abena","Adjoa","Afua","Ama","Akosua","Akua","Araba","Efua","Esi","Maame",
  "Adwoa","Yaa","Abenaa","Akye","Afia","Aba","Akorfa","Elikplim","Dzifa","Sena",
  "Kofi","Kwame","Kweku","Kwabena","Kwasi","Kojo","Kwadwo","Yaw","Fiifi","Nana",
  "Adjei","Ato","Ebow","Kobby","Mawuli","Selorm","Dela","Senyo","Kafui","Agbeko",
  "Fatima","Amina","Hawa","Mariama","Salamatu","Zenabu","Rahima","Aisha","Alima","Hasana",
  "Ibrahim","Mohammed","Abdulai","Yakubu","Fuseini","Iddrisu","Haruna","Seidu","Amadu","Alhassan",
  "Patience","Grace","Mercy","Comfort","Beatrice","Cecilia","Felicia","Perpetua","Vida","Gifty",
  "Emmanuel","Samuel","Daniel","Joseph","Michael","Benjamin","Richard","George","Felix","Victor",
];
const LAST_NAMES = [
  "Mensah","Asante","Boateng","Owusu","Osei","Agyei","Darko","Appiah","Amoah","Frimpong",
  "Tetteh","Quaye","Laryea","Nartey","Ankrah","Lamptey","Sowah","Dodoo","Quartey","Nortey",
  "Agbesi","Adzaho","Akpalu","Dzidzor","Fiagbedzi","Gadzekpo","Klutse","Norviewu","Tsikata","Amedofu",
  "Sarpong","Twum","Poku","Baffour","Ntim","Opoku","Bediako","Asare","Kyei","Yeboah",
  "Sulemana","Yakubu","Mahama","Issah","Fuseini","Damoa","Tampuri","Ziblim","Alhassan","Naab",
  "Acheampong","Ofori","Bonsu","Adjei","Ocran","Asiedu","Adusei","Nkrumah","Aidoo","Asamoah",
];

function syntheticName(r) {
  const first = FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)];
  const last  = LAST_NAMES[Math.floor(r()  * LAST_NAMES.length)];
  return `${first} ${last}`;
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

// ── Status computation (transparent, no black-box scoring) ──────────────────
// Inputs: expiryDate (Date), today (Date)
// Outputs: "overdue" | "expiring-soon" | "compliant"
// Rules:
//   overdue      → today > expiryDate
//   expiring-soon → expiryDate is within 30 days from today
//   compliant    → all other cases
function computeComplianceStatus(expiryDate, today) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilExpiry = Math.ceil((expiryDate - today) / msPerDay);

  if (daysUntilExpiry < 0) {
    return {
      status: "overdue",
      reason: `Training expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? "s" : ""} ago`,
      daysUntilExpiry,
    };
  }
  if (daysUntilExpiry <= 30) {
    return {
      status: "expiring-soon",
      reason: `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} — renewal not yet scheduled`,
      daysUntilExpiry,
    };
  }
  return {
    status: "compliant",
    reason: null,
    daysUntilExpiry,
  };
}

// ── Synthetic roster generation ──────────────────────────────────────────────
// Generates ~130 Catalysts.
// Status distribution: ~80% compliant, ~10% expiring-soon, ~10% overdue.
// Weighted via biased random date generation — mirrors Projects #1/#2 approach.
function generateCatalysts(today) {
  const catalysts = [];
  const TARGET = 130;

  // RC→Spot affinity: loosely assign Spots to RCs for realism
  const rcSpotMap = {
    rc1: REAL_SPOT_NAMES.slice(0, 14),   // Volta Region cluster
    rc2: REAL_SPOT_NAMES.slice(14, 28),  // Northern Region cluster
    rc3: REAL_SPOT_NAMES.slice(28, 42),  // Central/Western cluster
    rc4: REAL_SPOT_NAMES.slice(42),      // New Spots cluster
  };
  const rcIds = ["rc1", "rc2", "rc3", "rc4"];

  for (let i = 0; i < TARGET; i++) {
    const rcId  = rcIds[Math.floor(rand() * rcIds.length)];
    const spots = rcSpotMap[rcId];
    const spotName = spots[Math.floor(rand() * spots.length)];
    const name  = syntheticName(rand);

    // Bias: ~80% get a recent completion (compliant zone),
    //       ~10% expiring-soon, ~10% overdue
    const roll = rand();
    let completionDate;

    if (roll < 0.10) {
      // Overdue: completed 12–24 months ago (expired)
      const daysAgo = Math.floor(rand() * 365) + 366;
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      completionDate = d;
    } else if (roll < 0.20) {
      // Expiring-soon: expires within 30 days → completed 11-12 months ago
      const daysAgo = Math.floor(rand() * 30) + 335;
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      completionDate = d;
    } else {
      // Compliant: completed 0–11 months ago
      const daysAgo = Math.floor(rand() * 335);
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      completionDate = d;
    }

    const expiryDate = addMonths(completionDate, 12);
    const { status, reason, daysUntilExpiry } = computeComplianceStatus(expiryDate, today);

    // Training history: 1–3 previous completions before the current one
    const historyCount = Math.floor(rand() * 3);
    const trainingHistory = [];
    let prevDate = new Date(completionDate);
    for (let h = 0; h < historyCount; h++) {
      prevDate = addMonths(prevDate, -12);
      // Slight jitter (±2 weeks) to avoid perfectly regular intervals
      const jitter = Math.floor((rand() - 0.5) * 14);
      const histDate = new Date(prevDate);
      histDate.setDate(histDate.getDate() + jitter);
      trainingHistory.unshift(toISO(histDate));
    }

    catalysts.push({
      // ── COMPLETE SCHEMA ──────────────────────────────────────────────────
      // id, name, spotName, rcId, completionDate, expiryDate, status
      // Nothing else. No incident, concern, conduct, or case fields.
      id:              `cat-${String(i + 1).padStart(3, "0")}`,
      name,
      spotName,
      rcId,
      completionDate:  toISO(completionDate),
      expiryDate:      toISO(expiryDate),
      status,
      reason,
      daysUntilExpiry,
      trainingHistory, // array of prior completion dates (ISO strings) only
    });
  }

  return catalysts;
}

// ── Acknowledgement log (in-memory, session only) ────────────────────────────
// Records that an RC has been notified and has taken ownership of following up.
// This NEVER changes a Catalyst's compliance status.
// Only a real completed training event in the data model changes status.
const acknowledgements = {};

function acknowledgeReminder(catalystId) {
  acknowledgements[catalystId] = {
    acknowledgedAt: new Date().toISOString(),
    note: "RC notified — follow-up ownership logged",
  };
}

function isAcknowledged(catalystId) {
  return Boolean(acknowledgements[catalystId]);
}

// ── Exports ──────────────────────────────────────────────────────────────────
// TODAY is fixed for the demo so the seeded data is stable.
// In production, replace with `new Date()`.
const TODAY = new Date("2025-07-01");

const CATALYSTS = generateCatalysts(TODAY);
