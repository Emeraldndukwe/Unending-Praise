import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function promoteSuperadmin() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set.');
    process.exit(1);
  }
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const email = 'emeraldndukwe2@gmail.com';
  try {
    const update = await pool.query("UPDATE users SET role='superadmin', status='active' WHERE LOWER(email)=LOWER($1) RETURNING id, email, role, status", [email]);
    if (update.rowCount > 0) {
      console.log('Updated existing user:', update.rows[0]);
    } else {
      const password = 'Emrys2004';
      const hash = await bcrypt.hash(password, 10);
      const insert = await pool.query("INSERT INTO users (name, email, password_hash, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, role, status", ['Emerald', email, hash, 'superadmin', 'active']);
      console.log('Created new superadmin user:', insert.rows[0]);
    }
  } catch (err) {
    console.error('Error promoting user:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

promoteSuperadmin();
