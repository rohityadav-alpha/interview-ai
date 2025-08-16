// D:/interview-ai/drizzle.config.ts
import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '.env.local' })

import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts', // Aapke schema file ka path
  out: './drizzle',             // Migrations yahan save hongi
  dialect: 'postgresql',        // Bata rahe hain ki DB postgresql hai
  dbCredentials: {
    url: process.env.DATABASE_URL!, // .env file se URL uthayega
  },
    verbose: true,
  strict: true,
});
