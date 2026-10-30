import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Application, { DECISIONS } from '../models/Application.js';
import { RULES } from '../config/rules.js';
import { evaluate, serialize } from '../services/analysis.js';
import { loadContext } from '../services/context.js';
import { extractMeta, cleanMeta } from '../services/fileMeta.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 10 } });
const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const clean = (v, n = 200) => {
  const s = String(v ?? '').trim().slice(0, n);
  return s || undefined;
};
const EDITABLE = ['name', 'reg', 'issue', 'expiry', 'auth', 'qr'];

async function findApp(req, res) {
  const app = await Application.findOne({ appId: req.params.appId });
  if (!app) res.status(404).json({ error: 'Application not found' });
  return app;
}

async function nextId() {
  const ids = await Application.find({ appId: /^N\d+$/ }).select('appId').lean();
  return 'N' + (Math.max(0, ...ids.map((x) => +x.appId.slice(1))) + 1);
}

// List all applications with their analysis (client sorts by risk)
router.get('/', ah(async (req, res) => {
  const [apps, ctx] = await Promise.all([Application.find().sort({ createdAt: 1, _id: 1 }), loadContext()]);
  res.json(apps.map((a) => serialize(a, ctx)));
}));

router.get('/:appId', ah(async (req, res) => {
  const app = await findApp(req, res);
  if (app) res.json(serialize(app, await loadContext()));
}));

// College-side submission: multipart form, one file field per document type
router.post('/', upload.any(), ah(async (req, res) => {
  const college = clean(req.body.college), reg = clean(req.body.reg);
  let docsIn;
  try {
    docsIn = JSON.parse(req.body.docs || '{}');
  } catch {
    return res.status(400).json({ error: 'docs must be valid JSON' });
  }
  const files = Object.fromEntries((req.files || []).map((f) => [f.fieldname, f]));
  const docs = [];
  for (const [type, d] of Object.entries(docsIn)) {
    if (!RULES.required.includes(type) || !(d && (d.file || files[type]))) continue;
    const f = files[type];
    docs.push({
      type,
      name: String(d.name ?? '').trim().slice(0, 200),
      reg: clean(d.reg), issue: clean(d.issue, 10), expiry: clean(d.expiry, 10), auth: clean(d.auth), qr: clean(d.qr, 60),
      file: f ? path.basename(f.originalname) : clean(d.file),
      meta: f ? extractMeta(f.buffer, f.originalname, d.lastModified) : cleanMeta(d.meta),
    });
  }
  if (!college || !reg || !docs.length)
    return res.status(400).json({ error: 'Institution name, registration number and at least one document are required.' });

  const appId = await nextId();
  const app = await Application.create({ appId, college, reg, faculty: Math.max(0, +req.body.faculty || 0), docs });

  // keep the uploaded originals on disk for the officer
  const dir = path.join(UPLOAD_DIR, appId);
  await fs.promises.mkdir(dir, { recursive: true });
  await Promise.all(
    docs.filter((d) => files[d.type]).map((d) =>
      fs.promises.writeFile(path.join(dir, d.type.replace(/\W+/g, '_') + '__' + path.basename(files[d.type].originalname)), files[d.type].buffer)
    )
  );
  res.status(201).json(serialize(app, await loadContext()));
}));

// Officer corrects an extracted field: { field, value }
router.patch('/:appId/documents/:index', ah(async (req, res) => {
  const app = await findApp(req, res);
  if (!app) return;
  const doc = app.docs[+req.params.index];
  const { field, value } = req.body;
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (!EDITABLE.includes(field)) return res.status(400).json({ error: 'Field cannot be edited' });
  const v = String(value ?? '').trim().slice(0, 200);
  doc.set(field, field === 'name' ? v : v || undefined);
  await app.save();
  res.json(serialize(app, await loadContext()));
}));

// Officer marks a finding: { key, status: 'confirmed' | 'dismissed' }. Same status again clears it.
router.patch('/:appId/flags', ah(async (req, res) => {
  const app = await findApp(req, res);
  if (!app) return;
  const { key, status } = req.body;
  if (!['confirmed', 'dismissed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const { checks } = evaluate(app.toObject(), await loadContext());
  if (!checks.some((c) => c.key === key)) return res.status(400).json({ error: 'Unknown finding' });
  const cur = app.flags.find((f) => f.key === key);
  app.flags = app.flags.filter((f) => f.key !== key);
  if (!cur || cur.status !== status) app.flags.push({ key, status });
  await app.save();
  res.json(serialize(app, await loadContext()));
}));

// Officer recommendation and remarks: { decision?, remarks? }. A recommendation only - never an automatic decision.
router.put('/:appId/review', ah(async (req, res) => {
  const app = await findApp(req, res);
  if (!app) return;
  const { decision, remarks } = req.body;
  if (decision !== undefined) {
    if (decision !== '' && !DECISIONS.includes(decision)) return res.status(400).json({ error: 'Invalid decision' });
    app.decision = decision;
  }
  if (remarks !== undefined) app.remarks = String(remarks).slice(0, 2000);
  await app.save();
  res.json(serialize(app, await loadContext()));
}));

export default router;
