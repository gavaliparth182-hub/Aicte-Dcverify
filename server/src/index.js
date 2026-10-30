import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import applications from './routes/applications.js';
import misc from './routes/misc.js';
import { seedIfEmpty } from './seed.js';

const app = express();
const PORT = process.env.PORT || 5000;
const here = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, note: 'DEMO DATA. Issuer registry is simulated.' }));
app.use('/api/applications', applications);
app.use('/api', misc);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Production: serve the built React app from the same server
const dist = path.join(here, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  const status = err instanceof multer.MulterError ? 400 : err.status || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aicte_docverify');
console.log('MongoDB connected');
await seedIfEmpty();
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
