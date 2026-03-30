import { writeFileSync } from 'fs';
import { config } from 'dotenv';

/** @type {'dev' | 'pro'} */
const mode = process.argv[2] === 'pro' ? 'pro' : 'dev';

// Local: .env (dev) / .env.pro (pro). CI/Coolify inject env vars; override with API_URL if needed.
if (mode === 'pro') {
  config({ path: '.env.pro' });
} else {
  config();
}

const apiUrl = process.env['API_URL'] ?? 'http://localhost:3000/api';
const isProd = mode === 'pro';

const content = `export const environment = {
  production: ${isProd},
  apiUrl: '${apiUrl}'
};
`;

writeFileSync('src/environments/environment.ts', content);
console.log(`[set-env] mode=${mode} production=${isProd} apiUrl=${apiUrl}`);
