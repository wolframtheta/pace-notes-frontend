import { writeFileSync } from 'fs';
import { config } from 'dotenv';

// Load .env only in local dev (CI/Coolify inject env vars directly)
config();

const apiUrl = process.env['API_URL'] ?? 'http://localhost:3000/api';
const isProd = process.env['NODE_ENV'] === 'production';

const content = `export const environment = {
  production: ${isProd},
  apiUrl: '${apiUrl}'
};
`;

writeFileSync('src/environments/environment.ts', content);
console.log(`[set-env] apiUrl=${apiUrl}`);
