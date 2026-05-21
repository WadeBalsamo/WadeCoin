/**
 * Starts two things:
 *  1. `ng build --watch` — rebuilds on every file change, outputs to dist/browser
 *  2. Vite dev server serving dist/browser with API proxy to :8080
 *
 * Vite starts only after the first ng build completes (watches stdout for the
 * "Application bundle generation complete" line) so the initial page load never
 * hits a missing-file 404.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 4200;

let viteStarted = false;

// ── 1. ng build --watch ──────────────────────────────────────────────────────
const ngEnv = { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false' };
const builder = spawn(
  './node_modules/.bin/ng',
  ['build', '--watch', '--configuration=development', '--no-progress'],
  { stdio: ['inherit', 'pipe', 'inherit'], env: ngEnv, cwd: __dirname },
);

builder.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  // Wait for the first successful build before starting Vite
  if (!viteStarted && chunk.toString().includes('bundle generation complete')) {
    viteStarted = true;
    startVite();
  }
});

builder.on('exit', code => {
  process.exit(code ?? 0);
});

// ── 2. Vite dev server (started after first build) ───────────────────────────
function startVite() {
  const viteServer = spawn(
    './node_modules/.bin/vite',
    ['--port', PORT.toString(), '--host', '0.0.0.0'],
    { stdio: 'inherit', cwd: __dirname },
  );

  viteServer.on('exit', code => {
    builder.kill();
    process.exit(code ?? 0);
  });

  process.on('SIGTERM', () => { viteServer.kill('SIGTERM'); builder.kill('SIGTERM'); });
  process.on('SIGINT',  () => { viteServer.kill('SIGINT');  builder.kill('SIGINT');  });
}
