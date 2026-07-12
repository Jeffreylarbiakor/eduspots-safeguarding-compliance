# Keeping Spots Safe — Training Compliance Tracker

**EduSpots operations portfolio · Project #4 of 5**

![Status: Prototype](https://img.shields.io/badge/status-prototype-D9A62E?style=flat-square)

Maps directly to these lines in the Head of Programme & Product Operations job description:

> *"Oversight of child protection and safeguarding in Ghana, and wider risk management and promotion of well-being and inclusion is at the heart of all our programme planning, taking a leadership role in safeguarding, dependent on experience."*

> *"Liaise with the Keeping Spots Safe Coordinator and Head of Education to ensure that our educational approach to safeguarding feeds into safeguarding systems effectively."*

---

## The most important thing about this tool: what it does NOT do

**This is a training logistics tracker. It is explicitly and deliberately not a safeguarding case-management or incident-tracking system.**

This boundary is structural, not just a UI choice:

- **Tracked:** who has completed training, when their training expires, who is overdue for renewal — and nothing else.
- **Not tracked, not stored, not referenced anywhere:** safeguarding incidents, concerns, reports, allegations, case notes, or any Catalyst-conduct information. These fields do not exist in the data model. They cannot be added to a row. They are not placeholders for future features.

Why this matters more here than anywhere else in the portfolio: getting this scope wrong would be a real safeguarding failure, not a design nitpick. Incident and concern data requires proper case-management systems, designated safeguarding leads, and human-controlled workflows — not a compliance tracker.

For actual safeguarding concerns, follow EduSpots' *Keeping Spots Safe* policy and contact the designated leads directly.

---

## How it works

### Status rules — transparent, not a black box

Every Catalyst's status is computed by `computeComplianceStatus()` in `js/data.js` using three explicit, named rules:

| Status | Rule |
|---|---|
| **Overdue** | Today's date is past `expiryDate` |
| **Expiring soon** | `expiryDate` is within the next 30 days |
| **Compliant** | Neither of the above |

Training validity is a **12-month renewal cycle** from `completionDate`. This assumption is stated plainly here and in the code. The real renewal cadence should be confirmed against EduSpots' actual *Keeping Spots Safe* policy before this tool is used in production.

Every flagged Catalyst carries the specific reason (e.g. "Training expired 12 days ago," "Expires in 8 days — renewal not yet scheduled") — dates only, never behavioural inference.

### AI/human split

Automation does one thing: tracks dates and flags renewals. Humans do everything else.

- The tool outputs: trained / not trained, expires on X, overdue by X days, a list of who needs follow-up.
- The tool never outputs: anything about *why* a person might be flagged beyond "training lapsed," no risk scores, no inferences about a person's conduct or reliability.
- The "Acknowledge — reminder sent" button logs that an RC has been notified and owns follow-up. It **never** changes a Catalyst's compliance status. Only a real completed training event in the data model can do that.

---

## Views

### Overview
KPI row (total Catalysts, % compliant, expiring in 30 days, currently overdue, average days overdue) plus two charts: compliance rate by RC cluster (bar) and training completions over the last 12 months (line). The completions chart shows whether the network is keeping pace with renewals — not individual behaviour.

### Compliance Roster
Full table of all Catalysts: name, Spot, RC, completion date, expiry date, status badge. Filterable by RC cluster and status. Clicking any row opens a detail modal showing training history (completion dates only — a simple "Trained: [date]" list and next renewal due date). No contact information, no conduct fields.

### RC Clusters
Compliance summary grouped by Regional Coordinator: total / compliant / expiring soon / overdue counts and cluster compliance %. Same structure as Projects #1 and #2.

### Renewal Reminders
Every Catalyst who is expiring soon or overdue, with the specific date-based reason stated plainly. Per-Catalyst "Acknowledge — reminder sent" button for RC follow-up logging. Acknowledged cards are visually de-emphasised but not removed — the record stays visible.

---

## Design system

Identical to Projects #1–3:

```css
--forest: #123524   /* primary, sidebar */
--gold:   #D9A62E   /* expiring soon */
--sky:    #3E7CB1   /* secondary data colour */
--clay:   #B54834   /* overdue only — not decorative */
--paper:  #F6F2E9   /* background */
```

Fonts: Space Grotesk (headings), IBM Plex Sans (body), IBM Plex Mono (timestamps, badges, IDs). Forest-green sidebar with sticky viewport-pinned layout and Kente-inspired accent stripe. The visual register is deliberately calm and administrative — plain tables and status badges, nothing that dramatises individual records.

---

## Stack

- Plain HTML / CSS / JavaScript — no build step, no npm required
- [Chart.js 4.4](https://www.chartjs.org/) via CDN for charts
- Seeded PRNG (`mulberry32`) for reproducible synthetic demo data

```
eduspots-safeguarding-compliance/
  index.html
  css/styles.css
  js/data.js          seeded synthetic generator + status rules
  js/real-data.js     real Spot / RC / programme facts
  js/charts.js        Chart.js wrappers
  js/app.js           rendering, nav, filters, modal
  assets/             logo
  README.md
  LICENSE
  .gitignore
```

---

## Real vs synthetic data

| Data | Real or synthetic | Source |
|---|---|---|
| Regional Coordinator names | **Real** | [eduspots.org/about-us/team/](https://eduspots.org/about-us/team/) |
| RC regions | **Real** | Same source |
| Spot names | **Real** | [eduspots.org](https://eduspots.org/) — 49+ named Spots |
| *Keeping Spots Safe* programme description | **Real** | [eduspots.org/education-hub/keeping-spots-safe/](https://eduspots.org/education-hub/keeping-spots-safe/) |
| Individual Catalyst names | **Synthetic** | Seeded generator — invented composites, not real people |
| Training completion dates | **Synthetic** | Seeded generator — no real training records are public (nor should they be) |
| Compliance statuses | **Computed from synthetic dates** | Derived from the synthetic completionDate values above |

Synthetic Catalyst data was generated with a fixed seed so the demo is reproducible. In production, this would be replaced by real training records from EduSpots' systems.

---

## Roadmap (production considerations)

- Connect to a real training records database (replacing the synthetic generator)
- Confirm the 12-month renewal cycle against the actual *Keeping Spots Safe* policy
- Add RC-level authentication so each RC sees only their own cluster
- Automated renewal reminder emails (still RC-triggered, not system-automated)
- Export filtered roster to CSV for offline reference

---

## Licence

MIT — see `LICENSE`.
