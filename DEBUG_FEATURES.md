# Debug Features for Color Palette Study

## Overview
Debug capabilities have been added to help verify data flow through the Colorgorical API integration.

## Features

### 1. Console Debugging
When you click on a color to generate alternatives, detailed information is logged to the browser console with styled, colored output.

#### What's Logged:
- **Selected Color**: The color you clicked on (with index and color visualization)
- **Fixed Colors**: The 4 colors that are kept in the palette (visualized in console)
- **Request Payload**: Exact data sent to Colorgorical API
- **API Response**: All 9 generated alternatives (with color visualization)
- **Method Used**: Whether Colorgorical API was used or LAB fallback

#### Example Console Output:
```
🎨 COLOR SELECTION DEBUG 🎨
■ Selected Color (index 2): #3498db
🔒 Fixed Colors (kept in palette):
  ■ #e74c3c
  ■ #f39c12
  ■ #2ecc71
  ■ #9b59b6
📡 Calling Colorgorical API...
Request payload: {
  selectedColorIndex: 2,
  paletteSize: 5,
  numAlternatives: 9,
  fixedColors: ["#e74c3c", "#f39c12", "#2ecc71", "#9b59b6"]
}
✅ Colorgorical API Response:
Generated 9 alternatives:
  ■ Alt 1: #5dade2
  ■ Alt 2: #85c1e9
  ...
─────────────────────────────────
```

### 2. Debug Panel (Optional UI Component)
An optional visual debug panel can be displayed in the study interface.

#### Enabling the Debug Panel:
In `ColorPaletteComparison.tsx`, change line 42:
```typescript
const SHOW_DEBUG_PANEL = true;  // Change to true to enable
```

#### What's Displayed:
- **Selected Color**: Shows the color swatch and hex code with its index
- **Fixed Colors**: Displays all 4 colors that are held constant
- **Generated Alternatives**: Shows all 9 alternatives with color swatches
- **Method Indicator**: Visual badge showing whether Colorgorical API or LAB fallback was used

#### Panel Location:
The debug panel appears at the top of the selection phase, before the color selection grid.

## Console Color Visualization

The console uses CSS styling to show actual colors:
```javascript
console.log(`%c■ ${color}`, `color: ${color}; font-weight: bold;`);
```

This renders colored squares (■) in the console, making it easy to visually verify colors.

## Viewing Debug Output

### In Chrome DevTools:
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Click on a color in the study
4. See styled debug output with color visualization

### In Firefox DevTools:
1. Open DevTools (F12 or Cmd+Option+K)
2. Go to Console tab
3. Click on a color
4. Color styling is supported

### In Safari:
1. Enable Developer Menu (Preferences → Advanced → Show Develop menu)
2. Open Web Inspector (Cmd+Option+I)
3. Go to Console tab
4. Color styling is supported

## Data Flow Verification

Use the debug output to verify:

1. **Correct Color Selection**: Confirm the right color index was selected
2. **Fixed Colors Logic**: Verify that the selected color is excluded from fixed colors
3. **API Request**: Check that the payload contains correct data structure
4. **API Response**: Ensure 9 alternatives are returned
5. **Fallback Behavior**: See when LAB fallback is used vs. Colorgorical API

## Disabling Debug Features

### Disable Console Logging:
In `ColorPaletteComparison.tsx`, set line 41:
```typescript
const USE_COLORGORICAL = false;  // Disables API and debug logging
```

Or comment out/remove console.log statements in `handleColorClick()` function.

### Disable Debug Panel:
In `ColorPaletteComparison.tsx`, set line 42:
```typescript
const SHOW_DEBUG_PANEL = false;
```

## ESLint Configuration

Console logging has been enabled in `eslint.config.js`:
```javascript
'no-console': ['error', {
  allow: ['warn', 'error', 'log'],  // 'log' added for debugging
}],
```

For production, you may want to remove 'log' from the allowed methods and clean up console statements.

## Performance Notes

- Console logging has minimal performance impact
- Debug panel adds ~100 lines of JSX but only renders when enabled
- Color visualization in console is browser-native CSS styling

## Troubleshooting

### Console colors not showing?
- Make sure you're using a modern browser (Chrome, Firefox, Safari)
- Some browser extensions may strip console styling

### Debug panel not appearing?
- Verify `SHOW_DEBUG_PANEL = true`
- Make sure you've clicked a color (panel only shows after selection)
- Check browser console for React errors

### No console output?
- Open browser DevTools Console tab
- Make sure `USE_COLORGORICAL = true` (debug logging is in that code path)
- Check that console.log is not filtered in DevTools
