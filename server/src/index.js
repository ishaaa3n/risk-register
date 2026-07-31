import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import assessmentRoutes from './routes/assessments.js';
import dashboardRoutes from './routes/dashboard.js';
import publicRoutes from './routes/public.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// CORS_ORIGIN can be a single origin or a comma-separated list (e.g. your Vercel
// production + preview URLs). Falls back to allowing any origin for local dev.
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(express.json());
// Filenames are random and unguessable; not gated behind requireAuth because
// <img src> requests can't carry an Authorization header.
app.use('/uploads', express.static(path.join(__dirname, '..', 'data', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Risk register API listening on http://localhost:${PORT}`));
