# Quick Start Guide - Colorgorical Integration

## The Simplest Way 🚀

Just run **one command** in **one terminal**:

```bash
yarn dev
```

That's it! This will start both:
- **Colorgorical Proxy** (port 3001) - Blue output
- **Study Development Server** (port 8080) - Green output

## What You Need Before Starting

### 1. Start Colorgorical Server (Only Once)

In a **separate terminal**, start Colorgorical:

```bash
cd /path/to/colorgorical
python run.py --server --port 8888
```

**Leave this running** - you only need to do this once per session.

### 2. Start Everything Else

In your **colorstudy2** directory:

```bash
yarn dev
```

You'll see output like:
```
[PROXY] 🎨 Colorgorical Proxy Server running on port 3001
[STUDY] VITE v7.1.7  ready in 186 ms
[STUDY] ➜  Local:   http://localhost:8080/
```

### 3. Open Your Browser

Go to http://localhost:8080/ and select "color-palette-study"

## Alternative Commands

### Just the Proxy Server

```bash
yarn proxy
```

### Just the Study Server (No Colorgorical)

```bash
yarn serve
```

### Both Servers Together (Recommended)

```bash
yarn dev
```

## Stopping Everything

Press `Ctrl+C` once - it will stop both servers cleanly.

## Troubleshooting

### "Cannot connect to Colorgorical API"

**Problem:** You see this error when clicking a color.

**Solution:** Make sure Colorgorical is running:
```bash
cd /path/to/colorgorical
python run.py --server --port 8888
```

### Port 3001 Already in Use

**Problem:** Proxy fails to start with "port already in use"

**Solution:** Kill the existing process:
```bash
# Find the process
lsof -i :3001

# Kill it
kill -9 <PID>

# Or let the script handle it
yarn dev
```

### Want to Use LAB Fallback Instead?

If you don't want to use Colorgorical at all, edit `ColorPaletteComparison.tsx`:

```typescript
const USE_COLORGORICAL = false; // Line 41
```

Then just run:
```bash
yarn serve
```

## What Each Script Does

| Command | What It Runs | Ports | Use When |
|---------|-------------|-------|----------|
| `yarn dev` | Proxy + Study | 3001, 8080 | **Normal development** ✨ |
| `yarn proxy` | Just proxy | 3001 | Testing proxy only |
| `yarn serve` | Just study | 8080 | No Colorgorical needed |
| `yarn dev:with-colorgorical` | Same as `yarn dev` | 3001, 8080 | Explicit long name |

## Full System Overview

```
Terminal 1 (Colorgorical - Keep Running):
┌──────────────────────────────────────┐
│ cd /path/to/colorgorical             │
│ python run.py --server --port 8888   │
│                                      │
│ 🐍 Colorgorical API (Port 8888)     │
└──────────────────────────────────────┘

Terminal 2 (Everything Else - One Command):
┌──────────────────────────────────────┐
│ yarn dev                             │
│                                      │
│ ├─ 🎨 Proxy (Port 3001)             │
│ └─ 🖥️  Study (Port 8080)            │
└──────────────────────────────────────┘
```

## Testing

Test that everything is connected:

```bash
# Quick test
node test-colorgorical-integration.js

# Or manual test
curl http://localhost:3001/health
```

## Daily Workflow

**Morning setup (5 seconds):**
```bash
# Terminal 1
cd /path/to/colorgorical && python run.py --server --port 8888

# Terminal 2  
cd /path/to/colorstudy2 && yarn dev
```

**During development:**
- Edit files, hot reload works automatically
- Both servers restart automatically if needed
- Browser at http://localhost:8080/

**End of day:**
- `Ctrl+C` in Terminal 2 (stops both study + proxy)
- `Ctrl+C` in Terminal 1 (stops Colorgorical)

## Need Help?

- **Detailed docs:** See `COLORGORICAL_SETUP.md`
- **Integration overview:** See `COLORGORICAL_INTEGRATION_SUMMARY.md`
- **Test script:** Run `node test-colorgorical-integration.js`

## Production Deployment

For production, you'll want to:

1. Run Colorgorical as a service
2. Run proxy as a service (with PM2 or similar)
3. Build and deploy the study: `yarn build`

See `COLORGORICAL_SETUP.md` for production setup details.
