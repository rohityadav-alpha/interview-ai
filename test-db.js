require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  process.exit(1); // Exit script
}

// Extract password safely
const match = connectionString.match(/:([^@]+)@/);
const password = match ? match[1] : null;
const forcedPassword = String(password); // Force as string

// Rebuild connection string
const updatedConnectionString = connectionString.replace(
  `:${password}@`,
  `:${forcedPassword}@`
);

const pool = new Pool({ connectionString: updatedConnectionString });

(async () => {
  try {
    const client = await pool.connect();
    client.release();
  } catch (e) {
    }
})();
