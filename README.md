# AICTE DocVerify (PS 26261) - MERN version

The HTML prototype rebuilt as a full MERN app. Same screens, same look, same rules and demo data.

**DEMO DATA only. The issuer registry is SIMULATED, not a real issuer confirmation. A flag is not proof of fraud. The officer decides.**

| Layer | What it does |
|---|---|
| **MongoDB** | Applications, officer flags, remarks, recommendations, and the simulated issuer registry |
| **Express / Node** | Rules engine (R0-R6, T1-T2, A1), risk score, file-history reader, REST API |
| **React (Vite)** | Overview, Submit documents, Analysis walkthrough, Review, Report |

## Setup

Needs Node 18+ and MongoDB running locally (or an Atlas URI).

```bash
npm run install-all          # installs root, server and client
# server/.env already exists (copy of .env.example) - edit MONGODB_URI if needed
npm run dev                  # API on :5000, web on http://localhost:5173
```

On first start the API seeds the three demo colleges (A Low, B Medium, C High) and the simulated registry.
`npm run seed` wipes and re-creates them.

Production: `npm run build` then `npm start`. Express serves the built client on port 5000.

## Configuration (`server/.env`)

| Variable | Meaning |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `PORT` | API port (default 5000) |
| `REVIEW_DATE` | Date used for expiry checks. Demo data is built around `2026-10-30`. Delete the line to use today's date, but College A's fire certificate then expires on 2027-01-09 and its score changes. |

Rule values (weights, minimum faculty, required documents, name thresholds, priority buckets) are in
`server/src/config/rules.js`. They are EXAMPLE values - configure per current AICTE handbook.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/config` | Rules and review date |
| GET | `/api/applications` | All applications with full analysis |
| GET | `/api/applications/:appId` | One application |
| POST | `/api/applications` | College submission (multipart: `college`, `reg`, `faculty`, `docs` JSON, one file per document type) |
| PATCH | `/api/applications/:appId/documents/:index` | Officer corrects a field `{field, value}` |
| PATCH | `/api/applications/:appId/flags` | Confirm / dismiss a finding `{key, status}` (same status again clears it) |
| PUT | `/api/applications/:appId/review` | Recommendation and remarks `{decision?, remarks?}` |
| POST | `/api/inspect` | Reads a file's producer / created / modified dates |
| GET | `/api/registry` | The simulated registry records |

## Structure

```
server/src
  config/rules.js          example rule values + review date
  data/seedData.js         DEMO applications and simulated registry
  models/                  Application, Registry (Mongoose)
  services/analysis.js     the rules engine and risk score
  services/fileMeta.js     PDF metadata reader
  routes/                  applications.js, misc.js
  index.js, seed.js
client/src
  pages/                   Home, Submit, Run, Review, Report
  components/              Layout, Widgets (Stepper, Gauge, Donut, CountUp)
  context/AppsContext.jsx  loads and updates applications from the API
  index.css                the original prototype stylesheet, unchanged
```

## What changed from the prototype

- Data, rules and scoring moved from browser JavaScript to the server and MongoDB.
- Officer flags, remarks and recommendations are saved, so they survive a refresh.
- Uploaded files are sent to the server, which reads their file history and keeps the originals in `server/uploads/`.
- Screens have real URLs (`/submit`, `/applications/A`, `/applications/A/analysis`, `/applications/A/report`).

## Limitations (same as the prototype)

- There is no OCR engine. Fields come from the form the college fills in or from stored demo records.
- File history is read by searching the PDF bytes, so PDFs that store it elsewhere show "Not stated".
- The Error Level Analysis marker on College C is demo data, not a computed result.
- The issuer registry is simulated. Real verification (DigiLocker, issuer APIs) is future work.
- The report is printed from the browser. There is no server-side PDF export.
