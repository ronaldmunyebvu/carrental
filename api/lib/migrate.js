const pool = require('./db');

async function runMigrations() {
  try {
    const tableCheck = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cars'`
    );
    if (tableCheck.rows.length === 0) return;
    await pool.query('ALTER TABLE cars ADD COLUMN IF NOT EXISTS phone VARCHAR(40)');
    await pool.query('ALTER TABLE cars ADD COLUMN IF NOT EXISTS requirements TEXT');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

module.exports = runMigrations;
