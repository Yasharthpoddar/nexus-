require('dotenv').config();
const { Client } = require('pg');

async function updateSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    // Check missing columns
    await client.query(`
      ALTER TABLE certificates
      ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS transcript_path TEXT;
    `);
    console.log("Schema columns updated.");
  } catch (err) {
    console.error("Schema update failed:", err);
  } finally {
    await client.end();
  }
}
updateSchema();
