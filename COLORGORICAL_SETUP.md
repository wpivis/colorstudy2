# Colorgorical Integration Setup Guide

This document explains how to use the Colorgorical API to generate alternative colors in the color palette study.

## Overview

When a user selects a color to replace, the system now:
1. Sends the current palette to the Colorgorical API
2. Colorgorical generates 9 perceptually-distinct alternatives that work well with the remaining colors
3. The alternatives are displayed in a 3×3 grid for the user to choose from

## System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  React Frontend │────────▶│  Proxy Server    │────────▶│  Colorgorical   │
│  (Port 8080)    │         │  (Port 3001)     │         │  API (Port 8888)│
│                 │◀────────│                  │◀────────│                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Setup Instructions

### 1. Start the Colorgorical Server

In a separate terminal, start the Colorgorical server:

```bash
cd /path/to/colorgorical
python run.py --server --port 8888
```

You should see:
```
 * Running on http://127.0.0.1:8888/
```

### 2. Start the Proxy Server

In the colorstudy2 directory, start the proxy server:

```bash
node colorgorical-proxy.js
```

You should see:
```
🎨 Colorgorical Proxy Server running on port 3001
   Colorgorical API: http://localhost:8888/api/makePaletteCandidates
   Endpoints:
   - POST http://localhost:3001/api/color-alternatives
   - POST http://localhost:3001/api/color-alternatives/test (for testing)
   - GET  http://localhost:3001/health
```

### 3. Start the Study Development Server

```bash
yarn serve
```

The study will be available at http://localhost:8080/

## Testing the Integration

### Test 1: Health Check

Verify the proxy server is running:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "colorgoricalApi": "http://localhost:8888/api/makePaletteCandidates"
}
```

### Test 2: Test Endpoint (No Colorgorical Required)

Test the proxy without needing Colorgorical:

```bash
curl -X POST http://localhost:3001/api/color-alternatives/test \
  -H "Content-Type: application/json" \
  -d '{
    "palette": ["#8FD895", "#2E7D8F", "#4169E1", "#00E676", "#2F4F3F"],
    "selectedIndex": 1,
    "numCandidates": 9
  }'
```

### Test 3: Full Integration Test

Test with the actual Colorgorical API:

```bash
curl -X POST http://localhost:3001/api/color-alternatives \
  -H "Content-Type: application/json" \
  -d '{
    "palette": ["#8FD895", "#2E7D8F", "#4169E1", "#00E676", "#2F4F3F"],
    "selectedIndex": 1,
    "numCandidates": 9
  }'
```

Expected response:
```json
{
  "success": true,
  "alternatives": [
    "#5A8DB2",
    "#3F7CA5",
    "#6B9AC4",
    ...
  ],
  "originalColor": "#2E7D8F",
  "selectedIndex": 1,
  "metadata": {
    "paletteSize": 5,
    "numFixed": 4,
    "numGenerated": 1
  }
}
```

## How It Works

### User Flow

1. **User selects a color**: User clicks on one of the 5 colors in the palette (e.g., index 1, the dark teal)

2. **API Request**: React component calls the proxy server:
   ```javascript
   POST http://localhost:3001/api/color-alternatives
   {
     "palette": ["#8FD895", "#2E7D8F", "#4169E1", "#00E676", "#2F4F3F"],
     "selectedIndex": 1,
     "numCandidates": 9
   }
   ```

3. **Proxy Processing**:
   - Converts palette colors from hex to LAB color space
   - Removes the selected color (index 1)
   - Sends remaining 4 colors as "fixed colors" to Colorgorical

4. **Colorgorical Generation**:
   - Generates 9 complete palettes of 5 colors each
   - Each palette has the 4 fixed colors plus 1 new color
   - The new color is optimized for perceptual distance

5. **Response Extraction**:
   - Proxy extracts the new color at index 1 from each of the 9 palettes
   - Returns just those 9 alternative colors

6. **Display**: React component displays the 9 alternatives in a 3×3 grid

### Key Parameters

- **paletteSize**: Total number of colors in the palette (5)
- **numCandidates**: Number of alternatives to generate (9)
- **startPalette**: The fixed colors (4 colors in LAB format)
- **weights**: Controls generation priorities
  ```json
  {
    "ciede2000": 1.0,        // Maximize perceptual distance
    "nameDifference": 0.0,
    "nameUniqueness": 0.0,
    "pairPreference": 0.0
  }
  ```

## Fallback Mechanism

If the Colorgorical API is unavailable, the system automatically falls back to LAB-based color generation:

```javascript
const USE_COLORGORICAL = true; // Set to false to use LAB fallback
```

The fallback generates colors by:
- Shifting in L* (lightness) dimension: ±20 units
- Shifting in a* dimension: ±2.3 (red-green axis)
- Shifting in b* dimension: ±2.3 (yellow-blue axis)

## Configuration

### Change Colorgorical API URL

Edit `colorgorical-proxy.js`:
```javascript
const COLORGORICAL_API = 'http://different-server:8888/api/makePaletteCandidates';
```

Or set environment variable:
```bash
export COLORGORICAL_API=http://different-server:8888/api/makePaletteCandidates
node colorgorical-proxy.js
```

### Disable Colorgorical (Use Fallback)

Edit `ColorPaletteComparison.tsx`:
```typescript
const USE_COLORGORICAL = false;
```

### Adjust Number of Alternatives

Change from 9 to any other number (though the 3×3 grid is designed for 9):

In `ColorPaletteComparison.tsx`:
```typescript
const alternatives = await generateColorgoricalAlternatives(originalPalette, index);
// Change to:
const alternatives = await generateColorgoricalAlternatives(originalPalette, index, 16); // 4×4 grid
```

## Troubleshooting

### Error: "Cannot connect to Colorgorical API"

**Cause**: Colorgorical server is not running

**Solution**:
```bash
cd /path/to/colorgorical
python run.py --server --port 8888
```

### Error: Connection refused on port 3001

**Cause**: Proxy server is not running

**Solution**:
```bash
node colorgorical-proxy.js
```

### Alternatives look similar to original

**Cause**: The fixed colors are too constraining

**Solution**: This is actually correct behavior - Colorgorical is finding colors that work well with the other 4 colors while being perceptually distinct. If you want more variation, you can adjust the weights.

### Slow response time

**Expected**: Generating 9 alternatives takes 2-5 seconds

**To improve**:
- Reduce number of candidates
- Pre-generate alternatives when study loads
- Cache results for repeated trials

## Files Modified

1. **colorgorical-proxy.js** - New proxy server for Colorgorical API
2. **src/public/color-palette-study/assets/ColorPaletteComparison.tsx** - Updated React component
3. **package.json** - Added express, cors, axios dependencies

## Production Deployment

For production, you'll want to:

1. **Run proxy as a service** (using PM2, systemd, etc.)
2. **Add proper error logging**
3. **Implement caching** for repeated palettes
4. **Monitor API health** and automatically switch to fallback
5. **Use environment-based configuration**

Example with PM2:
```bash
pm2 start colorgorical-proxy.js --name colorgorical-proxy
pm2 save
pm2 startup
```

## Performance Tips

1. **Pre-generate alternatives**: Load alternatives for all trials at study start
2. **Cache results**: Same palette + index = same alternatives
3. **Parallel requests**: If multiple colors are likely to be modified, generate in parallel
4. **Timeout handling**: Set reasonable timeouts and fallback quickly

## API Reference

### POST /api/color-alternatives

Generate alternative colors for a selected palette color.

**Request:**
```json
{
  "palette": ["#8FD895", "#2E7D8F", "#4169E1", "#00E676", "#2F4F3F"],
  "selectedIndex": 1,
  "numCandidates": 9
}
```

**Response:**
```json
{
  "success": true,
  "alternatives": ["#5A8DB2", "#3F7CA5", ...],
  "originalColor": "#2E7D8F",
  "selectedIndex": 1,
  "metadata": {
    "paletteSize": 5,
    "numFixed": 4,
    "numGenerated": 1
  }
}
```

**Error Response:**
```json
{
  "error": "Cannot connect to Colorgorical API",
  "message": "Is the Colorgorical server running at http://localhost:8888?",
  "details": "Connection refused"
}
```

## Questions?

If you encounter issues:
1. Check all three servers are running (study, proxy, colorgorical)
2. Verify network connectivity between servers
3. Check browser console for error messages
4. Review proxy server logs
5. Test endpoints individually with curl

For more details, see:
- `AI_AGENT_PROMPT.md` - Original requirements
- `INTEGRATION_GUIDE.md` - Detailed integration guide
- `VISUAL_GUIDE.md` - Visual explanation of the process
