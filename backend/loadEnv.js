import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.join(__dirname, '.env');
const envResult = dotenv.config({ path: envFile });

if (envResult.error && envResult.error.code !== 'ENOENT') {
  console.warn(`[WARN] could not load .env from ${envFile}: ${envResult.error.message}`);
} else if (!envResult.error) {
  console.log(`[INFO] Loaded environment from ${envFile}`);
}
