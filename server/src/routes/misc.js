import { Router } from 'express';
import multer from 'multer';
import Registry from '../models/Registry.js';
import { RULES, reviewDate } from '../config/rules.js';
import { extractMeta } from '../services/fileMeta.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Rules and the review date used for expiry checks (EXAMPLE values)
router.get('/config', (req, res) => {
  res.json({ today: reviewDate().toISOString().slice(0, 10), rules: RULES });
});

// Simulated issuer registry (demo records)
router.get('/registry', async (req, res, next) => {
  try {
    const rows = await Registry.find().sort({ certId: 1 }).lean();
    res.json({ label: 'SIMULATED - not a real issuer confirmation', records: rows.map((r) => ({ certId: r.certId, expiry: r.expiry })) });
  } catch (e) {
    next(e);
  }
});

// Reads file-history metadata so the upload screen can show "made with ..." straight away
router.post('/inspect', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  res.json({ file: req.file.originalname, meta: extractMeta(req.file.buffer, req.file.originalname, req.body.lastModified) });
});

export default router;
