/**
 * Starts two things:
 *  1. `ng build --watch` — rebuilds on every file change
 *  2. Vite dev server with hot module replacement and API proxy
 *
 * This combines Angular's compiler with Vite's modern dev server.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 4200;

// ── 1. ng build --watch ──────────────────────────────────────────────────────
const ngEnv = { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false' };
const builder = spawn(
  './node_modules/.bin/ng',
  ['build', '--watch', '--configuration=development', '--no-progress'],
  { stdio: 'inherit', env: ngEnv, cwd: __dirname },
);

// ── 2. Vite dev server ────────────────────────────────────────────────────────
setTimeout(() => {
  const viteServer = spawn(
    './node_modules/.bin/vite',
    ['--port', PORT.toString(), '--host', '0.0.0.0'],
    { stdio: 'inherit', cwd: __dirname },
  );

  viteServer.on('exit', code => {
    builder.kill();
    process.exit(code ?? 0);
  });

  process.on('SIGTERM', () => {
    viteServer.kill('SIGTERM');
    builder.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    viteServer.kill('SIGINT');
    builder.kill('SIGINT');
  });
}, 2000);

// ── Graceful shutdown ────────────────────────────────────────────────────────
builder.on('exit', code => {
  process.exit(code ?? 0);
});
