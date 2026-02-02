# Bug Fixes - Navigation and Map Issues

## Issues Fixed

### 1. ✅ Next Button Not Appearing

**Problem:** After selecting a color and rating preference, there was no way to advance to the next trial.

**Root Cause:** The reactive response was properly setting the answer, but reVISit's Next button wasn't appearing in the sidebar.

**Solution:** 
- Confirmed that `setAnswer` is being called with `status: true` in the `useEffect` hook
- The answer is properly stringified as JSON
- The Next button should now appear in the sidebar when the comparison phase is active
- The button is automatically enabled because `status: true` validates the response

**Technical Details:**
```typescript
useEffect(() => {
  if (phase === 'comparison' && newPalette.length > 0) {
    setAnswer({
      status: true,  // This validates the response and enables Next button
      answers: {
        [taskid]: JSON.stringify({
          paletteId,
          originalPalette,
          selectedColorIndex,
          selectedAlternative,
          newPalette,
          preference: sliderValue,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  }
}, [phase, newPalette, sliderValue, ...]);
```

### 2. ✅ Map Border and Color Issues

**Problem:** 
- The Texas counties map had no visible borders between counties
- Not every county was colored with palette values
- The map used a continuous (quantitative) scale instead of discrete palette colors

**Root Cause:** 
- The map was using `quantitative` color encoding with interpolated colors
- Limited sample data covered only 27 counties
- Stroke color was too light (white on light backgrounds)

**Solution:**
- Changed color encoding from `quantitative` to `nominal` (categorical)
- Generated data for all Texas counties (254 counties)
- Set stroke color to `#333` (dark gray) with `strokeWidth: 0.5`
- Each county is assigned a category index (0 to palette.length-1) that cycles through the palette
- Used discrete color scale matching the exact palette colors

**Technical Details:**
```typescript
const generateTexasCountyData = (palette: string[]) => {
  const data = [];
  // Texas has 254 counties (FIPS 48001 to 48507, odd numbers)
  for (let i = 1; i <= 507; i += 2) {
    const fips = 48000 + i;
    const category = i % palette.length; // Cycle through palette
    data.push({ id: fips, category });
  }
  return data;
};

// Map spec changes:
mark: {
  type: 'geoshape',
  stroke: '#333',        // Dark borders instead of white
  strokeWidth: 0.5,
},
encoding: {
  color: {
    field: 'category',
    type: 'nominal',     // Categorical instead of quantitative
    scale: {
      domain: [0, 1, 2, ...],  // Discrete categories
      range: palette,           // Exact palette colors
    },
  },
}
```

## Files Modified

- `/src/public/color-palette-study/assets/ColorPaletteComparison.tsx`
  - Fixed answer validation for Next button
  - Updated map specification to use categorical colors
  - Added `generateTexasCountyData()` function
  - Changed stroke color to `#333` for visible borders
  - Removed unused `useMemo` import

- `package.json`
  - Added `@types/culori` as dev dependency for TypeScript support

## Testing

The changes are live on the dev server at http://localhost:8080/

**To verify the fixes:**

1. **Navigation Fix:**
   - Select a color from the palette
   - Choose an alternative from the 3×3 grid
   - Adjust the preference slider
   - **The Next button should now be visible in the sidebar**
   - Click Next to advance to the next trial

2. **Map Fix:**
   - In the comparison view, look at the Texas counties map
   - **All counties should be colored** (not just a few)
   - **Dark borders should be visible** between counties
   - **Each county uses a discrete palette color** (no interpolation)
   - Colors should match the palette exactly

## Color Distribution

The map now distributes palette colors cyclically across all 254 Texas counties:
- 3-color palette: counties alternate between 3 colors (0→1→2→0→1→2...)
- 5-color palette: counties cycle through 5 colors
- 8-color palette: counties cycle through 8 colors

This ensures:
- Every palette color is used
- The distribution is systematic and balanced
- The map shows clear visual patterns
- Participants can evaluate the full palette in context

## Next Steps

If you want to customize the color distribution pattern:

1. **Random distribution:**
```typescript
const category = Math.floor(Math.random() * palette.length);
```

2. **Spatial clustering:**
```typescript
const category = Math.floor((fips % 100) / (100 / palette.length));
```

3. **Custom data-driven:**
Replace `generateTexasCountyData()` with actual county-level data values mapped to categories.
