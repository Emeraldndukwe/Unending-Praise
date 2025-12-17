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
import { v2 as cloudinary } from 'cloudinary';
// Optional email notifications (nodemailer is optional)
let nodemailer = null;
try {
  nodemailer = await import('nodemailer');
} catch {
  nodemailer = null;
}

loadEnv();

const cloudinaryEnabled = Boolean(process.env.CLOUDINARY_URL);
if (cloudinaryEnabled) {
  cloudinary.config({
    secure: true,
  });
} else {
  console.warn('⚠️ CLOUDINARY_URL not set. Media uploads will use base64 fallback.');
}

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

      -- Analytics (page views)
      CREATE TABLE IF NOT EXISTS page_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        page_path TEXT NOT NULL,
        visitor_ip TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      -- Create index for faster queries
      CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
      CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
      CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_ip, created_at);
      -- Add columns if they don't exist (migration)
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='visitor_ip') THEN
          ALTER TABLE page_views ADD COLUMN visitor_ip TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='user_agent') THEN
          ALTER TABLE page_views ADD COLUMN user_agent TEXT;
        END IF;
      END $$;

      -- Meeting recordings (private password-protected page)
      CREATE TABLE IF NOT EXISTS meeting_recordings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        section TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Meeting documents (private password-protected page)
      CREATE TABLE IF NOT EXISTS meeting_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        document_url TEXT NOT NULL,
        document_type TEXT,
        section TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Meeting page settings (password and access token)
      CREATE TABLE IF NOT EXISTS meeting_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        password_hash TEXT NOT NULL,
        access_token TEXT UNIQUE NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
      ALTER TABLE crusades ADD COLUMN IF NOT EXISTS zone TEXT;
      ALTER TABLE crusades ADD COLUMN IF NOT EXISTS attendance INTEGER;
      ALTER TABLE meeting_recordings ADD COLUMN IF NOT EXISTS section TEXT;
      ALTER TABLE meeting_documents ADD COLUMN IF NOT EXISTS section TEXT;`);
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
app.use(express.json({ limit: '10mb' }));
// Trust proxy to get correct IP addresses (needed for Render and other proxies)
app.set('trust proxy', true);

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

async function uploadMediaFromDataUrl(dataUrl, { folder = 'unendingpraise/uploads' } = {}) {
  if (!cloudinaryEnabled) {
    throw new Error('Cloudinary not configured');
  }
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL');
  }
  
  // Detect file type from data URL
  let resourceType = 'auto';
  if (dataUrl.startsWith('data:video/')) {
    resourceType = 'video';
  } else if (dataUrl.startsWith('data:image/')) {
    resourceType = 'image';
  } else if (dataUrl.startsWith('data:application/pdf') || dataUrl.includes('application/pdf')) {
    resourceType = 'raw'; // PDFs should be uploaded as raw files
  } else if (dataUrl.startsWith('data:application/') || dataUrl.startsWith('data:text/')) {
    resourceType = 'raw'; // Other documents (doc, docx, txt, etc.) as raw
  }
  
  const upload = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: resourceType,
    overwrite: false,
  });
  return {
    url: upload.secure_url,
    publicId: upload.public_id,
    bytes: upload.bytes,
    resourceType: upload.resource_type || resourceType,
  };
}

// Health check - should work even if DB is down
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Root health check for Render
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
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

app.post('/api/admin/upload', requireAuth, requireRole('crusade', 'testimony', 'songs'), async (req, res) => {
  if (!cloudinaryEnabled) {
    return res.status(503).json({ error: 'Cloudinary not configured' });
  }
  const { dataUrl, folder } = req.body || {};
  if (!dataUrl) return res.status(400).json({ error: 'Missing dataUrl' });
  try {
    const result = await uploadMediaFromDataUrl(dataUrl, { folder });
    res.status(201).json(result);
  } catch (e) {
    console.error('Cloudinary upload failed', e);
    res.status(500).json({ error: 'Upload failed', details: e?.message || 'Unknown error' });
  }
});

// Get Cloudinary upload signature for direct uploads (for large files)
app.post('/api/admin/upload-signature', requireAuth, requireRole('crusade', 'testimony', 'songs'), async (req, res) => {
  if (!cloudinaryEnabled) {
    return res.status(503).json({ error: 'Cloudinary not configured' });
  }
  const { folder = 'unendingpraise/uploads', resourceType = 'auto' } = req.body || {};
  
  try {
    // Generate upload signature for unsigned uploads
    // Note: You'll need to create an unsigned upload preset in Cloudinary dashboard
    // For now, we'll use a timestamp-based signature
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, resource_type: resourceType },
      process.env.CLOUDINARY_API_SECRET || ''
    );
    
    const cloudName = cloudinary.config().cloud_name;
    const apiKey = cloudinary.config().api_key;
    
    res.json({
      signature,
      timestamp,
      folder,
      resourceType,
      cloudName,
      apiKey,
      // Upload URL for direct uploads
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType === 'video' ? 'video' : 'image'}/upload`,
    });
  } catch (e) {
    console.error('Failed to generate upload signature:', e);
    res.status(500).json({ error: 'Failed to generate upload signature', details: e?.message || 'Unknown error' });
  }
});

// Direct upload endpoint for large files (multipart/form-data)
app.post('/api/admin/upload-direct', requireAuth, requireRole('crusade', 'testimony', 'songs'), async (req, res) => {
  if (!cloudinaryEnabled) {
    return res.status(503).json({ error: 'Cloudinary not configured' });
  }
  
  // Note: For multipart uploads, we need to use multer or similar
  // For now, this is a placeholder - we'll use direct browser upload instead
  res.status(501).json({ error: 'Use direct Cloudinary upload from browser' });
});

// Proxy endpoint for PDFs to bypass Cloudinary access restrictions
app.get('/api/proxy/pdf', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL parameter' });
  }
  
  try {
    // Fix Cloudinary URLs: if PDF was uploaded as image, convert to raw
    let pdfUrl = url;
    if (pdfUrl.includes('/image/upload/') && pdfUrl.endsWith('.pdf')) {
      pdfUrl = pdfUrl.replace('/image/upload/', '/raw/upload/');
    }
    
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UnendingPraise/1.0)',
      },
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch PDF' });
    }
    
    const contentType = response.headers.get('content-type') || 'application/pdf';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('PDF proxy error:', e);
    res.status(500).json({ error: 'Proxy failed', details: e?.message || 'Unknown error' });
  }
});

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

async function purgeExpiredSongs() {
  try {
    const result = await pool.query(`
      DELETE FROM songs
      WHERE date IS NOT NULL
        AND TRIM(date) <> ''
        AND date ~ '^\\d{4}-\\d{2}-\\d{2}$'
        AND date::date < CURRENT_DATE
      RETURNING id
    `);
    if (result.rowCount > 0) {
      console.log(`[Songs] Purged ${result.rowCount} expired song${result.rowCount === 1 ? '' : 's'}`);
    }
  } catch (err) {
    console.error('[Songs] Failed to purge expired songs', err);
  }
}

app.get('/api/songs', async (_req, res) => {
  try {
    await purgeExpiredSongs();
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
    await purgeExpiredSongs();
    res.status(201).json({ id: r.id, title: r.title, artist: r.artist, lyrics: r.lyrics, date: r.date, createdAt: r.created_at });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/songs/:id', async (req, res) => {
  const { id } = req.params;
  const { title, artist, lyrics, date } = req.body || {};
  try {
    const result = await pool.query(
      `UPDATE songs SET
        title = COALESCE($2, title),
        artist = COALESCE($3, artist),
        lyrics = COALESCE($4, lyrics),
        date = COALESCE($5, date)
       WHERE id = $1
       RETURNING id, title, artist, lyrics, date, created_at`,
      [id, title ?? null, artist ?? null, lyrics ?? null, date ?? null]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    await purgeExpiredSongs();
    const r = result.rows[0];
    res.json({ id: r.id, title: r.title, artist: r.artist, lyrics: r.lyrics, date: r.date, createdAt: r.created_at });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
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
app.post('/api/crusades', requireAuth, requireRole('crusade'), async (req, res) => {
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
  console.log(`✅ API server listening on http://localhost:${PORT}`);
  console.log(`✅ Health check available at /health and /api/health`);
  
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set. Set it for Postgres (Render)');
    console.warn('⚠️ Server is running but database features will not work.');
    return;
  }
  
  // Initialize DB with timeout and error handling (non-blocking)
  // Server is already listening, so this won't prevent startup
  (async () => {
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database initialization timeout')), 15000)
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
      console.error('⚠️ Server will continue but database features may not work.');
      console.error('⚠️ Please check DATABASE_URL and ensure PostgreSQL is accessible.');
      // Don't throw - let server continue running
    }
  })();
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

// Analytics endpoints - ensure columns exist before using them
async function ensureAnalyticsColumns() {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='visitor_ip') THEN
          ALTER TABLE page_views ADD COLUMN visitor_ip TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='user_agent') THEN
          ALTER TABLE page_views ADD COLUMN user_agent TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_page_views_visitor') THEN
          CREATE INDEX idx_page_views_visitor ON page_views(visitor_ip, created_at);
        END IF;
      END $$;
    `);
  } catch (e) {
    console.error('Error ensuring analytics columns:', e);
  } finally {
    client.release();
  }
}

app.post('/api/analytics/track', async (req, res) => {
  const { pagePath } = req.body || {};
  if (!pagePath || typeof pagePath !== 'string') {
    return res.status(400).json({ error: 'Missing pagePath' });
  }
  try {
    // Ensure columns exist
    await ensureAnalyticsColumns();
    
    // Get visitor IP and user agent for unique visitor tracking
    const visitorIp = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Try to insert with new columns, fallback to old format if they don't exist
    try {
      await pool.query(
        'INSERT INTO page_views (page_path, visitor_ip, user_agent) VALUES ($1, $2, $3)',
        [pagePath, visitorIp, userAgent]
      );
    } catch (insertError) {
      // If columns don't exist, insert without them
      if (insertError?.code === '42703') {
        await pool.query(
          'INSERT INTO page_views (page_path) VALUES ($1)',
          [pagePath]
        );
      } else {
        throw insertError;
      }
    }
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('Analytics track error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/analytics/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Ensure columns exist before querying
    await ensureAnalyticsColumns();
    
    // Check if visitor_ip column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='page_views' AND column_name='visitor_ip'
    `);
    const hasVisitorIp = columnCheck.rows.length > 0;
    
    // Get visitor counts for different time periods
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Count total page views for 7 days
    const pageViews7Days = await pool.query(
      `SELECT COUNT(*) as total_views
       FROM page_views 
       WHERE created_at >= $1`,
      [sevenDaysAgo.toISOString()]
    );
    
    // Count unique visitors for 7 days (distinct IP addresses) - only if column exists
    let uniqueVisitors7Days = { rows: [{ unique_visitors: '0' }] };
    if (hasVisitorIp) {
      try {
        uniqueVisitors7Days = await pool.query(
          `SELECT COUNT(DISTINCT visitor_ip) as unique_visitors
           FROM page_views 
           WHERE created_at >= $1 AND visitor_ip IS NOT NULL AND visitor_ip != 'unknown'`,
          [sevenDaysAgo.toISOString()]
        );
      } catch (e) {
        console.error('Error counting unique visitors 7 days:', e);
      }
    }
    
    // Count total page views for 30 days
    const pageViews30Days = await pool.query(
      `SELECT COUNT(*) as total_views
       FROM page_views 
       WHERE created_at >= $1`,
      [thirtyDaysAgo.toISOString()]
    );
    
    // Count unique visitors for 30 days
    let uniqueVisitors30Days = { rows: [{ unique_visitors: '0' }] };
    if (hasVisitorIp) {
      try {
        uniqueVisitors30Days = await pool.query(
          `SELECT COUNT(DISTINCT visitor_ip) as unique_visitors
           FROM page_views 
           WHERE created_at >= $1 AND visitor_ip IS NOT NULL AND visitor_ip != 'unknown'`,
          [thirtyDaysAgo.toISOString()]
        );
      } catch (e) {
        console.error('Error counting unique visitors 30 days:', e);
      }
    }
    
    // Count all time page views
    const allTimePageViews = await pool.query(
      `SELECT COUNT(*) as total_views
       FROM page_views`
    );
    
    // Count all time unique visitors
    let allTimeUniqueVisitors = { rows: [{ unique_visitors: '0' }] };
    if (hasVisitorIp) {
      try {
        allTimeUniqueVisitors = await pool.query(
          `SELECT COUNT(DISTINCT visitor_ip) as unique_visitors
           FROM page_views 
           WHERE visitor_ip IS NOT NULL AND visitor_ip != 'unknown'`
        );
      } catch (e) {
        console.error('Error counting all time unique visitors:', e);
      }
    }
    
    // Get page rankings (most visited pages)
    const pageRankings = await pool.query(
      `SELECT page_path, COUNT(*) as views
       FROM page_views
       GROUP BY page_path
       ORDER BY views DESC
       LIMIT 10`
    );
    
    // Get daily views for the last 7 days for chart
    const dailyViews = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as views
       FROM page_views
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [sevenDaysAgo.toISOString()]
    );

    // --- Current-year analytics (auto-updates each new year) ---
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const yearStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
    const yearEnd = new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0));

    // Total page views in current year
    const pageViewsYear = await pool.query(
      `SELECT COUNT(*) as total_views
       FROM page_views
       WHERE created_at >= $1 AND created_at < $2`,
      [yearStart.toISOString(), yearEnd.toISOString()]
    );

    // Total unique visitors in current year (if we have visitor_ip)
    let uniqueVisitorsYear = { rows: [{ unique_visitors: '0' }] };
    if (hasVisitorIp) {
      try {
        uniqueVisitorsYear = await pool.query(
          `SELECT COUNT(DISTINCT visitor_ip) as unique_visitors
           FROM page_views
           WHERE created_at >= $1
             AND created_at < $2
             AND visitor_ip IS NOT NULL
             AND visitor_ip != 'unknown'`,
          [yearStart.toISOString(), yearEnd.toISOString()]
        );
      } catch (e) {
        console.error('Error counting unique visitors 2025:', e);
      }
    }

    // Monthly stats for current year
    let monthlyYear;
    if (hasVisitorIp) {
      // With unique visitors per month
      monthlyYear = await pool.query(
        `SELECT
           DATE_TRUNC('month', created_at) AS month,
           COUNT(*) AS views,
           COUNT(DISTINCT visitor_ip) FILTER (
             WHERE visitor_ip IS NOT NULL AND visitor_ip != 'unknown'
           ) AS unique_visitors
         FROM page_views
         WHERE created_at >= $1 AND created_at < $2
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month ASC`,
        [yearStart.toISOString(), yearEnd.toISOString()]
      );
    } else {
      // Fallback if visitor_ip column is missing
      monthlyYear = await pool.query(
        `SELECT
           DATE_TRUNC('month', created_at) AS month,
           COUNT(*) AS views
         FROM page_views
         WHERE created_at >= $1 AND created_at < $2
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month ASC`,
        [yearStart.toISOString(), yearEnd.toISOString()]
      );
    }
    
    res.json({
      pageViews: {
        last7Days: parseInt(pageViews7Days.rows[0]?.total_views || '0'),
        last30Days: parseInt(pageViews30Days.rows[0]?.total_views || '0'),
        allTime: parseInt(allTimePageViews.rows[0]?.total_views || '0')
      },
      uniqueVisitors: {
        last7Days: parseInt(uniqueVisitors7Days.rows[0]?.unique_visitors || '0'),
        last30Days: parseInt(uniqueVisitors30Days.rows[0]?.unique_visitors || '0'),
        allTime: parseInt(allTimeUniqueVisitors.rows[0]?.unique_visitors || '0')
      },
      pageRankings: pageRankings.rows.map(row => ({
        page: row.page_path,
        views: parseInt(row.views)
      })),
      dailyViews: dailyViews.rows.map(row => ({
        date: row.date,
        views: parseInt(row.views)
      })),
      // Current-year aggregates (auto-rollover)
      yearly: {
        year: currentYear,
        pageViews: parseInt(pageViewsYear.rows[0]?.total_views || '0'),
        uniqueVisitors: parseInt(uniqueVisitorsYear.rows[0]?.unique_visitors || '0')
      },
      monthly: monthlyYear.rows.map(row => ({
        month: row.month,
        pageViews: parseInt(row.views),
        uniqueVisitors: hasVisitorIp
          ? parseInt(row.unique_visitors || '0')
          : 0
      }))
    });
  } catch (e) {
    console.error('Analytics stats error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Meeting Recordings API - Superadmin only
// Get all meetings
app.get('/api/meetings', requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, video_url, thumbnail_url, section, created_at, updated_at FROM meeting_recordings ORDER BY section, created_at DESC'
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Get meetings error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create meeting
app.post('/api/meetings', requireAuth, requireSuperAdmin, async (req, res) => {
  const { title, video_url, thumbnail_url, section } = req.body || {};
  if (!title || !video_url) {
    return res.status(400).json({ error: 'Missing title or video_url' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO meeting_recordings (title, video_url, thumbnail_url, section) VALUES ($1, $2, $3, $4) RETURNING id, title, video_url, thumbnail_url, section, created_at, updated_at',
      [title, video_url, thumbnail_url || null, section || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error('Create meeting error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update meeting
app.put('/api/meetings/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, video_url, thumbnail_url, section } = req.body || {};
  if (!title || !video_url) {
    return res.status(400).json({ error: 'Missing title or video_url' });
  }
  try {
    const result = await pool.query(
      'UPDATE meeting_recordings SET title=$1, video_url=$2, thumbnail_url=$3, section=$4, updated_at=NOW() WHERE id=$5 RETURNING id, title, video_url, thumbnail_url, section, created_at, updated_at',
      [title, video_url, thumbnail_url || null, section || null, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update meeting error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete meeting
app.delete('/api/meetings/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM meeting_recordings WHERE id=$1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Delete meeting error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get meeting settings (password hash and access token)
app.get('/api/meetings/settings', requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    let result = await pool.query('SELECT id, access_token, updated_at FROM meeting_settings ORDER BY updated_at DESC LIMIT 1');
    if (result.rowCount === 0) {
      // Initialize default settings if none exist
      const crypto = await import('crypto');
      const defaultToken = crypto.randomBytes(32).toString('hex');
      const defaultPassword = 'password123';
      const defaultHash = await bcrypt.hash(defaultPassword, 10);
      await pool.query(
        'INSERT INTO meeting_settings (password_hash, access_token) VALUES ($1, $2)',
        [defaultHash, defaultToken]
      );
      result = await pool.query('SELECT id, access_token, updated_at FROM meeting_settings ORDER BY updated_at DESC LIMIT 1');
    }
    res.json({ access_token: result.rows[0].access_token, updated_at: result.rows[0].updated_at });
  } catch (e) {
    console.error('Get meeting settings error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update meeting password
app.put('/api/meetings/password', requireAuth, requireSuperAdmin, async (req, res) => {
  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing password' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    let result = await pool.query('SELECT id FROM meeting_settings ORDER BY updated_at DESC LIMIT 1');
    if (result.rowCount === 0) {
      // Create new settings if none exist
      const crypto = await import('crypto');
      const defaultToken = crypto.randomBytes(32).toString('hex');
      await pool.query(
        'INSERT INTO meeting_settings (password_hash, access_token) VALUES ($1, $2)',
        [hash, defaultToken]
      );
    } else {
      await pool.query(
        'UPDATE meeting_settings SET password_hash=$1, updated_at=NOW() WHERE id=$2',
        [hash, result.rows[0].id]
      );
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Update meeting password error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public API: Get meetings by access token (password-protected)
app.get('/api/meetings/public/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const settingsResult = await pool.query(
      'SELECT access_token FROM meeting_settings ORDER BY updated_at DESC LIMIT 1'
    );
    if (settingsResult.rowCount === 0 || settingsResult.rows[0].access_token !== token) {
      return res.status(404).json({ error: 'Invalid access token' });
    }
    const [videos, documents] = await Promise.all([
      pool.query('SELECT id, title, video_url, thumbnail_url, section, created_at FROM meeting_recordings ORDER BY section, created_at DESC'),
      pool.query('SELECT id, title, document_url, document_type, section, created_at FROM meeting_documents ORDER BY section, created_at DESC')
    ]);
    res.json({ videos: videos.rows, documents: documents.rows });
  } catch (e) {
    console.error('Get public meetings error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Document Management API - Superadmin only
// Get all documents
app.get('/api/documents', requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, document_url, document_type, section, created_at, updated_at FROM meeting_documents ORDER BY section, created_at DESC'
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Get documents error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create document
app.post('/api/documents', requireAuth, requireSuperAdmin, async (req, res) => {
  const { title, document_url, document_type, section } = req.body || {};
  if (!title || !document_url) {
    return res.status(400).json({ error: 'Missing title or document_url' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO meeting_documents (title, document_url, document_type, section) VALUES ($1, $2, $3, $4) RETURNING id, title, document_url, document_type, section, created_at, updated_at',
      [title, document_url, document_type || null, section || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error('Create document error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update document
app.put('/api/documents/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, document_url, document_type, section } = req.body || {};
  if (!title || !document_url) {
    return res.status(400).json({ error: 'Missing title or document_url' });
  }
  try {
    const result = await pool.query(
      'UPDATE meeting_documents SET title=$1, document_url=$2, document_type=$3, section=$4, updated_at=NOW() WHERE id=$5 RETURNING id, title, document_url, document_type, section, created_at, updated_at',
      [title, document_url, document_type || null, section || null, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update document error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete document
app.delete('/api/documents/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM meeting_documents WHERE id=$1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Delete document error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public API: Get access token (for navbar link)
app.get('/api/meetings/token', async (_req, res) => {
  try {
    let result = await pool.query('SELECT access_token FROM meeting_settings ORDER BY updated_at DESC LIMIT 1');
    if (result.rowCount === 0) {
      // Initialize default settings if none exist
      const crypto = await import('crypto');
      const defaultToken = crypto.randomBytes(32).toString('hex');
      const defaultPassword = 'password123';
      const defaultHash = await bcrypt.hash(defaultPassword, 10);
      await pool.query(
        'INSERT INTO meeting_settings (password_hash, access_token) VALUES ($1, $2)',
        [defaultHash, defaultToken]
      );
      result = await pool.query('SELECT access_token FROM meeting_settings ORDER BY updated_at DESC LIMIT 1');
    }
    res.json({ token: result.rows[0].access_token });
  } catch (e) {
    console.error('Get token error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public API: Verify password for meetings page
app.post('/api/meetings/verify-password', async (req, res) => {
  const { password, token } = req.body || {};
  if (!password || !token) {
    return res.status(400).json({ error: 'Missing password or token' });
  }
  try {
    const settingsResult = await pool.query(
      'SELECT password_hash, access_token FROM meeting_settings ORDER BY updated_at DESC LIMIT 1'
    );
    if (settingsResult.rowCount === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    const settings = settingsResult.rows[0];
    if (settings.access_token !== token) {
      return res.status(403).json({ error: 'Invalid access token' });
    }
    const valid = await bcrypt.compare(password, settings.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Verify password error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve built frontend (dist) from the same server for Render
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}


