# Colorgorical API Integration - Complete Summary

## What Was Implemented

✅ **Full integration** of Colorgorical API for generating perceptually-optimized color alternatives
✅ **Proxy server** to handle API communication between React frontend and Python Colorgorical API
✅ **Automatic fallback** to LAB-based generation if Colorgorical is unavailable
✅ **Loading indicators** and error handling for better UX
✅ **Complete documentation** and setup guides

## Architecture

```
User clicks color → React Component → Proxy Server → Colorgorical API
                         ↓                              ↓
                    Display 9 alternatives ←── Generate alternatives
```

## Files Created/Modified

### New Files

1. **`colorgorical-proxy.js`**
   - Express server that proxies requests to Colorgorical API
   - Converts hex colors to LAB format
   - Handles fixed color logic (4 colors stay, 1 is replaced)
   - Port: 3001

2. **`COLORGORICAL_SETUP.md`**
   - Complete setup and usage guide
   - Troubleshooting tips
   - API reference
   - Testing instructions

3. **`start-with-colorgorical.sh`**
   - One-command startup script
   - Checks dependencies
   - Starts all required servers

### Modified Files

1. **`src/public/color-palette-study/assets/ColorPaletteComparison.tsx`**
   - Added Colorgorical API client function
   - Updated `handleColorClick` to call API
   - Added loading state and error handling
   - Kept LAB-based generation as fallback

2. **`package.json`**
   - Added: `express`, `cors`, `axios`

## How It Works

### Step-by-Step Flow

1. **User Action**: User clicks on color #2 (index 1) in palette `["#8FD895", "#2E7D8F", "#4169E1", "#00E676", "#2F4F3F"]`

2. **API Request**:
   ```javascript
   POST http://localhost:3001/api/color-alternatives
   {
     palette: ["#8FD895", "#2E7D8F", "#4169E1", "#00E676", "#2F4F3F"],
     selectedIndex: 1,
     numCandidates: 9
   }
   ```

3. **Proxy Processing**:
   - Removes color at index 1 (#2E7D8F)
   - Converts remaining 4 colors to LAB: `[[86,-39,-10], [47,-27,-29], [80,-65,43], [30,-19,9]]`
   - Calls Colorgorical with these as "fixed colors"

4. **Colorgorical Response**:
   - Generates 9 complete palettes (5 colors each)
   - Each has the 4 fixed colors + 1 optimized new color
   - Returns: `[["#8FD895", "#5A8DB2", "#4169E1", "#00E676", "#2F4F3F"], ...]`

5. **Extract Alternatives**:
   - Proxy extracts color at index 1 from each palette
   - Returns: `["#5A8DB2", "#3F7CA5", "#6B9AC4", ...]` (9 alternatives)

6. **Display**: React shows 9 alternatives in 3×3 grid

### Why This Approach?

✅ **Perceptually distinct**: Colorgorical uses CIE Delta E for color difference
✅ **Contextual**: Considers the other 4 colors when generating alternatives
✅ **Optimized**: Balances multiple criteria (distance, aesthetics, etc.)
✅ **Reproducible**: Same input → same alternatives (good for research)

## Quick Start

### Option 1: Using the Script

```bash
# 1. Start Colorgorical (in separate terminal)
cd /path/to/colorgorical
python run.py --server --port 8888

# 2. Start everything else
cd /path/to/colorstudy2
./start-with-colorgorical.sh
```

### Option 2: Manual Start

```bash
# Terminal 1: Colorgorical
cd /path/to/colorgorical
python run.py --server --port 8888

# Terminal 2: Proxy
cd /path/to/colorstudy2
node colorgorical-proxy.js

# Terminal 3: Study
cd /path/to/colorstudy2
yarn serve
```

Then open http://localhost:8080/

## Testing

### 1. Test Proxy Health

```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","colorgoricalApi":"http://localhost:8888/api/makePaletteCandidates"}
```

### 2. Test Alternative Generation

```bash
curl -X POST http://localhost:3001/api/color-alternatives \
  -H "Content-Type: application/json" \
  -d '{
    "palette": ["#58b5e1", "#41d26b", "#996f31"],
    "selectedIndex": 1,
    "numCandidates": 9
  }'
```

Should return 9 alternative colors for the green (#41d26b).

### 3. Test in Browser

1. Go to http://localhost:8080/
2. Select "color-palette-study"
3. Click on any color in the palette
4. You should see: "🎨 Generating alternatives with Colorgorical..."
5. After 2-5 seconds, 9 alternative colors appear

## Configuration

### Use LAB Fallback Instead of Colorgorical

In `ColorPaletteComparison.tsx`, line 41:
```typescript
const USE_COLORGORICAL = false; // Was: true
```

### Change Number of Alternatives

In `ColorPaletteComparison.tsx`, modify the API call:
```typescript
const alternatives = await generateColorgoricalAlternatives(
  originalPalette,
  index,
  12 // Changed from 9
);
```

Note: You'll also need to adjust the Grid layout for non-9 alternatives.

### Adjust Colorgorical Weights

In `colorgorical-proxy.js`, line 113-118:
```javascript
weights: {
  ciede2000: 0.5,        // Perceptual distance (was 1.0)
  nameDifference: 0.0,
  nameUniqueness: 0.0,
  pairPreference: 0.5    // Aesthetic preference (was 0.0)
}
```

## Comparison: Before vs After

### Before (LAB-based Generation)

- **Method**: Shifts in LAB color space
- **Systematic**: ±20 L, ±2.3 a, ±2.3 b
- **Speed**: Instant (client-side calculation)
- **Quality**: Consistent shifts, but doesn't consider palette context
- **Use case**: When Colorgorical unavailable or for debugging

### After (Colorgorical API)

- **Method**: Optimization algorithm considering all colors
- **Intelligent**: Maximizes distance while maintaining aesthetic harmony
- **Speed**: 2-5 seconds (server-side optimization)
- **Quality**: Perceptually optimized for the specific palette
- **Use case**: Production studies requiring high-quality alternatives

## Performance Considerations

### Current Setup
- **Per-request generation**: 2-5 seconds
- **No caching**: Same palette generates fresh each time
- **Sequential**: One color at a time

### Optimization Ideas

1. **Pre-generation**:
   ```javascript
   // Generate all alternatives when trial loads
   useEffect(() => {
     originalPalette.forEach((_, index) => {
       generateColorgoricalAlternatives(originalPalette, index);
     });
   }, [originalPalette]);
   ```

2. **Caching**:
   ```javascript
   const cache = {};
   const key = `${originalPalette.join(',')}-${index}`;
   if (cache[key]) return cache[key];
   ```

3. **Batch API**:
   Modify proxy to accept multiple indices:
   ```javascript
   POST /api/color-alternatives-batch
   {
     palette: [...],
     indices: [0, 1, 2, 3, 4]
   }
   ```

## Error Handling

The system handles these error scenarios:

1. **Colorgorical server down**: Automatically falls back to LAB generation
2. **Network timeout**: Shows error message, uses fallback
3. **Invalid response**: Logs error, uses fallback
4. **Invalid input**: Proxy returns 400 error with details

User always sees alternatives, even if Colorgorical fails.

## Data Collected

Each trial now records:
```json
{
  "paletteId": "1",
  "originalPalette": ["#58b5e1", "#41d26b", "#996f31"],
  "selectedColorIndex": 1,
  "selectedAlternative": "#5A8DB2",
  "newPalette": ["#58b5e1", "#5A8DB2", "#996f31"],
  "preference": 75,
  "timestamp": "2025-10-16T16:15:30.000Z"
}
```

This allows you to analyze:
- Which colors users modify most
- Whether Colorgorical alternatives are preferred
- Preference scores for different palette types

## Next Steps

### Immediate
- [x] Set up proxy server
- [x] Integrate with React component
- [x] Add error handling and loading states
- [x] Document setup process

### Future Enhancements
- [ ] Add caching for repeated trials
- [ ] Pre-generate alternatives at study start
- [ ] Add batch API for multiple colors
- [ ] Implement progressive loading (show first 3, then remaining 6)
- [ ] Add configuration UI for weights
- [ ] Track and log API performance metrics

### Research Questions
- Do Colorgorical alternatives lead to different choices?
- Are preference ratings higher for Colorgorical-generated palettes?
- What weights work best for different palette sizes?

## Troubleshooting

### "Cannot connect to Colorgorical API"

**Check**: Is Colorgorical running?
```bash
curl http://localhost:8888
```

**Fix**: Start Colorgorical:
```bash
cd /path/to/colorgorical
python run.py --server --port 8888
```

### Proxy server errors

**Check**: Logs in terminal running `node colorgorical-proxy.js`

**Common issues**:
- Port 3001 already in use: Change PORT in colorgorical-proxy.js
- Missing dependencies: Run `yarn install`

### Alternatives not appearing

**Check**: Browser console for errors (F12)

**Common causes**:
- CORS issues: Proxy should handle, check proxy logs
- Network timeout: Increase timeout in ColorPaletteComparison.tsx
- Invalid palette format: Check hex colors are properly formatted

## Production Checklist

- [ ] Move proxy server to production hosting
- [ ] Set up Colorgorical as a service
- [ ] Implement caching layer (Redis recommended)
- [ ] Add request rate limiting
- [ ] Set up monitoring and alerting
- [ ] Configure proper CORS for production domain
- [ ] Add authentication if needed
- [ ] Set up backup/fallback Colorgorical servers
- [ ] Document recovery procedures
- [ ] Load test the integration

## Credits

- **Colorgorical**: Connor Gramazio, David Laidlaw, Karen Schloss
- **Integration**: Built following the AI_AGENT_PROMPT.md specifications
- **Color conversion**: Uses standard sRGB → XYZ → LAB transformation

## Questions?

See `COLORGORICAL_SETUP.md` for detailed setup instructions and API reference.
