import express from 'express';
import http from 'http';
import cors from 'cors';
import { config as loadEnv } from 'dotenv';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { Pool } from 'pg';
// Optional email notifications (nodemailer is optional)
let nodemailer = null;
try {
  nodemailer = await import('nodemailer');
} catch {
  nodemailer = null;
}

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Postgres client (Render-compatible SSL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false }
});

async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS crusade_types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      -- Add description column if it doesn't exist (migration)
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crusade_types' AND column_name='description') THEN
          ALTER TABLE crusade_types ADD COLUMN description TEXT;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS testimonies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT,
        title TEXT,
        email TEXT,
        phone TEXT,
        content TEXT,
        summary TEXT,
        preview_image TEXT,
        preview_video TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        videos JSONB DEFAULT '[]'::jsonb,
        approved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS crusades (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT,
        date TEXT,
        attendance INTEGER,
        zone TEXT,
        description TEXT,
        summary TEXT,
        type TEXT,
        preview_image TEXT,
        preview_video TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        videos JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Messages (persistent)
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT,
        email TEXT,
        phone TEXT,
        subject TEXT,
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Songs (persistent)
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT,
        artist TEXT,
        lyrics TEXT,
        date TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Live chat (persistent, capped on read to last 100)
      CREATE TABLE IF NOT EXISTS livechat (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        text TEXT NOT NULL,
        from_me BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Comments (persistent)
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        name TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
      ALTER TABLE crusades ADD COLUMN IF NOT EXISTS zone TEXT;
      ALTER TABLE crusades ADD COLUMN IF NOT EXISTS attendance INTEGER;`);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Schema init error', e);
    throw e;
  } finally {
    client.release();
  }
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { 
      testimonies: [], 
      crusades: [], 
      messages: [], 
      users: [], 
      songs: [],
      liveChat: [],
      comments: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// JWT auth
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Role guard: superadmin/admin have full access; otherwise must match allowed roles
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role = req.user.role;
    if (role === 'superadmin' || role === 'admin') return next();
    if (allowed.includes(role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

function requireSuperAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// HLS reverse proxy to bypass CORS for livestream
// Proxies everything under /api/hls/* to the origin base path
const HLS_ORIGIN_BASE = 'https://vcpout-ams01.internetmultimediaonline.org/lmampraise/stream1';
// Preflight to satisfy some dev setups
app.options('/api/hls/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.status(204).end();
});

app.get('/api/hls/*', async (req, res) => {
  try {
    const suffix = req.params[0] || '';
    const targetUrl = `${HLS_ORIGIN_BASE}/${suffix}`;
    console.log(`[HLS PROXY] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    // Forward minimal useful headers (some origins require Range/UA/Referer)
    const fwdHeaders = new Headers();
    const range = req.headers['range'];
    if (typeof range === 'string') fwdHeaders.set('Range', range);
    fwdHeaders.set('User-Agent', req.headers['user-agent'] || 'Mozilla/5.0 (compatible; UnendingPraise/1.0)');
    if (req.headers['referer']) fwdHeaders.set('Referer', String(req.headers['referer']));
    if (req.headers['origin']) fwdHeaders.set('Origin', String(req.headers['origin']));
    const upstream = await fetch(targetUrl, { headers: fwdHeaders, cache: 'no-store' });

    // Pass through content type or infer basic ones
    const ct = upstream.headers.get('content-type')
      || (targetUrl.endsWith('.m3u8') ? 'application/vnd.apple.mpegURL' : undefined)
      || (targetUrl.endsWith('.ts') ? 'video/MP2T' : undefined)
      || 'application/octet-stream';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', ct);
    // Allow caching short-term to smooth playback (tweak as needed)
    res.setHeader('Cache-Control', targetUrl.endsWith('.ts') ? 'public, max-age=30' : 'no-cache');
    res.status(upstream.status);
    // Keep stream alive for long-lived transfers
    try { req.socket.setTimeout(0); res.setTimeout(0); } catch {}
    try { if (typeof res.flushHeaders === 'function') res.flushHeaders(); } catch {}

    if (upstream.body) {
      // Node 18+: convert Web stream to Node stream
      const toNodeStream = Readable.fromWeb ? Readable.fromWeb(upstream.body) : Readable.from(upstream.body);
      toNodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (e) {
    console.error('HLS proxy error', e);
    res.status(502).json({ error: 'Upstream fetch failed' });
  }
});

// Auth: register, login (backed by Postgres)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    if (existing.rowCount) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const role = 'pending';
    const status = 'pending';
    const insert = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, status',
      [name, email, hash, role, status]
    );
    const user = insert.rows[0];
    notifyUsersForRole('superadmin', `New admin registration: ${email}`, `${name} (${email}) requested access.`).catch(() => {});
    res.status(201).json({ message: 'Registration received. Awaiting superadmin approval.', user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query('SELECT id, name, email, role, status, password_hash FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const row = result.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (row.status !== 'active') return res.status(403).json({ error: 'Account pending approval' });
    const token = createToken({ id: row.id, name: row.name, email: row.email, role: row.role });
    res.json({ token, user: { id: row.id, name: row.name, email: row.email, role: row.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Current user from token - always fetch fresh role from database
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, status FROM users WHERE id=$1', [req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generic CRUD helpers
function makeListRoute(key, roleForWrite) {
  app.get(`/api/${key}`, (_req, res) => {
    const db = readDb();
    res.json(db[key]);
  });

  app.post(`/api/${key}`, (req, res) => {
    const item = { id: uuid(), createdAt: new Date().toISOString(), ...req.body };
    const db = readDb();
    db[key].push(item);
    writeDb(db);
    res.status(201).json(item);
  });

  app.put(`/api/${key}/:id`, requireAuth, requireRole(roleForWrite), (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const idx = db[key].findIndex((x) => x.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db[key][idx] = { ...db[key][idx], ...req.body, id };
    writeDb(db);
    res.json(db[key][idx]);
  });

  app.delete(`/api/${key}/:id`, requireAuth, requireRole(roleForWrite), (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const before = db[key].length;
    db[key] = db[key].filter((x) => x.id !== id);
    if (db[key].length === before) return res.status(404).json({ error: 'Not found' });
    writeDb(db);
    res.status(204).end();
  });
}

// Entities: messages, songs now backed by Postgres
app.get('/api/messages', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, subject, message, created_at FROM messages ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, subject: r.subject, message: r.message, createdAt: r.created_at })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});
app.post('/api/messages', async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  try {
    const result = await pool.query(
      'INSERT INTO messages (name, email, phone, subject, message) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, phone, subject, message, created_at',
      [name || null, email || null, phone || null, subject || null, message || null]
    );
    const r = result.rows[0];
    res.status(201).json({ id: r.id, name: r.name, email: r.email, phone: r.phone, subject: r.subject, message: r.message, createdAt: r.created_at });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM messages WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/songs', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, title, artist, lyrics, date, created_at FROM songs ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({ id: r.id, title: r.title, artist: r.artist, lyrics: r.lyrics, date: r.date, createdAt: r.created_at })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});
app.post('/api/songs', async (req, res) => {
  const { title, artist, lyrics, date } = req.body || {};
  try {
    const result = await pool.query(
      'INSERT INTO songs (title, artist, lyrics, date) VALUES ($1,$2,$3,$4) RETURNING id, title, artist, lyrics, date, created_at',
      [title || null, artist || null, lyrics || null, date || null]
    );
    const r = result.rows[0];
    res.status(201).json({ id: r.id, title: r.title, artist: r.artist, lyrics: r.lyrics, date: r.date, createdAt: r.created_at });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/songs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM songs WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// Testimonies routes (Postgres)
app.get('/api/testimonies', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimonies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/testimonies/:id', requireAuth, requireRole('testimony'), async (req, res) => {
  const { id } = req.params;
  const { name, title, email, phone, content, summary, previewImage, previewVideo, images, videos, approved } = req.body || {};
  try {
    const result = await pool.query(
      `UPDATE testimonies SET
        name=COALESCE($1,name), title=COALESCE($2,title), email=COALESCE($3,email), phone=COALESCE($4,phone),
        content=COALESCE($5,content), summary=COALESCE($6,summary),
        preview_image=COALESCE($7,preview_image), preview_video=COALESCE($8,preview_video),
        images=COALESCE($9,images), videos=COALESCE($10,videos),
        approved=COALESCE($11,approved)
       WHERE id=$12 RETURNING *`,
      [name, title, email, phone, content, summary, previewImage, previewVideo, images && Array.isArray(images) ? JSON.stringify(images) : null, videos && Array.isArray(videos) ? JSON.stringify(videos) : null, approved, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/testimonies/:id', requireAuth, requireRole('testimony'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM testimonies WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Crusades routes (Postgres)
app.get('/api/crusades', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM crusades ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/crusades/:id', requireAuth, requireRole('crusade'), async (req, res) => {
  const { id } = req.params;
  const { title, date, attendance, zone, description, summary, type, previewImage, previewVideo, images, videos } = req.body || {};
  try {
    const result = await pool.query(
      `UPDATE crusades SET
        title=COALESCE($1,title), date=COALESCE($2,date), attendance=COALESCE($3,attendance), zone=COALESCE($4,zone),
        description=COALESCE($5,description), summary=COALESCE($6,summary), type=COALESCE($7,type),
        preview_image=COALESCE($8,preview_image), preview_video=COALESCE($9,preview_video),
        images=COALESCE($10,images), videos=COALESCE($11,videos)
       WHERE id=$12 RETURNING *`,
      [title, date, attendance ? parseInt(attendance) : null, zone, description, summary, type, previewImage, previewVideo, images && Array.isArray(images) ? JSON.stringify(images) : null, videos && Array.isArray(videos) ? JSON.stringify(videos) : null, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/crusades/:id', requireAuth, requireRole('crusade'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM crusades WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// LiveChat API with 1000 message limit
app.get('/api/livechat', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, text, from_me, created_at FROM livechat ORDER BY created_at DESC LIMIT 100');
    const rows = result.rows.reverse().map(r => ({ id: r.id, text: r.text, fromMe: r.from_me, createdAt: r.created_at }));
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/livechat', async (req, res) => {
  const { text, fromMe } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const result = await pool.query('INSERT INTO livechat (text, from_me) VALUES ($1,$2) RETURNING id, text, from_me, created_at', [text, Boolean(fromMe)]);
    const r = result.rows[0];
    res.status(201).json({ id: r.id, text: r.text, fromMe: r.from_me, createdAt: r.created_at });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// Comments API
app.get('/api/comments/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;
  try {
    const result = await pool.query('SELECT id, name, comment, created_at FROM comments WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at ASC', [entityType, entityId]);
    res.json(result.rows.map(r => ({ id: r.id, name: r.name, comment: r.comment, createdAt: r.created_at })));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/comments/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;
  const { name, comment } = req.body || {};
  if (!name || !comment) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await pool.query('INSERT INTO comments (entity_type, entity_id, name, comment) VALUES ($1,$2,$3,$4) RETURNING id, name, comment, created_at', [entityType, entityId, name, comment]);
    const r = result.rows[0];
    res.status(201).json({ id: r.id, name: r.name, comment: r.comment, createdAt: r.created_at });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/comments/:entityType/:entityId/:commentId', requireAuth, requireRole('testimony','crusade'), async (req, res) => {
  const { commentId } = req.params;
  try {
    const result = await pool.query('DELETE FROM comments WHERE id=$1', [commentId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// Approve endpoint for testimonies (admin)
app.post('/api/testimonies/:id/approve', requireAuth, requireRole('testimony'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE testimonies SET approved=TRUE WHERE id=$1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to generate summary from text
function generateSummary(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

// Testimonies POST with auto-generate summary (Postgres)
app.post('/api/testimonies', async (req, res) => {
  const body = req.body || {};
  if (body.content && !body.summary) body.summary = generateSummary(body.content);
  const images = Array.isArray(body.images) ? body.images : [];
  const videos = Array.isArray(body.videos) ? body.videos : [];
  try {
    const result = await pool.query(
      `INSERT INTO testimonies (name, title, email, phone, content, summary, preview_image, preview_video, images, videos, approved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [body.name || null, body.title || null, body.email || null, body.phone || null, body.content || null, body.summary || null, body.previewImage || null, body.previewVideo || null, Array.isArray(images) ? JSON.stringify(images) : '[]', Array.isArray(videos) ? JSON.stringify(videos) : '[]', Boolean(body.approved)]
    );
    const created = result.rows[0];
    // notify testimony admins and superadmins
    notifyUsersForRole('testimony', `New testimony submitted: ${created.title || created.name || created.id}`,
      'A new testimony was submitted and awaits review.').catch(() => {});
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Crusades POST with auto-generate summary (Postgres)
app.post('/api/crusades', async (req, res) => {
  const body = req.body || {};
  if (body.description && !body.summary) body.summary = generateSummary(body.description);
  const images = Array.isArray(body.images) ? body.images : [];
  const videos = Array.isArray(body.videos) ? body.videos : [];
  try {
    const result = await pool.query(
      `INSERT INTO crusades (title, date, attendance, zone, description, summary, type, preview_image, preview_video, images, videos)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [body.title || null, body.date || null, body.attendance ? parseInt(body.attendance) : null, body.zone || null, body.description || null, body.summary || null, body.type || null, body.previewImage || null, body.previewVideo || null, Array.isArray(images) ? JSON.stringify(images) : '[]', Array.isArray(videos) ? JSON.stringify(videos) : '[]']
    );
    const created = result.rows[0];
    // notify crusade admins and superadmins
    notifyUsersForRole('crusade', `New crusade created: ${created.title || created.id}`,
      'A new crusade was added.').catch(() => {});
    res.status(201).json(created);
  } catch (e) {
    console.error('Error creating crusade:', e);
    console.error('Error details:', e.message, e.code, e.detail);
    res.status(500).json({ error: 'Server error', details: e.message || String(e) });
  }
});

// Crusade Types CRUD (Postgres)
app.get('/api/crusade-types', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM crusade_types ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/crusade-types', requireAuth, requireAdmin, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const result = await pool.query('INSERT INTO crusade_types (name, description) VALUES ($1, $2) RETURNING *', [name, description || null]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Type already exists' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/crusade-types/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params; const { name, description } = req.body || {};
  try {
    const result = await pool.query('UPDATE crusade_types SET name=COALESCE($1,name), description=COALESCE($2,description) WHERE id=$3 RETURNING *', [name, description, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Type already exists' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/crusade-types/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM crusade_types WHERE id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize default admin and minimal placeholder data on startup (Postgres)
async function initializeDefaultAdmin() {
  try {
    // Force emeraldndukwe2@gmail.com to superadmin (always update)
    const emeraldPassword = 'Emrys2004';
    const emeraldHash = await bcrypt.hash(emeraldPassword, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO UPDATE SET role=$4, status=$5, password_hash=$3`,
      ['Emerald', 'emeraldndukwe2@gmail.com', emeraldHash, 'superadmin', 'active']
    );
    console.log('✅ Ensured emeraldndukwe2@gmail.com is superadmin (password: Emrys2004)');
  } catch (e) {
    console.error('❌ Error initializing admin accounts:', e);
    console.error('Stack:', e.stack);
  }
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// --- WebSocket Live Chat ---
let WebSocketServer = null;
try {
  const wsMod = await import('ws');
  WebSocketServer = wsMod.WebSocketServer;
} catch {}

if (WebSocketServer) {
  const wss = new WebSocketServer({ server, path: '/ws/livechat' });
  wss.on('connection', (ws) => {
    (async () => {
      try {
        const result = await pool.query('SELECT id, text, from_me, created_at FROM livechat ORDER BY created_at DESC LIMIT 100');
        const recent = result.rows.reverse().map(r => ({ id: r.id, text: r.text, fromMe: r.from_me, createdAt: r.created_at }));
        ws.send(JSON.stringify({ type: 'init', messages: recent }));
      } catch {}
    })();

    ws.on('message', (data) => {
      (async () => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed && typeof parsed.text === 'string' && parsed.text.trim()) {
            const ins = await pool.query('INSERT INTO livechat (text, from_me) VALUES ($1,$2) RETURNING id, text, from_me, created_at', [parsed.text.trim(), !!parsed.fromMe]);
            const r = ins.rows[0];
            const message = { id: r.id, text: r.text, fromMe: r.from_me, createdAt: r.created_at };
            const payload = JSON.stringify({ type: 'new_message', message });
            wss.clients.forEach((client) => {
              try { client.readyState === 1 && client.send(payload); } catch {}
            });
          }
        } catch {}
      })();
    });
  });
}

server.listen(PORT, async () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set. Set it for Postgres (Render)');
    return;
  }
  // Initialize DB with timeout and error handling
  try {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database initialization timeout')), 10000)
    );
    await Promise.race([
      (async () => {
        await ensureSchema();
        await initializeDefaultAdmin();
        console.log('✅ Database initialized successfully');
      })(),
      timeout
    ]);
  } catch (e) {
    console.error('❌ Database initialization failed:', e.message);
    console.error('Server will continue but database features may not work.');
    console.error('Please check DATABASE_URL and ensure PostgreSQL is accessible.');
  }
});

// Email notifications helper
async function notifyUsersForRole(role, subject, text) {
  try {
    // select recipients by role or superadmin; only active users
    let result;
    if (role === 'superadmin') {
      result = await pool.query(`SELECT email FROM users WHERE role='superadmin' AND status='active'`);
    } else {
      result = await pool.query(
        `SELECT email FROM users WHERE (role = $1 OR role = 'superadmin') AND status='active'`,
        [role]
      );
    }
    const recipients = result.rows.map(r => r.email).filter(Boolean);
    if (!recipients.length) return;
    const smtpUrl = process.env.SMTP_URL;
    if (!smtpUrl || !nodemailer) {
      console.log(`[notify] ${subject} ->`, recipients);
      return;
    }
    const transporter = nodemailer.createTransport(smtpUrl);
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@unendingpraise.com',
      to: recipients.join(','),
      subject,
      text
    });
  } catch (e) {
    console.warn('notifyUsersForRole failed', e?.message);
  }
}

// Serve built frontend (dist) from the same server for Render
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Superadmin user management APIs
app.get('/api/admin/users', requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/users', requireAuth, requireSuperAdmin, async (req, res) => {
  const { name, email, password, role = 'admin' } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    if (existing.rowCount) return res.status(409).json({ error: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, status, created_at',
      [name, email, hash, role, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/users/:id/role', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params; const { role } = req.body || {};
  if (!role) return res.status(400).json({ error: 'Missing role' });
  try {
    const result = await pool.query('UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role, status', [role, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/users/:id/activate', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("UPDATE users SET status='active' WHERE id=$1 RETURNING id, name, email, role, status", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Utility endpoint to fix admin accounts (one-time setup - can be removed after use)
app.post('/api/admin/fix-superadmin', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  
  // Only allow fixing specific emails for security
  const allowedEmails = ['admin@unendingpraise.com', 'emeraldndukwe2@gmail.com'];
  if (!allowedEmails.includes(email.toLowerCase())) {
    return res.status(403).json({ error: 'Email not allowed' });
  }
  
  try {
    // Check if user exists
    const check = await pool.query('SELECT id, email, password_hash FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    if (check.rowCount === 0) {
      // Create new superadmin
      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, status',
        [email.split('@')[0], email, hash, 'superadmin', 'active']
      );
      return res.json({ message: 'Superadmin created', user: result.rows[0] });
    }
    
    // Verify password and upgrade to superadmin
    const user = check.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });
    
    // Upgrade to superadmin
    const result = await pool.query(
      "UPDATE users SET role='superadmin', status='active' WHERE id=$1 RETURNING id, name, email, role, status",
      [user.id]
    );
    res.json({ message: 'Account upgraded to superadmin', user: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});


