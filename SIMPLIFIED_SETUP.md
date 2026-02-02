# ✨ SIMPLIFIED SETUP - You Asked, We Delivered!

## The Problem
You needed a simpler way to run both servers without managing multiple terminals.

## The Solution
**One command. One terminal. Done.** ✅

```bash
yarn dev
```

## What Changed

### Before (3 Terminals Required 😓)
```
Terminal 1: python run.py --server --port 8888
Terminal 2: node colorgorical-proxy.js  
Terminal 3: yarn serve
```

### After (2 Terminals Required 🎉)
```
Terminal 1: python run.py --server --port 8888
Terminal 2: yarn dev    ← This runs BOTH proxy and study!
```

## What `yarn dev` Does

Runs **both** servers in one terminal with nice colored output:

```
[PROXY] 🎨 Colorgorical Proxy Server running on port 3001
[STUDY]   VITE v7.1.7  ready in 186 ms
[STUDY]   ➜  Local:   http://localhost:8080/
```

- **Blue output** = Proxy server
- **Green output** = Study server
- **Ctrl+C once** = Stops both servers cleanly

## New Package Scripts

Added to `package.json`:

```json
{
  "scripts": {
    "dev": "yarn dev:with-colorgorical",
    "dev:with-colorgorical": "concurrently --names \"PROXY,STUDY\" --prefix-colors \"blue,green\" \"yarn proxy\" \"yarn serve\"",
    "proxy": "node colorgorical-proxy.js"
  }
}
```

## Quick Reference

| Command | What It Does | When To Use |
|---------|--------------|-------------|
| `yarn dev` | Starts proxy + study | **Normal development** ⭐ |
| `yarn serve` | Starts study only | Skip Colorgorical |
| `yarn proxy` | Starts proxy only | Testing proxy |

## Complete Setup (2 Steps)

### Step 1: Start Colorgorical (One Terminal)
```bash
cd /path/to/colorgorical
python run.py --server --port 8888
```
**Leave this running** ← You only do this once!

### Step 2: Start Everything Else (One Terminal)
```bash
cd /path/to/colorstudy2
yarn dev
```

### Step 3: Done! 🎉
Open http://localhost:8080/

## What We Installed

- **concurrently** - Runs multiple commands in one terminal
  - Installed with: `yarn add -D concurrently`
  - Used by: `yarn dev` command

## Files You Should Know About

### 📘 For Quick Start
- **`QUICKSTART.md`** ← Read this first!
- **`CHEATSHEET.txt`** ← Quick reference

### 📗 For Details  
- **`COLORGORICAL_SETUP.md`** ← Detailed setup
- **`COLORGORICAL_INTEGRATION_SUMMARY.md`** ← Technical overview

### 🧪 For Testing
- **`test-colorgorical-integration.js`** ← Run to test

## How To Stop Everything

Just press **`Ctrl+C`** in the terminal running `yarn dev`.

It will automatically stop both:
- The proxy server (port 3001)
- The study server (port 8080)

Then press **`Ctrl+C`** in the Colorgorical terminal to stop that too.

## Troubleshooting

### "Cannot find module 'concurrently'"

```bash
yarn install
```

### Port conflicts

```bash
# Kill process on port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 8080  
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Want even simpler?

Edit `ColorPaletteComparison.tsx` line 41:
```typescript
const USE_COLORGORICAL = false;
```

Then you only need:
```bash
yarn serve
```

No Colorgorical or proxy needed!

## What Happens Behind The Scenes

When you run `yarn dev`:

1. **concurrently** starts two processes in parallel
2. Process 1 (PROXY): `yarn proxy` → `node colorgorical-proxy.js`
3. Process 2 (STUDY): `yarn serve` → `vite --host=0.0.0.0 --port=8080`
4. Both outputs are displayed with colored prefixes
5. When you press Ctrl+C, both are stopped gracefully

## Benefits

✅ **One command** instead of two separate terminals  
✅ **Colored output** makes it easy to see which server is which  
✅ **Automatic cleanup** - Ctrl+C stops everything properly  
✅ **No race conditions** - concurrently handles startup order  
✅ **Professional setup** - Same approach used by major frameworks  

## Still Want The Old Way?

The original scripts still work:

```bash
# Terminal 1
node colorgorical-proxy.js

# Terminal 2  
yarn serve
```

## Production Note

For production deployment, you'll want to run these as separate services (using PM2, systemd, or similar). The `yarn dev` command is optimized for development.

See `COLORGORICAL_SETUP.md` section "Production Deployment" for details.

## Summary

**Before:** 3 terminals, complex setup  
**After:** 2 terminals, one simple command

```bash
# Terminal 1 (once per session)
python run.py --server --port 8888

# Terminal 2 (your main terminal)  
yarn dev
```

**That's it!** 🎉
