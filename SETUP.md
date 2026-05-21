# Angular + Vite Setup Guide

This document explains the step-by-step setup of the WadeCoin project with Angular and Vite as the build tool and dev server.

## Project Structure

The project is organized as a monorepo using **pnpm workspaces** with the following structure:

```
WadeCoin/
├── artifacts/
│   ├── angular-booking/     # Angular + Vite application
│   ├── api-server/          # Express backend API
│   └── mockup-sandbox/      # Separate Vite project
├── lib/                      # Shared libraries
│   ├── db/
│   ├── api-client-react/
│   └── api-zod/
├── scripts/                  # Build and utility scripts
├── package.json             # Root workspace configuration
├── pnpm-workspace.yaml      # pnpm monorepo configuration
└── tsconfig.json            # Root TypeScript configuration
```

## Setup Steps Performed

### 1. Install pnpm (Global Package Manager)

```bash
npm install -g pnpm
```

pnpm is the package manager for this monorepo. It's more efficient than npm/yarn and handles workspaces better.

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for all packages in the monorepo, including:
- Angular 17.3.0 with platform-browser, forms, animations, router
- TypeScript 5.4.2
- RxJS 7.8.0
- Vite 7.3.3 (added to angular-booking)

### 3. Convert Angular Project to Vite

The existing Angular project in `artifacts/angular-booking/` was originally set up with Angular CLI's build system. Here's how it was converted:

#### Step 3a: Add Vite Dependency

```bash
cd /root/WadeCoin/artifacts/angular-booking
pnpm add -D vite
```

#### Step 3b: Create `vite.config.js`

Created `/root/WadeCoin/artifacts/angular-booking/vite.config.js`:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/',
  publicDir: 'public',
  server: {
    port: 4200,
    host: '0.0.0.0',
    strictPort: false,
    middlewareMode: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist/browser',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: true,
  },
  preview: {
    port: 4200,
    host: '0.0.0.0',
  },
});
```

**Key configurations:**
- **root: 'src'**: Vite serves from the src directory where index.html is located
- **proxy**: Routes `/api/*` requests to the Express API server on port 8080
- **build.outDir**: Angular build output goes to `dist/browser/`
- **server.host: '0.0.0.0'**: Allows external connections (important for Docker/remote environments)

#### Step 3c: Update `start.mjs` (Dev Server Launcher)

Modified `/root/WadeCoin/artifacts/angular-booking/start.mjs` to:
1. Run `ng build --watch` to compile Angular in watch mode
2. Start Vite dev server (after a 2-second delay) with hot module replacement

The hybrid approach combines:
- **Angular CLI** for type-safe compilation and advanced features
- **Vite** for fast dev server and modern bundling

```javascript
// Key processes:
// 1. ng build --watch --configuration=development
// 2. vite --port 4200 --host 0.0.0.0
```

#### Step 3d: Enable ES Modules in package.json

Added `"type": "module"` to `/root/WadeCoin/artifacts/angular-booking/package.json` to:
- Allow `start.mjs` to be executed as an ES module
- Enable Vite to load configuration properly
- Support modern JavaScript syntax

#### Step 3e: Update npm Scripts

Updated `package.json` scripts in `artifacts/angular-booking/`:

```json
{
  "scripts": {
    "dev": "node start.mjs",              // Run with Vite dev server
    "build": "ng build --configuration=production",  // Production build
    "build:watch": "ng build --watch --configuration=development",
    "vite": "vite",                        // Raw Vite dev server
    "vite:build": "vite build",           // Vite production build
    "vite:preview": "vite preview",       // Preview production build
    "typecheck": "tsc -p tsconfig.app.json --noEmit"
  }
}
```

## Running the Project

### Development Mode

From the `artifacts/angular-booking/` directory or via pnpm workspace:

```bash
pnpm dev
```

This:
1. Starts Angular CLI in watch mode (compiles on file changes)
2. Starts Vite dev server on http://localhost:4200
3. Provides API proxy to http://localhost:8080
4. Enables hot module replacement for fast iteration

Expected output:
```
VITE v7.3.3  ready in XXXms

➜  Local:   http://localhost:4200/
➜  Network: http://0.0.0.0:4200/
```

### Production Build

```bash
pnpm build
```

Creates optimized production build in `dist/browser/` with:
- Minified JavaScript (esbuild)
- Source maps for debugging
- Angular AOT compilation
- Tree-shaking and code splitting

### Preview Production Build

```bash
pnpm vite:preview
```

Serves the production build locally for testing before deployment.

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│              Browser (Port 4200)                │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────┐          ┌────────▼──────┐
    │ Vite   │          │ Vite Hot      │
    │ Dev    │◄────────►│ Module        │
    │Server  │          │Replacement    │
    └───┬────┘          └───────────────┘
        │
        ├──► Serves src/index.html
        │
        ├──► Serves compiled Angular assets
        │    (from ng build --watch)
        │
        └──► Proxies /api/* to Express API
             (http://localhost:8080)
             
┌─────────────────────┐
│  ng build --watch   │
│  (Angular Compiler) │
│                     │
│  Compiles:          │
│  - TypeScript       │
│  - Angular metadata │
│  - Decorators       │
│  - Templates        │
│                     │
│  Output → dist/     │
└─────────────────────┘
```

## Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| Angular | 17.3.0 | Frontend framework |
| Vite | 7.3.3 | Dev server & bundler |
| TypeScript | 5.4.2 | Type-safe JavaScript |
| RxJS | 7.8.0 | Reactive programming |
| pnpm | 10.33.4 | Package manager |

## Why This Approach?

### Vite Benefits
- ✅ **Fast dev server**: Instant HMR (hot module replacement)
- ✅ **Modern tooling**: ES modules, esbuild bundling
- ✅ **Smaller bundle**: Better tree-shaking
- ✅ **Easy configuration**: Simple vite.config.js

### Keeping Angular CLI Compiler
- ✅ **Type safety**: Leverages Angular's advanced compilation
- ✅ **Decorator support**: Proper Angular metadata handling
- ✅ **Zone.js integration**: Automatic change detection
- ✅ **Proven stable**: Angular 17's compiler is rock-solid

### Hybrid Approach
Combines the best of both worlds:
1. **Angular CLI** (compiler) for robust, type-safe compilation
2. **Vite** (dev server) for fast, modern development experience
3. **API proxy** built into Vite for local backend testing

## Environment Requirements

- **Node.js**: 20.19+ or 22.12+ (Vite requirement)
- **pnpm**: 10.33.4+
- **Package managers**: Uses pnpm only (enforced via preinstall script)

## Troubleshooting

### Port 4200 Already in Use
```bash
lsof -i :4200  # Find process using the port
kill -9 <PID>  # Kill the process
```

### Vite HMR Not Working
- Ensure you're accessing via http://localhost:4200 (not 0.0.0.0)
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R)

### Angular Compilation Errors
- Check the terminal running `ng build --watch`
- Fix TypeScript errors in your source files
- Vite will automatically rebuild on save

### API Proxy Not Working
- Verify Express API is running on port 8080
- Check vite.config.js proxy configuration
- Inspect browser Network tab for proxy errors

## Next Steps

1. **Start development**: `pnpm dev`
2. **Open browser**: http://localhost:4200
3. **Edit files**: Changes auto-reload via HMR
4. **Create components**: Use Angular CLI or manual creation
5. **Build for production**: `pnpm build`

## File Reference

- **Monorepo root**: `/root/WadeCoin/`
- **Angular app**: `/root/WadeCoin/artifacts/angular-booking/`
- **Vite config**: `/root/WadeCoin/artifacts/angular-booking/vite.config.js`
- **Dev launcher**: `/root/WadeCoin/artifacts/angular-booking/start.mjs`
- **Angular config**: `/root/WadeCoin/artifacts/angular-booking/angular.json`
- **App source**: `/root/WadeCoin/artifacts/angular-booking/src/`
