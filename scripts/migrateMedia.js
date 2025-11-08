import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { v2 as cloudinary } from 'cloudinary';

loadEnv();

if (!process.env.CLOUDINARY_URL) {
  console.error('❌ CLOUDINARY_URL is not set. Aborting migration.');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Aborting migration.');
  process.exit(1);
}

cloudinary.config({
  secure: true,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false },
});

const cache = new Map();
const jsonColumns = new Set(['images', 'videos']);

async function uploadIfBase64(value, folder) {
  if (!value || typeof value !== 'string') return { value, updated: false };
  if (!value.startsWith('data:')) return { value, updated: false };

  if (cache.has(value)) {
    return { value: cache.get(value), updated: true };
  }

  console.log(`☁️ Uploading asset to Cloudinary (${folder})...`);
  const uploaded = await cloudinary.uploader.upload(value, {
    resource_type: 'auto',
    folder,
  });
  cache.set(value, uploaded.secure_url);
  return { value: uploaded.secure_url, updated: true };
}

async function migrateTable(table, columns, folder) {
  console.log(`\n=== Migrating ${table} media ===`);
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT id, ${columns.join(', ')} FROM ${table}`);
    for (const row of res.rows) {
      let changed = false;
      const updates = {};

      for (const col of columns) {
        let data = row[col];

        if (typeof data === 'string' && jsonColumns.has(col)) {
          try {
            data = JSON.parse(data);
          } catch (err) {
            console.warn(`⚠️ Failed to parse JSON for ${table}.${col} on row ${row.id}:`, err);
          }
        }

        if (Array.isArray(data)) {
          const newArr = [];
          for (const item of data) {
            if (item && typeof item === 'object' && typeof item.url === 'string') {
              const { value, updated } = await uploadIfBase64(item.url, `${folder}/${row.id}`);
              if (updated) changed = true;
              newArr.push({ ...item, url: value });
            } else {
              const { value, updated } = await uploadIfBase64(item, `${folder}/${row.id}`);
              if (updated) changed = true;
              newArr.push(value);
            }
          }
          updates[col] = newArr;
        } else if (data && typeof data === 'object' && typeof data.url === 'string') {
          const { value, updated } = await uploadIfBase64(data.url, `${folder}/${row.id}`);
          if (updated) changed = true;
          updates[col] = { ...data, url: value };
        } else if (typeof data === 'string') {
          const { value, updated } = await uploadIfBase64(data, `${folder}/${row.id}`);
          if (updated) changed = true;
          updates[col] = value;
        } else {
          updates[col] = data;
        }
      }

      if (!changed) continue;

      console.log(`✅ Updating ${table} row ${row.id}`);
      const setFragments = columns.map((col, idx) => `${col} = $${idx + 2}${jsonColumns.has(col) ? '::jsonb' : ''}`);
      const values = columns.map((col) => {
        const val = updates[col];
        if (val === undefined) return null;
        if (jsonColumns.has(col) && Array.isArray(val)) return JSON.stringify(val);
        return val;
      });
      await client.query(
        `UPDATE ${table} SET ${setFragments.join(', ')} WHERE id = $1`,
        [row.id, ...values]
      );
    }
  } finally {
    client.release();
  }
}

(async () => {
  try {
    await migrateTable('crusades', ['preview_image', 'preview_video', 'images', 'videos'], 'unendingpraise/crusades');
    await migrateTable('testimonies', ['preview_image', 'preview_video', 'images', 'videos'], 'unendingpraise/testimonies');
    console.log('\n🎉 Migration completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
})();
