const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log("Connecting to:", process.env.DATABASE_URL.split('@')[1]);
    await client.connect();
    console.log("Successfully connected to the database!");
    const res = await client.query('SELECT NOW()');
    console.log("Current time from DB:", res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

testConnection();
